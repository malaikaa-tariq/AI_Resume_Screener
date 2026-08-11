import os
import uuid

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    PointStruct,
    VectorParams,
)

from embedding_service import EMBEDDING_DIMENSION


load_dotenv()

QDRANT_URL = os.getenv(
    "QDRANT_URL",
    "http://localhost:6333",
)
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY") or None
COLLECTION_NAME = os.getenv(
    "QDRANT_COLLECTION_NAME",
    "study_chunks",
)

_client: QdrantClient | None = None


def get_client() -> QdrantClient:
    global _client

    if _client is None:
        _client = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY,
            timeout=30,
        )

    return _client


def ensure_collection() -> None:
    client = get_client()

    if not client.collection_exists(
        collection_name=COLLECTION_NAME
    ):
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=EMBEDDING_DIMENSION,
                distance=Distance.COSINE,
            ),
        )


def store_embedded_chunks(
    embedded_chunks: list[dict],
    source: str = "uploaded_doc",
) -> int:
    ensure_collection()
    client = get_client()
    points: list[PointStruct] = []

    for index, chunk in enumerate(embedded_chunks):
        embedding = chunk.get("embedding", [])

        if len(embedding) != EMBEDDING_DIMENSION:
            raise ValueError(
                f"Embedding must contain "
                f"{EMBEDDING_DIMENSION} values."
            )

        point_id = chunk.get("chunk_id") or str(uuid.uuid4())

        points.append(
            PointStruct(
                id=point_id,
                vector=embedding,
                payload={
                    "chunk_id": point_id,
                    "chunk_index": chunk.get(
                        "chunk_index",
                        index,
                    ),
                    "text": chunk.get("text", ""),
                    "token_count": chunk.get(
                        "token_count",
                        0,
                    ),
                    "source": chunk.get("source", source),
                },
            )
        )

    if not points:
        return 0

    client.upsert(
        collection_name=COLLECTION_NAME,
        points=points,
        wait=True,
    )

    return len(points)


def retrieve_relevant_chunks(
    query_embedding: list[float],
    top_k: int = 5,
) -> list[dict]:
    if len(query_embedding) != EMBEDDING_DIMENSION:
        raise ValueError(
            f"Query embedding must contain "
            f"{EMBEDDING_DIMENSION} values."
        )

    ensure_collection()
    client = get_client()

    response = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_embedding,
        with_payload=True,
        limit=top_k,
    )

    return [
        {
            "text": (result.payload or {}).get("text", ""),
            "source": (result.payload or {}).get("source"),
            "chunk_id": (result.payload or {}).get("chunk_id"),
            "chunk_index": (result.payload or {}).get(
                "chunk_index"
            ),
            "token_count": (result.payload or {}).get(
                "token_count"
            ),
            "score": round(result.score, 4),
        }
        for result in response.points
    ]