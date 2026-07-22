import logging
import mimetypes
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
    extract_text_from_media,
)
from schemas import AnalysisResult


load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


app = FastAPI(
    title="AI Resume Screener API",
    description=(
        "Analyze PDF, DOCX, TXT, or image resumes against "
        "pasted or uploaded job descriptions."
    ),
    version="3.1.0",
)


def get_allowed_origins() -> list[str]:
    """
    Read allowed frontend origins from environment variables.

    FRONTEND_URL supports one main frontend address.

    FRONTEND_ORIGINS can contain multiple comma-separated addresses.
    Example:
    FRONTEND_ORIGINS=http://localhost:3000,http://10.184.39.178:3000
    """

    default_origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    }

    frontend_url = os.getenv(
        "FRONTEND_URL",
        "http://localhost:3000",
    ).strip().rstrip("/")

    if frontend_url:
        default_origins.add(frontend_url)

    extra_origins = os.getenv(
        "FRONTEND_ORIGINS",
        "",
    )

    for origin in extra_origins.split(","):
        cleaned_origin = origin.strip().rstrip("/")

        if cleaned_origin:
            default_origins.add(cleaned_origin)

    return sorted(default_origins)


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),

    # Allow localhost and private-network frontend addresses during development.
    allow_origin_regex=(
        r"^https?://("
        r"localhost|"
        r"127\.0\.0\.1|"
        r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
        r"192\.168\.\d{1,3}\.\d{1,3}|"
        r"172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}"
        r"):3000$"
    ),

    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "OPTIONS",
    ],
    allow_headers=["*"],
)


IMAGE_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
}

RESUME_EXTENSIONS = {
    ".pdf",
    ".docx",
} | IMAGE_EXTENSIONS

JOB_FILE_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".txt",
} | IMAGE_EXTENSIONS

MAX_RESUME_SIZE = 50 * 1024 * 1024
MAX_JOB_FILE_SIZE = 20 * 1024 * 1024
CHUNK_SIZE = 1024 * 1024


@app.get("/")
def read_root() -> dict[str, str]:
    return {
        "message": "AI Resume Screener backend is running."
    }


@app.get("/health")
def health_check() -> dict[str, str]:
    return {
        "status": "healthy"
    }


async def save_upload(
    upload: UploadFile,
    allowed_extensions: set[str],
    max_size: int,
    label: str,
) -> tuple[Path, str]:
    """
    Save an uploaded file to a temporary location while enforcing
    file-extension and size restrictions.
    """

    filename = upload.filename or ""
    extension = Path(filename).suffix.lower()

    if extension not in allowed_extensions:
        allowed = ", ".join(
            sorted(
                item.lstrip(".").upper()
                for item in allowed_extensions
            )
        )

        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"{label} must be one of these formats: "
                f"{allowed}."
            ),
        )

    temporary_path: Path | None = None
    total_size = 0

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension,
        ) as temporary_file:
            temporary_path = Path(temporary_file.name)

            while True:
                chunk = await upload.read(CHUNK_SIZE)

                if not chunk:
                    break

                total_size += len(chunk)

                if total_size > max_size:
                    maximum_mb = max_size // (1024 * 1024)

                    raise HTTPException(
                        status_code=(
                            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
                        ),
                        detail=(
                            f"{label} must not exceed "
                            f"{maximum_mb} MB."
                        ),
                    )

                temporary_file.write(chunk)

        if total_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"The uploaded {label.lower()} file is empty."
                ),
            )

        return temporary_path, extension

    except Exception:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)

        raise


def read_text_file(path: Path) -> str:
    """
    Read a TXT file using common encodings.
    """

    encodings = [
        "utf-8",
        "utf-8-sig",
        "cp1252",
        "latin-1",
    ]

    for encoding in encodings:
        try:
            return path.read_text(
                encoding=encoding,
            ).strip()

        except UnicodeDecodeError:
            continue

    raise ValueError(
        "The text file could not be decoded."
    )


