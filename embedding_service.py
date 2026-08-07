import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def generate_chunk_embeddings(chunks_data: list):
    for item in chunks_data:
        response = genai.embed_content(
            model="models/gemini-embedding-001",
            content=item["text"],
            task_type="retrieval_document"
        )
        item["embedding"] = response["embedding"]
        
    return chunks_data
