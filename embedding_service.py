import os

from google import genai
from google.genai import types


EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMENSION = 768


def get_api_key() -> str:
    api_key = (
        os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
    )

    if not api_key:
        raise RuntimeError(
            "Set GEMINI_API_KEY or GOOGLE_API_KEY "
            "in the .env file."
        )

    return api_key


def generate_chunk_embeddings(
    chunks_data: list[dict],
) -> list[dict]:
    client = genai.Client(api_key=get_api_key())

    try:
        for item in chunks_data:
            result = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=item["text"],
                config=types.EmbedContentConfig(
                    task_type="RETRIEVAL_DOCUMENT",
                    output_dimensionality=EMBEDDING_DIMENSION,
                ),
            )

            item["embedding"] = list(
                result.embeddings[0].values
            )

        return chunks_data
    finally:
        client.close()


def generate_query_embedding(query: str) -> list[float]:
    cleaned_query = query.strip()

    if not cleaned_query:
        raise ValueError("Search query cannot be empty.")

    client = genai.Client(api_key=get_api_key())

    try:
        result = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=cleaned_query,
            config=types.EmbedContentConfig(
                task_type="RETRIEVAL_QUERY",
                output_dimensionality=EMBEDDING_DIMENSION,
            ),
        )

        return list(result.embeddings[0].values)
    finally:
        client.close()