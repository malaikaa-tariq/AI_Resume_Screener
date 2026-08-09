import uuid
from langchain_text_splitters import RecursiveCharacterTextSplitter

def process_document_chunks(cleaned_text: str):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150
    )
    
    raw_chunks = splitter.split_text(cleaned_text)
    final_chunks = []
    
    for idx, chunk in enumerate(raw_chunks):
        approx_tokens = len(chunk) // 4
        
        chunk_data = {
            "chunk_id": str(uuid.uuid4()),
            "chunk_index": idx,
            "text": chunk,
            "token_count": approx_tokens,
            "embedding": []
        }
        final_chunks.append(chunk_data)
        
    return final_chunks
