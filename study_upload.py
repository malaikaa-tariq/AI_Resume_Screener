import io
import os
import re
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from pypdf import PdfReader
from pypdf.errors import PdfReadError


router = APIRouter(prefix="/api/v1/study", tags=["study documents"])

ALLOWED_EXTENSIONS = {".pdf", ".txt"}
DEFAULT_MAX_UPLOAD_SIZE_MB = 10


class StudyDocumentMetadata(BaseModel):
    filename: str
    content_type: str
    size_bytes: int = Field(ge=1)
    character_count: int = Field(ge=1)
    word_count: int = Field(ge=1)
    page_count: int | None = Field(default=None, ge=1)


class StudyDocumentUploadResponse(BaseModel):
    message: str
    document: StudyDocumentMetadata
    text: str


def normalize_study_text(text: str) -> str:
    """Normalize whitespace while preserving paragraph boundaries for chunking."""

    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
    paragraphs: list[str] = []
    current: list[str] = []

    for line in lines:
        if line:
            current.append(line)
        elif current:
            paragraphs.append(" ".join(current))
            current = []

    if current:
        paragraphs.append(" ".join(current))

    return "\n\n".join(paragraphs).strip()


def decode_text_file(content: bytes) -> str:
    for encoding in ("utf-8-sig", "utf-8", "cp1252"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="The text-file encoding is unsupported. Upload a UTF-8 text file.",
    )


def extract_pdf_text(content: bytes) -> tuple[str, int]:
    try:
        reader = PdfReader(io.BytesIO(content))
        pages = [(page.extract_text() or "").strip() for page in reader.pages]
    except (PdfReadError, ValueError, OSError) as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The PDF is corrupted, encrypted, or cannot be read.",
        ) from error

    return "\n\n".join(page for page in pages if page), len(reader.pages)


def get_study_upload_limit_mb() -> int:
    try:
        value = int(os.getenv("STUDY_MAX_UPLOAD_SIZE_MB", DEFAULT_MAX_UPLOAD_SIZE_MB))
    except ValueError:
        return DEFAULT_MAX_UPLOAD_SIZE_MB

    return min(max(value, 1), 50)


@router.post(
    "/documents/upload",
    response_model=StudyDocumentUploadResponse,
    summary="Upload and extract study notes or a syllabus",
)
async def upload_study_document(
    file: Annotated[UploadFile, File(description="A PDF or UTF-8 text file")],
) -> StudyDocumentUploadResponse:
    filename = Path(file.filename or "").name
    extension = Path(filename).suffix.lower()

    if not filename or extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only .pdf and .txt study documents are supported.",
        )

    max_size_mb = get_study_upload_limit_mb()
    max_bytes = max_size_mb * 1024 * 1024
    content = await file.read(max_bytes + 1)
    await file.close()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The uploaded study document is empty.",
        )
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Study document must not exceed {max_size_mb} MB.",
        )

    if extension == ".pdf":
        raw_text, page_count = extract_pdf_text(content)
        content_type = "application/pdf"
    else:
        raw_text = decode_text_file(content)
        page_count = None
        content_type = "text/plain"

    text = normalize_study_text(raw_text)
    if not text:
        detail = "No readable text was found in the study document."
        if extension == ".pdf":
            detail += " Scanned or image-only PDFs require OCR and are not supported yet."
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
        )

    return StudyDocumentUploadResponse(
        message="Study document uploaded and text extracted successfully.",
        document=StudyDocumentMetadata(
            filename=filename,
            content_type=content_type,
            size_bytes=len(content),
            character_count=len(text),
            word_count=len(text.split()),
            page_count=page_count,
        ),
        text=text,
    )

