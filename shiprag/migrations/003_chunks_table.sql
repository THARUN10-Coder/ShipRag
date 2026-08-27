-- 003_chunks_table.sql
-- Creates the chunks table with pgvector and full-text search for hybrid retrieval.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS chunks (
    id            BIGSERIAL PRIMARY KEY,
    project_id    TEXT NOT NULL,
    user_id       UUID NOT NULL,
    source        TEXT NOT NULL,
    chunk_index   INT NOT NULL,
    content       TEXT NOT NULL,
    embedding     vector(1536),
    -- Full-text search column for hybrid retrieval
    content_tsv   TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
    metadata      JSONB NOT NULL DEFAULT '{}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vector similarity index (IVFFlat for scale, HNSW for speed)
CREATE INDEX idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops);

-- Full-text search index
CREATE INDEX idx_chunks_tsv ON chunks USING gin (content_tsv);

-- Tenant isolation index
CREATE INDEX idx_chunks_project ON chunks (project_id);
CREATE INDEX idx_chunks_project_source ON chunks (project_id, source);

-- Hybrid similarity search function (vector + keyword)
CREATE OR REPLACE FUNCTION match_chunks_hybrid(
    query_embedding vector(1536),
    query_text      TEXT,
    match_project_id TEXT,
    match_count     INT,
    vector_weight   FLOAT DEFAULT 0.7,
    keyword_weight  FLOAT DEFAULT 0.3
)
RETURNS TABLE (
    id          BIGINT,
    source      TEXT,
    content     TEXT,
    similarity  FLOAT,
    rank_score  FLOAT
)
LANGUAGE sql STABLE
AS $$
    WITH vector_results AS (
        SELECT c.id, c.source, c.content,
               1 - (c.embedding <=> query_embedding) AS similarity,
               ROW_NUMBER() OVER (ORDER BY c.embedding <=> query_embedding) AS vrank
        FROM chunks c
        WHERE c.project_id = match_project_id
        ORDER BY c.embedding <=> query_embedding
        LIMIT match_count * 2
    ),
    keyword_results AS (
        SELECT c.id, c.source, c.content,
               ts_rank_cd(c.content_tsv, plainto_tsquery('english', query_text)) AS kw_rank,
               ROW_NUMBER() OVER (
                   ORDER BY ts_rank_cd(c.content_tsv, plainto_tsquery('english', query_text)) DESC
               ) AS krank
        FROM chunks c
        WHERE c.project_id = match_project_id
          AND c.content_tsv @@ plainto_tsquery('english', query_text)
        LIMIT match_count * 2
    ),
    merged AS (
        SELECT
            COALESCE(v.id, k.id) AS id,
            COALESCE(v.source, k.source) AS source,
            COALESCE(v.content, k.content) AS content,
            COALESCE(v.similarity, 0.0) AS similarity,
            (vector_weight * COALESCE(v.similarity, 0.0))
                + (keyword_weight * COALESCE(k.kw_rank, 0.0)) AS rank_score
        FROM vector_results v
        FULL OUTER JOIN keyword_results k ON v.id = k.id
    )
    SELECT m.id, m.source, m.content, m.similarity, m.rank_score
    FROM merged m
    ORDER BY m.rank_score DESC
    LIMIT match_count;
$$;

-- Original simple vector-only search (backward compatibility)
CREATE OR REPLACE FUNCTION match_chunks(
    query_embedding vector(1536),
    match_project_id TEXT,
    match_count INT
)
RETURNS TABLE (id BIGINT, source TEXT, content TEXT, similarity FLOAT)
LANGUAGE sql STABLE
AS $$
    SELECT c.id, c.source, c.content,
           1 - (c.embedding <=> query_embedding) AS similarity
    FROM chunks c
    WHERE c.project_id = match_project_id
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
$$;
