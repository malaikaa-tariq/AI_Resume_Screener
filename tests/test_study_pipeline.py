from fastapi.testclient import TestClient

import study_pipeline
from embedding_service import EMBEDDING_DIMENSION
from main import app


client = TestClient(app)


def fake_generate_embeddings(chunks: list[dict]) -> list[dict]:
    for chunk in chunks:
        chunk["embedding"] = [0.1] * EMBEDDING_DIMENSION

    return chunks


def fake_store_embedded_chunks(
    embedded_chunks: list[dict],
    source: str = "uploaded_doc",
) -> int:
    assert embedded_chunks
    assert source
    assert len(embedded_chunks[0]["embedding"]) == EMBEDDING_DIMENSION

    return len(embedded_chunks)


def fake_generate_query_embedding(query: str) -> list[float]:
    assert query.strip()
    return [0.1] * EMBEDDING_DIMENSION


def fake_retrieve_relevant_chunks(
    query_embedding: list[float],
    top_k: int = 5,
) -> list[dict]:
    assert len(query_embedding) == EMBEDDING_DIMENSION

    return [
        {
            "text": "Supervised learning uses labelled training data.",
            "source": "ai-notes.txt",
            "chunk_id": "test-chunk-1",
            "chunk_index": 0,
            "token_count": 7,
            "score": 0.91,
        }
    ][:top_k]


def test_process_study_document(monkeypatch) -> None:
    monkeypatch.setattr(
        study_pipeline,
        "generate_chunk_embeddings",
        fake_generate_embeddings,
    )
    monkeypatch.setattr(
        study_pipeline,
        "store_embedded_chunks",
        fake_store_embedded_chunks,
    )

    response = client.post(
        "/api/v1/study/process",
        json={
            "text": (
                "Artificial intelligence helps computers learn. "
                "Embeddings represent text as numerical vectors."
            ),
            "source": "test-notes.txt",
        },
    )

    assert response.status_code == 200

    result = response.json()

    assert result["chunks_created"] >= 1
    assert result["vectors_stored"] == result["chunks_created"]
    assert result["embedding_dimension"] == EMBEDDING_DIMENSION
    assert result["source"] == "test-notes.txt"


def test_retrieve_study_chunks(monkeypatch) -> None:
    monkeypatch.setattr(
        study_pipeline,
        "generate_query_embedding",
        fake_generate_query_embedding,
    )
    monkeypatch.setattr(
        study_pipeline,
        "retrieve_relevant_chunks",
        fake_retrieve_relevant_chunks,
    )

    response = client.post(
        "/api/v1/study/retrieve",
        json={
            "query": "What is supervised learning?",
            "top_k": 3,
        },
    )

    assert response.status_code == 200

    result = response.json()

    assert result["query"] == "What is supervised learning?"
    assert result["result_count"] == 1
    assert result["results"][0]["source"] == "ai-notes.txt"
    assert result["results"][0]["score"] == 0.91


def test_rejects_blank_study_text() -> None:
    response = client.post(
        "/api/v1/study/process",
        json={"text": "   "},
    )

    assert response.status_code == 422


def test_rejects_blank_retrieval_query() -> None:
    response = client.post(
        "/api/v1/study/retrieve",
        json={"query": "   ", "top_k": 3},
    )

    assert response.status_code == 422