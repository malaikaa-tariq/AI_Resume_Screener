from dotenv import load_dotenv

from chunking_service import process_document_chunks
from embedding_service import generate_chunk_embeddings


load_dotenv()

sample_text = """
FastAPI is a modern framework for building APIs.
Vector databases store and search embeddings.
Retrieval-Augmented Generation uses relevant document chunks.
"""


def test_pipeline():
    chunks = process_document_chunks(sample_text)

    print(f"Total Chunks Created: {len(chunks)}")

    try:
        embedded_chunks = generate_chunk_embeddings(chunks)

        print("Embeddings generated successfully!")
        print(
            "First chunk embedding dimension:",
            len(embedded_chunks[0]["embedding"]),
        )
    except Exception as error:
        print(f"Embedding generation failed: {error}")


if __name__ == "__main__":
    test_pipeline()