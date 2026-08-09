import os

from google import genai
from google.genai import types


EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMENSION = 768


def generate_chunk_embeddings(chunks_data: list[dict]) -> list[dict]:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    if not api_key:
        raise RuntimeError(
            "Set GEMINI_API_KEY or GOOGLE_API_KEY in the .env file."
        )

    client = genai.Client(api_key=api_key)

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

            item["embedding"] = list(result.embeddings[0].values)

        return chunks_data
    finally:
        client.close()