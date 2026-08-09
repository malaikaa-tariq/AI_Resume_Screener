from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from chunking_service import process_document_chunks
from embedding_service import (
    EMBEDDING_DIMENSION,
    EMBEDDING_MODEL,
    generate_chunk_embeddings,
)


router = APIRouter(
    prefix="/api/v1/study",
    tags=["study pipeline"],
)


class StudyPipelineRequest(BaseModel):
    text: str = Field(min_length=1)


@router.post("/process")
def process_study_document(request: StudyPipelineRequest) -> dict:
    cleaned_text = request.text.strip()

    if not cleaned_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Document text cannot be empty.",
        )

    chunks = process_document_chunks(cleaned_text)

    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No document chunks could be created.",
        )

    try:
        embedded_chunks = generate_chunk_embeddings(chunks)
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Embedding generation failed: {error}",
        ) from error

    return {
        "message": "Chunking and embedding completed successfully.",
        "chunk_count": len(embedded_chunks),
        "embedding_model": EMBEDDING_MODEL,
        "embedding_dimension": EMBEDDING_DIMENSION,
        "chunks": embedded_chunks,
    }