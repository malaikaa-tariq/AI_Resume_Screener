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
from study_plan_service import (
    StudyPlan,
    StudyPlanConfigurationError,
    StudyPlanGenerationError,
    generate_study_plan,
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


class StudyPlanRequest(BaseModel):
    topic: str = Field(
        min_length=1,
        description="Topic to build a study plan for",
    )
    days: int = Field(default=3, ge=1, le=30)
    minutes_per_day: int = Field(default=45, ge=15, le=480)
    top_k: int = Field(default=5, ge=1, le=10)


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


@router.post("/plan", response_model=StudyPlan)
def create_study_plan(payload: StudyPlanRequest) -> StudyPlan:
    cleaned_topic = payload.topic.strip()

    if not cleaned_topic:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Study-plan topic cannot be empty.",
        )

    try:
        query_embedding = generate_query_embedding(cleaned_topic)
        retrieved_chunks = retrieve_relevant_chunks(
            query_embedding=query_embedding,
            top_k=payload.top_k,
        )

        if not retrieved_chunks:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "No relevant uploaded study content was found "
                    "for this topic."
                ),
            )

        return generate_study_plan(
            topic=cleaned_topic,
            retrieved_chunks=retrieved_chunks,
            days=payload.days,
            minutes_per_day=payload.minutes_per_day,
        )

    except HTTPException:
        raise
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error
    except StudyPlanConfigurationError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error
    except StudyPlanGenerationError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(error),
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Study-plan generation failed: {error}",
        ) from error