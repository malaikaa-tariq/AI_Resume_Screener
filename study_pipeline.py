import os
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from chunking_service import process_document_chunks
from embedding_service import (
    generate_chunk_embeddings,
    EMBEDDING_DIMENSION,
    EMBEDDING_MODEL,
)
from qdrant_service import store_embedded_chunks, retrieve_relevant_chunks

load_dotenv()

router = APIRouter(prefix="/api/v1/study", tags=["study pipeline"])


class StudyPipelineRequest(BaseModel):
    text: str = Field(..., description="Raw text of the study document or syllabus")
    source: str = Field(default="uploaded_doc", description="Source document name or tag")


class StudyQueryRequest(BaseModel):
    query: str = Field(..., description="Query topic or question to search for")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of top relevant chunks to retrieve")


@router.post("/process")
def process_study_document(payload: StudyPipelineRequest):
    try:
        chunks = process_document_chunks(payload.text)
        embedded_chunks = generate_chunk_embeddings(chunks)
        stored = store_embedded_chunks(embedded_chunks, source=payload.source)
    except Exception as exc:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, f"Ingestion failed: {exc}"
        )
    return {
        "message": "Document processed and stored in Qdrant",
        "chunks_created": len(chunks),
        "vectors_stored": stored,
        "embedding_model": EMBEDDING_MODEL,
        "embedding_dimension": EMBEDDING_DIMENSION,
    }


@router.post("/retrieve")
def retrieve_study_chunks(payload: StudyQueryRequest):
    try:
        embedded_query = generate_chunk_embeddings(
            [{"text": payload.query, "chunk_index": 0}]
        )
        query_embedding = embedded_query[0]["embedding"]
        results = retrieve_relevant_chunks(query_embedding, top_k=payload.top_k)
    except Exception as exc:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, f"Retrieval failed: {exc}"
        )

    if not results:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "No relevant chunks found. Pehle document process karein.",
        )
    return {"query": payload.query, "top_k": payload.top_k, "results": results}