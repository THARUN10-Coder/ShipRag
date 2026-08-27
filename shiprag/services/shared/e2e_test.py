"""End-to-end integration smoke test for SHIPRAG microservices architecture."""
import sys
import time
import httpx

GATEWAY_URL = "http://localhost:8080"


def log(msg: str):
    print(f"[E2E TEST] {msg}")


def test_e2e():
    client = httpx.Client(timeout=10.0)

    # 1. Health Checks
    log("Checking Gateway & Microservice Health...")
    auth_health = client.get(f"{GATEWAY_URL}/auth/health")
    assert auth_health.status_code == 200, f"Auth health failed: {auth_health.text}"

    ingest_health = client.get(f"{GATEWAY_URL}/api/ingest/health")
    assert ingest_health.status_code == 200, f"Ingest health failed: {ingest_health.text}"

    retrieval_health = client.get(f"{GATEWAY_URL}/api/query/health")
    assert retrieval_health.status_code == 200, f"Retrieval health failed: {retrieval_health.text}"

    log("✅ All service health checks passed.")

    # 2. Registration & Login
    email = f"user_{int(time.time())}@example.com"
    password = "SecurePassword123!"

    log(f"Registering test user: {email}")
    reg_resp = client.post(f"{GATEWAY_URL}/auth/register", params={"email": email, "password": password})
    assert reg_resp.status_code == 200, f"Registration failed: {reg_resp.text}"
    token = reg_resp.json()["access_token"]
    user_id = reg_resp.json()["user"]["user_id"]
    log("✅ User registered successfully.")

    # 3. Create Project
    log("Creating project...")
    proj_resp = client.post(
        f"{GATEWAY_URL}/auth/projects",
        headers={"Authorization": f"Bearer {token}"},
        params={"name": "E2E Test Project"},
    )
    assert proj_resp.status_code == 200, f"Create project failed: {proj_resp.text}"
    project_id = proj_resp.json()["project_id"]
    log(f"✅ Project created: {project_id}")

    # 4. Async Ingestion
    log("Submitting documents for ingestion...")
    ingest_resp = client.post(
        f"{GATEWAY_URL}/api/ingest",
        data={
            "project_id": project_id,
            "user_id": user_id,
            "paths": '["backend/README.md"]'
        }
    )
    assert ingest_resp.status_code == 200, f"Ingest submission failed: {ingest_resp.text}"
    job_id = ingest_resp.json()["job_id"]
    log(f"✅ Ingestion job queued with ID: {job_id}")

    # 5. Poll Job Status
    log("Polling ingestion status...")
    status = "queued"
    attempts = 0
    while status not in ("done", "failed") and attempts < 15:
        time.sleep(1)
        st_resp = client.get(f"{GATEWAY_URL}/api/ingest/status/{job_id}")
        if st_resp.status_code == 200:
            status = st_resp.json()["status"]
        attempts += 1

    assert status == "done", f"Ingestion job did not complete: status={status}"
    log("✅ Async document ingestion & embedding finished successfully.")

    # 6. Query Test
    log("Executing query against retrieval service...")
    query_resp = client.post(
        f"{GATEWAY_URL}/api/query",
        json={
            "project_id": project_id,
            "question": "What is SHIPRAG?",
            "top_k": 3,
            "use_hybrid": True
        }
    )
    assert query_resp.status_code == 200, f"Query failed: {query_resp.text}"
    data = query_resp.json()
    log(f"✅ Query Answer received: {data['answer'][:100]}...")
    log(f"Sources retrieved: {len(data['sources'])}")

    log("🎉 E2E SMOKE TEST PASSED FULLY!")


if __name__ == "__main__":
    try:
        test_e2e()
    except Exception as err:
        log(f"❌ E2E TEST FAILED: {err}")
        sys.exit(1)
