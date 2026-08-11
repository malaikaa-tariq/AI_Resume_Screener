from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from chunking_service import process_document_chunks
from embedding_service import (
    EMBEDDING_DIMENSION,
    EMBEDDING_MODEL,
    generate_chunk_embeddings,
    generate_query_embedding,
)
from qdrant_service import (
    retrieve_relevant_chunks,
    store_embedded_chunks,
)


router = APIRouter(
    prefix="/api/v1/study",
    tags=["study pipeline"],
)


class StudyPipelineRequest(BaseModel):
    text: str = Field(
        min_length=1,
        description="Extracted study-document text",
    )
    source: str = Field(
        default="uploaded_doc",
        min_length=1,
        description="Source document name or tag",
    )


class StudyQueryRequest(BaseModel):
    query: str = Field(
        min_length=1,
        description="Topic or question to retrieve",
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Number of relevant chunks to return",
    )


@router.post("/process")
def process_study_document(
    payload: StudyPipelineRequest,
) -> dict:
    cleaned_text = payload.text.strip()
    cleaned_source = payload.source.strip()

    if not cleaned_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Document text cannot be empty.",
        )

    if not cleaned_source:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Document source cannot be empty.",
        )

    try:
        chunks = process_document_chunks(cleaned_text)

        if not chunks:
            raise ValueError("No document chunks could be created.")

        embedded_chunks = generate_chunk_embeddings(chunks)
        stored_count = store_embedded_chunks(
            embedded_chunks,
            source=cleaned_source,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Study-document ingestion failed: {error}",
        ) from error

    return {
        "message": "Document processed and stored in Qdrant successfully.",
        "source": cleaned_source,
        "chunks_created": len(embedded_chunks),
        "vectors_stored": stored_count,
        "embedding_model": EMBEDDING_MODEL,
        "embedding_dimension": EMBEDDING_DIMENSION,
    }


@router.post("/retrieve")
def retrieve_study_chunks(
    payload: StudyQueryRequest,
) -> dict:
    cleaned_query = payload.query.strip()

    if not cleaned_query:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Search query cannot be empty.",
        )

    try:
        query_embedding = generate_query_embedding(cleaned_query)
        results = retrieve_relevant_chunks(
            query_embedding=query_embedding,
            top_k=payload.top_k,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Study retrieval failed: {error}",
        ) from error

    return {
        "query": cleaned_query,
        "top_k": payload.top_k,
        "result_count": len(results),
        "results": results,
    }