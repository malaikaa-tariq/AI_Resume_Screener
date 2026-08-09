from fastapi.testclient import TestClient

import study_pipeline
from main import app


client = TestClient(app)


def fake_generate_embeddings(chunks: list[dict]) -> list[dict]:
    for chunk in chunks:
        chunk["embedding"] = [0.1] * 768

    return chunks


def test_process_study_document(monkeypatch) -> None:
    monkeypatch.setattr(
        study_pipeline,
        "generate_chunk_embeddings",
        fake_generate_embeddings,
    )

    response = client.post(
        "/api/v1/study/process",
        json={
            "text": (
                "Artificial intelligence helps computers learn. "
                "Embeddings represent text as numerical vectors."
            )
        },
    )

    assert response.status_code == 200

    result = response.json()

    assert result["chunk_count"] >= 1
    assert result["embedding_model"] == "gemini-embedding-001"
    assert result["embedding_dimension"] == 768
    assert len(result["chunks"][0]["embedding"]) == 768


def test_rejects_blank_study_text() -> None:
    response = client.post(
        "/api/v1/study/process",
        json={"text": "   "},
    )

    assert response.status_code == 422