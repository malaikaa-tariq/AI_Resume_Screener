import re
from collections import Counter
from pathlib import Path

from docx import Document
from pypdf import PdfReader


TECHNICAL_SKILLS = {
    "python",
    "java",
    "javascript",
    "typescript",
    "html",
    "css",
    "react",
    "angular",
    "vue",
    "node.js",
    "express",
    "flask",
    "django",
    "fastapi",
    "sql",
    "mysql",
    "postgresql",
    "mongodb",
    "sqlite",
    "git",
    "github",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "rest api",
    "graphql",
    "machine learning",
    "deep learning",
    "data analysis",
    "pandas",
    "numpy",
    "tensorflow",
    "pytorch",
    "scikit-learn",
    "power bi",
    "tableau",
    "figma",
    "ui/ux",
    "cybersecurity",
    "linux",
    "cloud computing",
    "api integration",
    "responsive design",
    "software engineering",
}

PROFESSIONAL_SKILLS = {
    "communication",
    "leadership",
    "problem solving",
    "teamwork",
    "time management",
    "project management",
    "critical thinking",
    "collaboration",
    "agile",
    "scrum",
}

ALL_SKILLS = (
    TECHNICAL_SKILLS
    | PROFESSIONAL_SKILLS
)

ACTION_VERBS = {
    "built",
    "created",
    "developed",
    "designed",
    "implemented",
    "improved",
    "increased",
    "reduced",
    "managed",
    "led",
    "launched",
    "optimized",
    "automated",
    "delivered",
    "collaborated",
    "engineered",
    "analyzed",
    "organized",
    "maintained",
    "integrated",
    "deployed",
}

SECTION_PATTERNS = {
    "contact information": (
        r"\b(email|phone|linkedin|github)\b"
    ),
    "professional summary": (
        r"\b(summary|profile|objective|about me)\b"
    ),
    "experience": (
        r"\b(experience|employment|work history|internship)\b"
    ),
    "education": (
        r"\b(education|academic|university|college|degree)\b"
    ),
    "skills": (
        r"\b(skills|technologies|technical skills|competencies)\b"
    ),
    "projects": (
        r"\b(projects|portfolio|case studies)\b"
    ),
}

STOP_WORDS = {
    "and",
    "the",
    "with",
    "for",
    "from",
    "that",
    "this",
    "your",
    "you",
    "are",
    "our",
    "will",
    "have",
    "has",
    "into",
    "using",
    "work",
    "role",
    "job",
    "team",
    "skills",
    "experience",
    "years",
    "about",
    "who",
    "all",
    "but",
    "not",
    "can",
    "their",
    "they",
    "was",
    "were",
    "been",
    "being",
    "than",
    "then",
    "also",
    "should",
    "must",
    "required",
    "preferred",
}


def extract_resume_text(
    file_path: Path,
    extension: str,
) -> str:
    if extension == "pdf":
        return extract_pdf_text(
            file_path
        )

    if extension == "docx":
        return extract_docx_text(
            file_path
        )

    if extension == "txt":
        return file_path.read_text(
            encoding="utf-8",
            errors="ignore",
        )

    raise ValueError(
        "Unsupported resume file format."
    )


def extract_pdf_text(
    file_path: Path,
) -> str:
    reader = PdfReader(
        str(file_path)
    )

    pages = []

    for page in reader.pages:
        pages.append(
            page.extract_text() or ""
        )

    return "\n".join(pages)


def extract_docx_text(
    file_path: Path,
) -> str:
    document = Document(
        str(file_path)
    )

    paragraphs = [
        paragraph.text
        for paragraph in document.paragraphs
    ]

    return "\n".join(paragraphs)


def normalize_text(text: str) -> str:
    return re.sub(
        r"\s+",
        " ",
        text.lower(),
    ).strip()


def tokenize(text: str):
    return re.findall(
        r"[a-zA-Z][a-zA-Z0-9+.#/-]{1,}",
        text.lower(),
    )


def detect_skills(text: str):
    normalized_text = normalize_text(
        text
    )

    detected = []

    for skill in ALL_SKILLS:
        pattern = (
            rf"(?<!\w)"
            rf"{re.escape(skill)}"
            rf"(?!\w)"
        )

        if re.search(
            pattern,
            normalized_text,
        ):
            detected.append(skill)

    return sorted(detected)


def get_important_keywords(text: str):
    words = tokenize(text)

    filtered_words = [
        word
        for word in words
        if word not in STOP_WORDS
        and len(word) > 2
    ]

    word_frequency = Counter(
        filtered_words
    )

    return [
        word
        for word, _count
        in word_frequency.most_common(40)
    ]


