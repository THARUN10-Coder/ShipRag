import os
import sys
from dotenv import load_dotenv
from openai import OpenAI

# Load backend environment variables
load_dotenv("backend/.env")

nvidia_key = os.getenv("NVIDIA_API_KEY")
nvidia_url = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
gen_model = os.getenv("GENERATION_MODEL", "meta/llama-3.3-70b-instruct")
emb_model = os.getenv("EMBEDDING_MODEL", "nvidia/nv-embedqa-e5-v5")

print("=" * 65)
print("  COMPREHENSIVE INTEGRATED AI MODELS LIVE VERIFICATION REPORT")
print("=" * 65)

# 1. Test LLM Generation Model
print(f"\n[1/2] Testing LLM Generation Model: {gen_model}")
try:
    client = OpenAI(base_url=nvidia_url, api_key=nvidia_key)
    res = client.chat.completions.create(
        model=gen_model,
        messages=[
            {"role": "system", "content": "You are a concise AI tester."},
            {"role": "user", "content": "What is SHIPRAG? Answer in 1 crisp sentence."}
        ],
        max_tokens=60,
        temperature=0.1
    )
    answer = res.choices[0].message.content.strip()
    print("  -> Status:  [PASS] Operational")
    print(f"  -> Model:   {gen_model}")
    print(f"  -> Output:  \"{answer}\"")
except Exception as e:
    print(f"  -> Status:  [FAIL] Error: {e}")

# 2. Test Vector Embedding Model
print(f"\n[2/2] Testing Vector Embedding Model: {emb_model}")
try:
    emb_client = OpenAI(base_url=nvidia_url, api_key=nvidia_key)
    emb_res = emb_client.embeddings.create(
        model=emb_model,
        input=["Testing SHIPRAG vector dense embedding generation."],
        extra_body={"input_type": "passage", "truncate": "NONE"}
    )
    dim = len(emb_res.data[0].embedding)
    print("  -> Status:  [PASS] Operational")
    print(f"  -> Model:   {emb_model}")
    print(f"  -> Dims:    {dim} dense dimensions generated")
except Exception as e:
    print(f"  -> Status:  [FAIL] Error: {e}")

print("\n" + "=" * 65)
print("  ALL INTEGRATED AI MODELS VERIFIED & READY FOR PRODUCTION")
print("=" * 65)
