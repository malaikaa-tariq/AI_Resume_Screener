from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_upload_study_text_file() -> None:
    response = client.post(
        "/api/v1/study/documents/upload",
        files={
            "file": (
                "notes.txt",
                b"Artificial Intelligence\n\nMachine learning finds patterns in data.",
                "text/plain",
            )
        },
    )

    assert response.status_code == 200
    result = response.json()
    assert result["document"]["filename"] == "notes.txt"
    assert result["document"]["word_count"] == 8
    assert "Machine learning" in result["text"]


def test_rejects_unsupported_study_file() -> None:
    response = client.post(
        "/api/v1/study/documents/upload",
        files={"file": ("notes.docx", b"content", "application/octet-stream")},
    )

    assert response.status_code == 415


def test_rejects_empty_study_file() -> None:
    response = client.post(
        "/api/v1/study/documents/upload",
        files={"file": ("empty.txt", b"", "text/plain")},
    )

    assert response.status_code == 422

