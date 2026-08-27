import urllib.request
import json
import time

BASE_URL = "http://localhost:8000"

def get(path):
    req = urllib.request.Request(f"{BASE_URL}{path}")
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode('utf-8'))

def post(path, body):
    data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}{path}", data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode('utf-8'))

print("==================================================")
print("1. VERIFY REPOSITORY INDEX")
print("==================================================")
repos_info = get("/api/repositories")
print(f"Total Repositories: {repos_info.get('total')}")
for r in repos_info.get('repositories', []):
    pid = r['id']
    graph = get(f"/api/repositories/{pid}/graph")
    print(f"Repository: {pid}")
    print(f"  - Full Name: {r.get('fullName')}")
    print(f"  - Default Branch: {r.get('defaultBranch')}")
    print(f"  - Files Indexed: {r.get('fileCount')}")
    print(f"  - Chunks Indexed: {r.get('chunkCount')}")
    print(f"  - Embedding Model / Dims: {r.get('embeddingModel')} ({r.get('embeddingDimension')}D)")
    print(f"  - AST Nodes: {len(graph.get('nodes', []))}")
    print(f"  - AST Edges: {len(graph.get('edges', []))}")
    print()

print("==================================================")
print("2. TEST REPOSITORY-SPECIFIC COPILOT (5 Qs per Repo)")
print("==================================================")
questions = {
    "opengym": [
        "Explain the architecture and codebase.",
        "Where is the main entry point and Env class defined?",
        "How does the reset and step method work in cartpole?",
        "What components handle MuJoCo continuous physics?",
        "What are the contribution guidelines in CONTRIBUTING.md?"
    ],
    "ai-support-copilot": [
        "Explain the architecture of this repository.",
        "Where is the main server or app entry point?",
        "How is authentication or token generation handled?",
        "What component handles ngrok or external webhook tunnel?",
        "How is deployment configured in GITHUB_VERCEL_SETUP.md?"
    ],
    "chatdb-core-system": [
        "Explain the architecture and purpose of chatdb-core-system.",
        "Where is database connection or schema defined?",
        "How does the query router or execution pipeline work?",
        "What dependencies are listed in package.json or requirements?",
        "How is logging or error handling structured?"
    ]
}

isolation_success = True
for repo, q_list in questions.items():
    print(f"\n--- Testing Repository: {repo} ---")
    for i, q in enumerate(q_list, 1):
        try:
            res = post("/api/query", {"project_id": repo, "question": q, "top_k": 4})
            answer = res.get("answer", "")
            sources = res.get("sources", [])
            source_names = [s.get('source') for s in sources]
            print(f"Q{i}: {q}")
            print(f"   Answer Preview: {answer[:90]}...")
            print(f"   Sources: {source_names}")
            # Verify isolation
            for src_name in source_names:
                if repo == "opengym" and any(k in src_name.lower() for k in ["ngrok", "vercel", "copilot", "chatdb"]):
                    print(f"   [ISOLATION FAIL] Foreign source in opengym: {src_name}")
                    isolation_success = False
                if repo == "ai-support-copilot" and any(k in src_name.lower() for k in ["cartpole", "mujoco", "pendulum"]):
                    print(f"   [ISOLATION FAIL] Foreign source in ai-support-copilot: {src_name}")
                    isolation_success = False
                if repo == "chatdb-core-system" and any(k in src_name.lower() for k in ["cartpole", "mujoco", "pendulum", "copilot"]):
                    print(f"   [ISOLATION FAIL] Foreign source in chatdb-core-system: {src_name}")
                    isolation_success = False
        except Exception as e:
            print(f"Q{i} Error: {e}")

print(f"\nIsolation Test Result: {'PASS' if isolation_success else 'FAIL'}")

print("\n==================================================")
print("3. TESTING SEARCH & AST NODE RETRIEVAL")
print("==================================================")
for pid in ["opengym", "ai-support-copilot", "chatdb-core-system"]:
    graph = get(f"/api/repositories/{pid}/graph")
    nodes = graph.get("nodes", [])
    print(f"\nRepo {pid} AST Summary:")
    print(f"  - Total AST Nodes: {len(nodes)}")
    for n in nodes[:3]:
        print(f"  - [{n.get('type')}] {n.get('name')} (File: {n.get('filePath')}, Line: {n.get('lineStart')})")
