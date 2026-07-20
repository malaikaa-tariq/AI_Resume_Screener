import logging
import os
import re
import time

from dotenv import load_dotenv
from google import genai
from google.genai import errors, types
from pydantic import ValidationError

from schemas import AnalysisResult


load_dotenv()

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 3
TRANSIENT_STATUS_CODES = {429, 500, 502, 503, 504}


class GeminiConfigurationError(RuntimeError):
    """Raised when Gemini configuration is missing."""


class GeminiAnalysisError(RuntimeError):
    """Raised when Gemini cannot produce a valid resume analysis."""


def get_gemini_client() -> genai.Client:
    """Create and return a configured Gemini client."""

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise GeminiConfigurationError(
            "GEMINI_API_KEY is missing from the .env file."
        )

    return genai.Client(api_key=api_key)


def get_model_name() -> str:
    """Read the Gemini model name from the environment."""

    model_name = os.getenv("GEMINI_MODEL")

    if not model_name:
        raise GeminiConfigurationError(
            "GEMINI_MODEL is missing from the .env file."
        )

    return model_name


def build_prompt(
    resume_text: str,
    job_description: str,
    is_retry: bool = False,
) -> str:
    """Build the resume comparison prompt."""

    retry_instruction = ""

    if is_retry:
        retry_instruction = """
IMPORTANT RETRY INSTRUCTIONS:
- The previous response failed validation.
- Return all required fields.
- Follow the response schema exactly.
- Do not insert missing skills into suggested rewrites.
- Only use information explicitly supported by the resume.
"""

    return f"""
You are an expert applicant tracking system and resume reviewer.

Compare the candidate's resume with the supplied job description.

ANALYSIS REQUIREMENTS:
- Calculate a fair match score from 0 to 100.
- Identify important job-description keywords absent from the resume.
- Remove duplicate missing keywords.
- Give specific and actionable resume rewrite suggestions.
- Each suggestion must identify the relevant resume section.
- Each suggestion must briefly explain the issue.
- Each suggestion must provide an improved rewrite.
- Return every field required by the response schema.

TRUTHFULNESS RULES:
- Missing keywords represent gaps in the candidate's resume.
- Never insert a missing keyword into a suggested rewrite.
- Suggested rewrites may only use skills, experience and achievements
  explicitly supported by the resume.
- Do not invent qualifications, employment, tools, technologies,
  responsibilities, numbers or achievements.
- When the candidate lacks a required skill, report it only in
  missing_keywords.
- Preserve the candidate's truthful meaning.

{retry_instruction}

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}
""".strip()


def contains_keyword(text: str, keyword: str) -> bool:
    """Check whether a keyword or phrase appears in text."""

    cleaned_text = " ".join(text.casefold().split())
    cleaned_keyword = " ".join(keyword.casefold().split())

    if not cleaned_keyword:
        return False

    pattern = rf"(?<!\w){re.escape(cleaned_keyword)}(?!\w)"

    return re.search(pattern, cleaned_text) is not None


def validate_truthful_suggestions(result: AnalysisResult) -> None:
    """
    Reject suggestions that insert skills Gemini identified as missing.

    A missing keyword should remain a gap and must not be added to a
    suggested rewrite as though the candidate already has that skill.
    """

    missing_keywords = [
        keyword.strip()
        for keyword in result.missing_keywords
        if keyword.strip()
    ]

    for suggestion in result.suggestions:
        inserted_keywords = [
            keyword
            for keyword in missing_keywords
            if contains_keyword(
                suggestion.suggested_rewrite,
                keyword,
            )
        ]

        if inserted_keywords:
            raise ValueError(
                "Suggested rewrite contains missing keywords: "
                + ", ".join(inserted_keywords)
            )


def get_api_status_code(error: Exception) -> int | None:
    """Safely retrieve an API error status code."""

    code = getattr(error, "code", None)

    if isinstance(code, int):
        return code

    status_code = getattr(error, "status_code", None)

    if isinstance(status_code, int):
        return status_code

    return None


def analyze_with_gemini(
    resume_text: str,
    job_description: str,
) -> AnalysisResult:
    """
    Compare a resume with a job description using Gemini.

    The function validates Gemini's structured JSON output and retries
    invalid or temporary failed responses.
    """

    cleaned_resume = resume_text.strip()
    cleaned_job_description = job_description.strip()

    if not cleaned_resume:
        raise ValueError("Resume text cannot be empty.")

    if not cleaned_job_description:
        raise ValueError("Job description cannot be empty.")

    client = get_gemini_client()
    model_name = get_model_name()

    last_error: Exception | None = None

    for attempt in range(MAX_ATTEMPTS):
        attempt_number = attempt + 1

        try:
            response = client.models.generate_content(
                model=model_name,
                contents=build_prompt(
                    resume_text=cleaned_resume,
                    job_description=cleaned_job_description,
                    is_retry=attempt > 0,
                ),
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=AnalysisResult,
                    temperature=0.2,
                ),
            )

            if not response.text:
                raise ValueError(
                    "Gemini returned an empty response."
                )

            result = AnalysisResult.model_validate_json(
                response.text
            )

            validate_truthful_suggestions(result)

            return result

        except (
            ValidationError,
            ValueError,
            TypeError,
        ) as error:
            last_error = error

            logger.warning(
                "Gemini output validation failed on attempt %s: %s",
                attempt_number,
                error,
            )

        except errors.APIError as error:
            last_error = error
            status_code = get_api_status_code(error)

            logger.warning(
                "Gemini API failed on attempt %s with status %s: %s",
                attempt_number,
                status_code,
                error,
            )

            if status_code not in TRANSIENT_STATUS_CODES:
                break

        except Exception as error:
            last_error = error

            logger.exception(
                "Unexpected Gemini error on attempt %s",
                attempt_number,
            )

            break

        if attempt_number < MAX_ATTEMPTS:
            delay_seconds = 2 ** attempt
            time.sleep(delay_seconds)

    raise GeminiAnalysisError(
        "Gemini failed to return a valid resume analysis."
    ) from last_error