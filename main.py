import logging
import os
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from fastapi import (
    FastAPI,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware

from analyzer import extract_resume_text
from gemini_service import (
    GeminiAnalysisError,
    GeminiConfigurationError,
    analyze_with_gemini,
)
from schemas import AnalysisResult


load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}

frontend_urls = [
    url.strip()
    for url in os.getenv(
        "FRONTEND_URL",
        "http://localhost:3000",
    ).split(",")
    if url.strip()
]


app = FastAPI(
    title="AI Resume Screener API",
    description=(
        "Upload a resume and compare it with a job description "
        "using Gemini."
    ),
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_urls,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root() -> dict:
    return {
        "message": "AI Resume Screener backend is running.",
        "documentation": "/docs",
    }


@app.get("/health")
def health_check() -> dict:
    return {
        "status": "healthy",
    }


def get_file_extension(upload: UploadFile) -> str:
    """
    Extract and validate the uploaded file extension.
    """

    filename = upload.filename or ""

    extension = (
        Path(filename)
        .suffix
        .lower()
        .lstrip(".")
    )

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported file format. "
                "Please upload a PDF, DOCX or TXT file."
            ),
        )

    return extension


async def save_upload_temporarily(
    upload: UploadFile,
) -> tuple[Path, str]:
    """
    Validate an uploaded file and save it temporarily.
    """

    extension = get_file_extension(upload)

    file_content = await upload.read(
        MAX_FILE_SIZE + 1
    )

    if not file_content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="The uploaded file exceeds the 10 MB limit.",
        )

    temporary_file = tempfile.NamedTemporaryFile(
        mode="wb",
        delete=False,
        suffix=f".{extension}",
    )

    try:
        temporary_file.write(file_content)
        temporary_path = Path(
            temporary_file.name
        )
    finally:
        temporary_file.close()
        await upload.close()

    return temporary_path, extension


async def extract_uploaded_file_text(
    upload: UploadFile,
    file_description: str,
) -> str:
    """
    Save an uploaded file, extract its text and remove the
    temporary file afterward.
    """

    temporary_path: Path | None = None

    try:
        (
            temporary_path,
            extension,
        ) = await save_upload_temporarily(
            upload
        )

        extracted_text = extract_resume_text(
            temporary_path,
            extension,
        ).strip()

        if not extracted_text:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"No readable text was found in the "
                    f"{file_description}. The file may be "
                    "image-only or empty."
                ),
            )

        return extracted_text

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error

    except Exception as error:
        logger.exception(
            "Failed to extract text from %s.",
            file_description,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"An unexpected error occurred while reading "
                f"the {file_description}."
            ),
        ) from error

    finally:
        if (
            temporary_path is not None
            and temporary_path.exists()
        ):
            temporary_path.unlink(
                missing_ok=True
            )


@app.post(
    "/analyze",
    response_model=AnalysisResult,
)
async def analyze_resume_endpoint(
    resume_file: UploadFile = File(
        ...,
        description=(
            "Candidate resume in PDF, DOCX or TXT format."
        ),
    ),
    job_description: str = Form(
        default="",
        description=(
            "Job description pasted as text."
        ),
    ),
    job_description_file: UploadFile | None = File(
        default=None,
        description=(
            "Optional job description file in PDF, DOCX or TXT format."
        ),
    ),
) -> AnalysisResult:
    """
    Extract resume text and compare it with a job description.

    The job description can be pasted as text or uploaded as a
    separate file.
    """

    pasted_job_description = (
        job_description.strip()
    )

    has_job_file = (
        job_description_file is not None
        and bool(job_description_file.filename)
    )

    if pasted_job_description and has_job_file:
        raise HTTPException(
            status_code=400,
            detail=(
                "Provide the job description either as pasted "
                "text or as an uploaded file, not both."
            ),
        )

    if not pasted_job_description and not has_job_file:
        raise HTTPException(
            status_code=422,
            detail=(
                "A job description is required. Paste the text "
                "or upload a job description file."
            ),
        )

    resume_text = await extract_uploaded_file_text(
        upload=resume_file,
        file_description="resume",
    )

    if has_job_file:
        final_job_description = (
            await extract_uploaded_file_text(
                upload=job_description_file,
                file_description="job description",
            )
        )
    else:
        final_job_description = (
            pasted_job_description
        )

    try:
        return analyze_with_gemini(
            resume_text=resume_text,
            job_description=final_job_description,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error

    except GeminiConfigurationError as error:
        logger.exception(
            "Gemini configuration error."
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "The AI service is not configured correctly."
            ),
        ) from error

    except GeminiAnalysisError as error:
        logger.exception(
            "Gemini analysis failed."
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "The AI service could not complete the analysis. "
                "Please try again shortly."
            ),
        ) from error

    except Exception as error:
        logger.exception(
            "Unexpected resume analysis error."
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "An unexpected error occurred during analysis."
            ),
        ) from error