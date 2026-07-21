from pathlib import Path

from fastapi.testclient import TestClient

import main
from gemini_service import GeminiAnalysisError
from schemas import AnalysisResult, RewriteSuggestion


client = TestClient(main.app)


def fake_extract_resume_text(
    file_path: Path,
    extension: str,
) -> str:
    assert file_path.exists()
    assert extension == ".pdf"

    return (
        "Python developer experienced with SQL, "
        "Git, and REST APIs."
    )


def fake_gemini_analysis(
    resume_text: str,
    job_description: str,
) -> AnalysisResult:
    assert "Python" in resume_text
    assert "FastAPI" in job_description

    return AnalysisResult(
        match_score=75,
        missing_keywords=["Docker"],
        suggestions=[
            RewriteSuggestion(
                section="Skills",
                issue=(
                    "The technical skills need clearer formatting."
                ),
                suggested_rewrite=(
                    "Technical Skills: Python, SQL, Git, "
                    "and REST APIs."
                ),
            )
        ],
    )


def test_root_endpoint() -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "message": "AI Resume Screener backend is running."
    }


def test_health_endpoint() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
    }


def test_successful_resume_analysis(
    monkeypatch,
) -> None:
    monkeypatch.setattr(
        main,
        "extract_resume_text",
        fake_extract_resume_text,
    )
    monkeypatch.setattr(
        main,
        "analyze_with_gemini",
        fake_gemini_analysis,
    )

    response = client.post(
        "/analyze",
        files={
            "resume": (
                "resume.pdf",
                b"temporary PDF test content",
                "application/pdf",
            ),
        },
        data={
            "job_description": (
                "We need a Python developer with "
                "FastAPI and Docker experience."
            ),
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["match_score"] == 75
    assert body["missing_keywords"] == ["Docker"]
    assert len(body["suggestions"]) == 1
    assert body["suggestions"][0]["section"] == "Skills"


def test_missing_job_description() -> None:
    response = client.post(
        "/analyze",
        files={
            "resume": (
                "resume.pdf",
                b"temporary PDF content",
                "application/pdf",
            ),
        },
    )

    assert response.status_code == 422

    details = response.json()["detail"]

    assert any(
        item["loc"][-1] == "job_description"
        for item in details
    )


def test_empty_job_description() -> None:
    response = client.post(
        "/analyze",
        files={
            "resume": (
                "resume.pdf",
                b"temporary PDF content",
                "application/pdf",
            ),
        },
        data={
            "job_description": "   ",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "Job description cannot be empty."
    )


def test_unsupported_resume_format() -> None:
    response = client.post(
        "/analyze",
        files={
            "resume": (
                "resume.jpg",
                b"image content",
                "image/jpeg",
            ),
        },
        data={
            "job_description": (
                "Python developer with FastAPI experience."
            ),
        },
    )

    assert response.status_code == 415
    assert response.json()["detail"] == (
        "Only PDF and DOCX resume files are supported."
    )


def test_empty_resume_file() -> None:
    response = client.post(
        "/analyze",
        files={
            "resume": (
                "resume.pdf",
                b"",
                "application/pdf",
            ),
        },
        data={
            "job_description": (
                "Python developer with FastAPI experience."
            ),
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "The uploaded resume file is empty."
    )


def test_unreadable_resume_text(
    monkeypatch,
) -> None:
    monkeypatch.setattr(
        main,
        "extract_resume_text",
        lambda file_path, extension: "   ",
    )

    response = client.post(
        "/analyze",
        files={
            "resume": (
                "resume.pdf",
                b"temporary PDF content",
                "application/pdf",
            ),
        },
        data={
            "job_description": (
                "Python developer with FastAPI experience."
            ),
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"] == (
        "No readable text could be extracted from the resume."
    )


def test_gemini_analysis_failure(
    monkeypatch,
) -> None:
    monkeypatch.setattr(
        main,
        "extract_resume_text",
        fake_extract_resume_text,
    )

    def raise_gemini_error(
        resume_text: str,
        job_description: str,
    ) -> AnalysisResult:
        raise GeminiAnalysisError(
            "Gemini failed to return a valid analysis."
        )

    monkeypatch.setattr(
        main,
        "analyze_with_gemini",
        raise_gemini_error,
    )

    response = client.post(
        "/analyze",
        files={
            "resume": (
                "resume.pdf",
                b"temporary PDF content",
                "application/pdf",
            ),
        },
        data={
            "job_description": (
                "Python developer with FastAPI experience."
            ),
        },
    )

    assert response.status_code == 502
    assert "Gemini failed" in response.json()["detail"]