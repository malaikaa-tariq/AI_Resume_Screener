from pathlib import Path

import pytest
from docx import Document
from pypdf import PdfWriter

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
        ".txt",
    )

    assert "Python developer" in extracted_text
    assert "SQL" in extracted_text
    assert "Git" in extracted_text


def test_extract_docx_resume(
    tmp_path: Path,
) -> None:
    resume_file = tmp_path / "resume.docx"

    document = Document()
    document.add_paragraph(
        "Software engineering student with Python experience."
    )
    document.save(resume_file)

    extracted_text = extract_resume_text(
        resume_file,
        ".docx",
    )

    assert "Software engineering student" in extracted_text
    assert "Python" in extracted_text


def test_extension_is_case_insensitive(
    tmp_path: Path,
) -> None:
    resume_file = tmp_path / "resume.txt"

    resume_file.write_text(
        "Backend developer",
        encoding="utf-8",
    )

    extracted_text = extract_resume_text(
        resume_file,
        ".TXT",
    )

    assert extracted_text == "Backend developer"


def test_extract_valid_blank_pdf(
    tmp_path: Path,
) -> None:
    resume_file = tmp_path / "blank.pdf"

    writer = PdfWriter()
    writer.add_blank_page(
        width=612,
        height=792,
    )

    with resume_file.open("wb") as pdf_file:
        writer.write(pdf_file)

    extracted_text = extract_resume_text(
        resume_file,
        ".pdf",
    )

    assert isinstance(extracted_text, str)


def test_unsupported_extension(
    tmp_path: Path,
) -> None:
    resume_file = tmp_path / "resume.jpg"
    resume_file.write_bytes(b"image content")

    with pytest.raises(
        ValueError,
        match="Unsupported resume format",
    ):
        extract_resume_text(
            resume_file,
            ".jpg",
        )