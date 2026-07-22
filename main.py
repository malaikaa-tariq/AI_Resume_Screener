import os
import tempfile
from pathlib import Path
from typing import Annotated

from dotenv import load_dotenv
from fastapi import (
    FastAPI,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool

from analyzer import extract_resume_text
from gemini_service import (
    GeminiAnalysisError,
    GeminiConfigurationError,
    analyze_with_gemini,
)
from schemas import AnalysisResult


load_dotenv()

app = FastAPI(
    title="AI Resume Screener API",
    description=(
        "Upload a PDF or DOCX resume and compare it "
        "with a job description using Gemini."
    ),
    version="1.0.0",
)


frontend_url = os.getenv(
    "FRONTEND_URL",
    "http://localhost:3000",
).rstrip("/")

allowed_origins = [
    frontend_url,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(allowed_origins)),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


ALLOWED_EXTENSIONS = {".pdf", ".docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024
CHUNK_SIZE = 1024 * 1024


@app.get("/")
def read_root() -> dict[str, str]:
    """Return a basic API status message."""

    return {
        "message": "AI Resume Screener backend is running."
    }


@app.get("/health")
def health_check() -> dict[str, str]:
    """Return the API health status."""

    return {"status": "healthy"}


@app.post(
    "/analyze",
    response_model=AnalysisResult,
    status_code=status.HTTP_200_OK,
)
async def analyze_resume(
    resume: Annotated[
        UploadFile,
        File(description="Resume file in PDF or DOCX format"),
    ],
    job_description: Annotated[
        str,
        Form(description="Job description text"),
    ],
) -> AnalysisResult:
    """
    Extract resume text and compare it with a job description.
    """

    filename = resume.filename or ""
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF and DOCX resume files are supported.",
        )

    cleaned_job_description = job_description.strip()

    if not cleaned_job_description:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description cannot be empty.",
        )

    temp_path: Path | None = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension,
        ) as temporary_file:
            temp_path = Path(temporary_file.name)
            total_size = 0

            while True:
                chunk = await resume.read(CHUNK_SIZE)

                if not chunk:
                    break

                total_size += len(chunk)

                if total_size > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Resume file must not exceed 10 MB.",
                    )

                temporary_file.write(chunk)

        if total_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded resume file is empty.",
            )

        resume_text = await run_in_threadpool(
            extract_resume_text,
            temp_path,
            extension,
        )

        if not resume_text or not resume_text.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "No readable text could be extracted "
                    "from the resume."
                ),
            )

        result = await run_in_threadpool(
            analyze_with_gemini,
            resume_text,
            cleaned_job_description,
        )

        return result

    except HTTPException:
        raise

    except GeminiConfigurationError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error

    except GeminiAnalysisError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(error),
        ) from error

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Resume analysis failed unexpectedly.",
        ) from error

    finally:
        await resume.close()

        if temp_path is not None:
            temp_path.unlink(missing_ok=True)