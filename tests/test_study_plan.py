from fastapi.testclient import TestClient

import study_pipeline
from embedding_service import EMBEDDING_DIMENSION
from main import app
from study_plan_service import StudyPlan


client = TestClient(app)


def fake_query_embedding(query: str) -> list[float]:
    assert query.strip()
    return [0.1] * EMBEDDING_DIMENSION


def fake_retrieval(
    query_embedding: list[float],
    top_k: int = 5,
) -> list[dict]:
    assert len(query_embedding) == EMBEDDING_DIMENSION
    assert top_k >= 1

    return [
        {
            "text": "Supervised learning uses labelled training data.",
            "source": "ai-notes.txt",
            "chunk_id": "chunk-1",
            "chunk_index": 0,
            "token_count": 7,
            "score": 0.91,
        }
    ]


def fake_plan_generation(
    topic: str,
    retrieved_chunks: list[dict],
    days: int,
    minutes_per_day: int,
) -> StudyPlan:
    assert retrieved_chunks

    return StudyPlan.model_validate(
        {
            "topic": topic,
            "overview": "A focused plan based on the uploaded notes.",
            "total_days": days,
            "minutes_per_day": minutes_per_day,
            "sessions": [
                {
                    "day": day,
                    "title": f"Study session {day}",
                    "objective": "Understand supervised learning.",
                    "duration_minutes": minutes_per_day,
                    "activities": [
                        "Read the retrieved notes",
                        "Write the key definition",
                    ],
                    "source_chunk_ids": ["chunk-1"],
                }
                for day in range(1, days + 1)
            ],
        }
    )


def test_generate_study_plan(monkeypatch) -> None:
    monkeypatch.setattr(
        study_pipeline,
        "generate_query_embedding",
        fake_query_embedding,
    )
    monkeypatch.setattr(
        study_pipeline,
        "retrieve_relevant_chunks",
        fake_retrieval,
    )
    monkeypatch.setattr(
        study_pipeline,
        "generate_study_plan",
        fake_plan_generation,
    )

    response = client.post(
        "/api/v1/study/plan",
        json={
            "topic": "Supervised learning",
            "days": 2,
            "minutes_per_day": 30,
            "top_k": 3,
        },
    )

    assert response.status_code == 200

    result = response.json()
    assert result["topic"] == "Supervised learning"
    assert result["total_days"] == 2
    assert len(result["sessions"]) == 2
    assert result["sessions"][0]["source_chunk_ids"] == ["chunk-1"]


def test_plan_returns_404_without_retrieved_chunks(monkeypatch) -> None:
    monkeypatch.setattr(
        study_pipeline,
        "generate_query_embedding",
        fake_query_embedding,
    )
    monkeypatch.setattr(
        study_pipeline,
        "retrieve_relevant_chunks",
        lambda query_embedding, top_k=5: [],
    )

    response = client.post(
        "/api/v1/study/plan",
        json={
            "topic": "Unknown topic",
            "days": 2,
            "minutes_per_day": 30,
        },
    )

    assert response.status_code == 404


def test_rejects_blank_plan_topic() -> None:
    response = client.post(
        "/api/v1/study/plan",
        json={
            "topic": "   ",
            "days": 2,
            "minutes_per_day": 30,
        },
    )

    assert response.status_code == 422