from pathlib import Path

import pytest
from docx import Document
from pypdf import PdfWriter

from analyzer import extract_resume_text


def create_test_docx(
    file_path: Path,
    text: str,
) -> None:
    document = Document()
    document.add_paragraph(text)
    document.save(file_path)


def test_extract_docx_resume(
    tmp_path: Path,
) -> None:
    resume_file = tmp_path / "resume.docx"

    create_test_docx(
        resume_file,
        "Python developer with SQL and Git experience.",
    )

    extracted_text = extract_resume_text(
        resume_file,
        ".docx",
    )

    assert "Python developer" in extracted_text
    assert "SQL" in extracted_text
    assert "Git" in extracted_text


def test_extension_is_case_insensitive(
    tmp_path: Path,
) -> None:
    resume_file = tmp_path / "resume.docx"

    create_test_docx(
        resume_file,
        "Software engineering student.",
    )

    extracted_text = extract_resume_text(
        resume_file,
        ".DOCX",
    )

    assert "Software engineering student." in extracted_text


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
    resume_file = tmp_path / "resume.txt"

    resume_file.write_text(
        "Python developer",
        encoding="utf-8",
    )

    with pytest.raises(ValueError):
        extract_resume_text(
            resume_file,
            ".txt",
        )