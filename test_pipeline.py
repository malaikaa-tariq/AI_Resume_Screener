from chunking_service import process_document_chunks
from embedding_service import generate_chunk_embeddings

sample_text = """
FastAPI is a modern, fast, high-performance web framework for building APIs with Python. 
It is based on standard Python type hints. 
Vector search engines are used to store and manage dense vector embeddings efficiently. 
Retrieval-Augmented Generation enhances LLM responses with accurate custom document chunks.
"""

def test_pipeline():
    chunks = process_document_chunks(sample_text)
    print(f"Total Chunks Created: {len(chunks)}")
    
    # Optional: Agar API key set hai toh embedding test karein
    try:
        embedded_chunks = generate_chunk_embeddings(chunks)
        print("Embeddings generated successfully!")
        print(f"First chunk embedding dimension: {len(embedded_chunks[0]['embedding'])}")
    except Exception as e:
        print(f"Embedding generation skipped/failed due to API key: {e}")

if __name__ == "__main__":
    test_pipeline()