def extract_uploaded_text(
    path: Path,
    extension: str,
) -> str:
    """
    Extract text from PDF, DOCX, TXT, or image files.

    Images and scanned PDFs use Gemini document understanding.
    """

    normalized_extension = extension.lower()

    if normalized_extension == ".txt":
        return read_text_file(path)

    mime_type = (
        mimetypes.guess_type(
            f"uploaded_file{normalized_extension}"
        )[0]
        or "application/octet-stream"
    )

    if normalized_extension in IMAGE_EXTENSIONS:
        return extract_text_from_media(
            path,
            mime_type,
        )

    if normalized_extension == ".docx":
        extracted_text = extract_resume_text(
            path,
            normalized_extension,
        )

        if not extracted_text.strip():
            raise ValueError(
                "No readable text could be extracted "
                "from the DOCX file."
            )

        return extracted_text.strip()

    if normalized_extension == ".pdf":
        try:
            extracted_text = extract_resume_text(
                path,
                normalized_extension,
            )

            if extracted_text.strip():
                return extracted_text.strip()

        except Exception as error:
            logger.warning(
                "Local PDF extraction failed. "
                "Trying Gemini extraction instead: %s",
                error,
            )

        return extract_text_from_media(
            path,
            "application/pdf",
        )

    raise ValueError(
        f"Unsupported uploaded file type: {normalized_extension}"
    )


@app.post(
    "/analyze",
    response_model=AnalysisResult,
    status_code=status.HTTP_200_OK,
)
async def analyze_resume(
    resume: Annotated[
        UploadFile,
        File(
            description=(
                "Resume in PDF, DOCX, PNG, JPG, JPEG, "
                "or WEBP format"
            )
        ),
    ],
    job_description: Annotated[
        str,
        Form(
            description=(
                "Optional pasted job-description text"
            )
        ),
    ] = "",
    job_description_file: Annotated[
        UploadFile | None,
        File(
            description=(
                "Optional PDF, DOCX, TXT, PNG, JPG, JPEG, "
                "or WEBP job-description file"
            )
        ),
    ] = None,
) -> AnalysisResult:
    resume_path: Path | None = None
    job_path: Path | None = None

    try:
        logger.info(
            "Starting analysis for resume: %s",
            resume.filename,
        )

        resume_path, resume_extension = await save_upload(
            upload=resume,
            allowed_extensions=RESUME_EXTENSIONS,
            max_size=MAX_RESUME_SIZE,
            label="Resume",
        )

        resume_text = await run_in_threadpool(
            extract_uploaded_text,
            resume_path,
            resume_extension,
        )

        if not resume_text.strip():
            raise HTTPException(
                status_code=(
                    status.HTTP_422_UNPROCESSABLE_ENTITY
                ),
                detail=(
                    "No readable text could be extracted "
                    "from the resume."
                ),
            )

        job_parts: list[str] = []

        cleaned_pasted_job = job_description.strip()

        if cleaned_pasted_job:
            job_parts.append(cleaned_pasted_job)

        if (
            job_description_file is not None
            and job_description_file.filename
        ):
            job_path, job_extension = await save_upload(
                upload=job_description_file,
                allowed_extensions=JOB_FILE_EXTENSIONS,
                max_size=MAX_JOB_FILE_SIZE,
                label="Job description",
            )

            uploaded_job_text = await run_in_threadpool(
                extract_uploaded_text,
                job_path,
                job_extension,
            )

            if uploaded_job_text.strip():
                job_parts.append(
                    uploaded_job_text.strip()
                )

        cleaned_job_description = "\n\n".join(
            job_parts
        ).strip()

        if not cleaned_job_description:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Paste a job description or upload a "
                    "supported job-description file."
                ),
            )

        result = await run_in_threadpool(
            analyze_with_gemini,
            resume_text,
            cleaned_job_description,
        )

        logger.info(
            "Resume analysis completed successfully."
        )

        return result

    except HTTPException:
        raise

    except GeminiConfigurationError as error:
        logger.exception(
            "Gemini configuration error."
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=str(error),
        ) from error

    except GeminiAnalysisError as error:
        logger.exception(
            "Gemini analysis error."
        )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(error),
        ) from error

    except ValueError as error:
        logger.exception(
            "Uploaded document validation error."
        )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except Exception as error:
        logger.exception(
            "Unexpected resume-analysis failure: %s",
            error,
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Resume analysis failed unexpectedly. "
                "Check the FastAPI terminal for details."
            ),
        ) from error

    finally:
        await resume.close()

        if job_description_file is not None:
            await job_description_file.close()

        if resume_path is not None:
            resume_path.unlink(
                missing_ok=True
            )

        if job_path is not None:
            job_path.unlink(
                missing_ok=True
            )