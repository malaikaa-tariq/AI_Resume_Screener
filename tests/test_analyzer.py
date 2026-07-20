from pathlib import Path

import pytest

from analyzer import extract_resume_text


def test_extract_txt_resume(
    tmp_path: Path,
) -> None:
    resume_file = tmp_path / "resume.txt"

    resume_file.write_text(
        "Python developer with SQL and Git experience.",
        encoding="utf-8",
    )

    extracted_text = extract_resume_text(
        resume_file,
        "txt",
    )

    assert "Python developer" in extracted_text
    assert "SQL" in extracted_text


def test_extension_is_case_insensitive(
    tmp_path: Path,
) -> None:
    resume_file = tmp_path / "resume.txt"

    resume_file.write_text(
        "Software engineering student.",
        encoding="utf-8",
    )

    extracted_text = extract_resume_text(
        resume_file,
        ".TXT",
    )

    assert extracted_text == (
        "Software engineering student."
    )


def test_unsupported_extension(
    tmp_path: Path,
) -> None:
    resume_file = tmp_path / "resume.jpg"
    resume_file.write_bytes(b"image data")

    with pytest.raises(
        ValueError,
        match="Unsupported resume format",
    ):
        extract_resume_text(
            resume_file,
            "jpg",
        )