def calculate_job_match(
    resume_text: str,
    job_description: str,
):
    if not job_description.strip():
        return 0, [], []

    resume_keywords = set(
        get_important_keywords(
            resume_text
        )
    )

    job_keywords = set(
        get_important_keywords(
            job_description
        )
    )

    matching_keywords = sorted(
        resume_keywords
        & job_keywords
    )

    job_match = round(
        (
            len(matching_keywords)
            / max(len(job_keywords), 1)
        )
        * 100
    )

    resume_skills = set(
        detect_skills(resume_text)
    )

    job_skills = set(
        detect_skills(
            job_description
        )
    )

    missing_skills = sorted(
        job_skills
        - resume_skills
    )

    return (
        job_match,
        matching_keywords,
        missing_skills,
    )


def analyze_resume(
    resume_text: str,
    job_description: str = "",
):
    normalized_resume = normalize_text(
        resume_text
    )

    resume_words = tokenize(
        resume_text
    )

    word_count = len(
        resume_words
    )

    detected_skills = detect_skills(
        resume_text
    )

    detected_sections = []

    for section, pattern in (
        SECTION_PATTERNS.items()
    ):
        if re.search(
            pattern,
            normalized_resume,
        ):
            detected_sections.append(
                section
            )

    detected_action_verbs = sorted(
        {
            verb
            for verb in ACTION_VERBS
            if verb in resume_words
        }
    )

    measurable_results = re.findall(
        r"\b\d+(?:\.\d+)?%"
        r"|\b\d+\+?\b",
        resume_text,
    )

    (
        job_match,
        matching_keywords,
        missing_skills,
    ) = calculate_job_match(
        resume_text,
        job_description,
    )

    if not job_description.strip():
        recommended_skills = {
            "communication",
            "git",
            "problem solving",
            "sql",
            "teamwork",
        }

        missing_skills = sorted(
            recommended_skills
            - set(detected_skills)
        )

    section_score = round(
        (
            len(detected_sections)
            / len(SECTION_PATTERNS)
        )
        * 25
    )

    skills_score = min(
        25,
        len(detected_skills) * 3,
    )

    if 350 <= word_count <= 900:
        length_score = 10
    elif 220 <= word_count <= 1100:
        length_score = 6
    else:
        length_score = 3

    impact_score = min(
        10,
        len(detected_action_verbs)
        + min(
            len(measurable_results),
            5,
        ),
    )

    if job_description.strip():
        relevance_score = round(
            job_match * 0.30
        )
    else:
        relevance_score = 18

    final_score = (
        section_score
        + skills_score
        + length_score
        + impact_score
        + relevance_score
    )

    final_score = max(
        0,
        min(100, final_score),
    )

    strengths = []

    if len(detected_sections) >= 5:
        strengths.append(
            "Your resume contains most of the essential recruiter-friendly sections."
        )

    if len(detected_skills) >= 6:
        strengths.append(
            "Your resume shows a useful combination of technical and professional skills."
        )

    if len(detected_action_verbs) >= 5:
        strengths.append(
            "Your resume uses strong action-oriented language."
        )

    if measurable_results:
        strengths.append(
            "Your resume includes measurable numbers that make achievements more credible."
        )

    if (
        job_description.strip()
        and job_match >= 55
    ):
        strengths.append(
            "Your resume has a good keyword match with the selected job description."
        )

    if not strengths:
        strengths.append(
            "Your resume provides a useful foundation that can be improved with clearer evidence and structure."
        )

    improvements = []

    missing_sections = [
        section
        for section
        in SECTION_PATTERNS
        if section not in detected_sections
    ]

    if missing_sections:
        improvements.append(
            "Add or clearly label these sections: "
            + ", ".join(
                missing_sections[:3]
            )
            + "."
        )

    if len(detected_action_verbs) < 4:
        improvements.append(
            "Start more bullet points with strong action verbs such as developed, led, improved, created or automated."
        )

    if not measurable_results:
        improvements.append(
            "Add numbers, percentages, users, project size or time saved to show measurable impact."
        )

    if word_count < 300:
        improvements.append(
            "Add more detail about projects, responsibilities and outcomes because the resume is currently short."
        )

    elif word_count > 1000:
        improvements.append(
            "Reduce repetition and keep the resume concise, ideally around one or two pages."
        )

    if missing_skills:
        improvements.append(
            "Consider adding genuine experience related to these skills: "
            + ", ".join(
                missing_skills[:5]
            )
            + "."
        )

    if (
        job_description.strip()
        and job_match < 45
    ):
        improvements.append(
            "Tailor your professional summary, skills and experience bullets more closely to the job description."
        )

    return {
        "score": final_score,
        "job_match": job_match,
        "word_count": word_count,
        "keyword_count": len(
            matching_keywords
        ),
        "detected_skills": detected_skills,
        "missing_skills": missing_skills,
        "strengths": strengths[:5],
        "improvements": improvements[:6],
    }