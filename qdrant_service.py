import os
import uuid

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from embedding_service import EMBEDDING_DIMENSION

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY") or None
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION_NAME", "study_chunks")

_client: QdrantClient | None = None


def get_client() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=30)
    return _client


def ensure_collection() -> None:
    """Collection na ho to create karo — dimension embedding model se match honi chahiye."""
    client = get_client()
    if not client.collection_exists(COLLECTION_NAME):
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=EMBEDDING_DIMENSION, distance=Distance.COSINE),
        )


def store_embedded_chunks(embedded_chunks: list[dict], source: str = "uploaded_doc") -> int:
    ensure_collection()
    client = get_client()

    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=chunk["embedding"],
            payload={
                "text": chunk.get("text", ""),
                "source": chunk.get("source", source),
                "chunk_index": chunk.get("chunk_index", index),
            },
        )
        for index, chunk in enumerate(embedded_chunks)
    ]

    client.upsert(collection_name=COLLECTION_NAME, points=points)
    return len(points)


def retrieve_relevant_chunks(query_embedding: list[float], top_k: int = 5) -> list[dict]:
    ensure_collection()
    client = get_client()

    results = client.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_embedding,
        limit=top_k,
    )

    return [
        {
            "text": r.payload.get("text"),
            "source": r.payload.get("source"),
            "chunk_index": r.payload.get("chunk_index"),
            "score": round(r.score, 4),
        }
        for r in results
    ]