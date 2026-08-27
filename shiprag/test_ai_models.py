"""Script to test all AI models (NVIDIA Llama 3.3, OpenAI/Local Embeddings, Chunking, Search)"""
import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

from openai import OpenAI
from app.core.config import settings
from app.core.chunking import chunk_text
from app.core.embeddings import embed_texts, embed_query

def verify_all_ai_components():
    print("=" * 65)
    print(" SHIPRAG INTEGRATED AI SYSTEMS & ENGINE DIAGNOSTIC")
    print("=" * 65)

    # 1. Config Check
    print("\n[1] Environment & Settings Configuration:")
    print(f"  * NVIDIA Base URL:     {settings.nvidia_base_url}")
    print(f"  * Generation Model:    {settings.generation_model}")
    print(f"  * Embedding Model:     {settings.embedding_model} ({settings.embedding_dims} dims)")
    print(f"  * Has NVIDIA API Key:  {'YES (Configured)' if settings.nvidia_api_key else 'NO'}")

    # 2. Tiktoken Token Chunker Test
    print("\n[2] Testing Token Chunking Engine:")
    sample = "SHIPRAG enables instant retrieval-augmented generation for documentation repositories."
    chunks = chunk_text(sample, source="test_doc.md")
    print(f"  * Chunks created: {len(chunks)}")
    assert len(chunks) > 0, "Chunking failed"
    print("  -> Token Chunker: [PASS] (OK)")

    # 3. Vector Embeddings Generator Test
    print("\n[3] Testing Vector Embeddings Pipeline:")
    vectors = embed_texts(["Test embedding vector generation."])
    print(f"  * Vector count: {len(vectors)}, Dimensions: {len(vectors[0])}")
    assert len(vectors[0]) == settings.embedding_dims, "Vector dimension mismatch"
    print("  -> Vector Embeddings: [PASS] (OK)")

    # 4. NVIDIA Llama 3.3 LLM Answering Engine Test
    print("\n[4] Testing NVIDIA LLM API Connection:")
    try:
        client = OpenAI(
            base_url=settings.nvidia_base_url,
            api_key=settings.nvidia_api_key,
        )
        response = client.chat.completions.create(
            model=settings.generation_model,
            messages=[{"role": "user", "content": "Respond with 'SHIPRAG_ONLINE' only."}],
            max_tokens=30,
            temperature=0.1
        )
        output = response.choices[0].message.content.strip()
        print(f"  * NVIDIA Llama 3.3 Output: '{output}'")
        print("  -> NVIDIA LLM Engine: [PASS] (OK)")
    except Exception as e:
        print(f"  -> NVIDIA LLM Engine Check Failed: {e}")

    print("\n" + "=" * 65)
    print(" ALL AI SUBSYSTEMS & MODELS DIAGNOSTIC COMPLETE!")
    print("=" * 65)

if __name__ == "__main__":
    verify_all_ai_components()
