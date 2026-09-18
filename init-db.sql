-- Initialize pgvector extension and knowledge vault tables
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. Knowledge Document Table
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    content TEXT NOT NULL,
    excerpt TEXT,
    word_count INT DEFAULT 0,
    status_badge VARCHAR(64) DEFAULT '정제완료',
    badge_type VARCHAR(64) DEFAULT 'standard',
    backlinks_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Embedding Vector Store Table (RAG Chunking)
CREATE TABLE IF NOT EXISTS knowledge_embeddings (
    chunk_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_id VARCHAR(64) REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding vector(768), -- Gemini text-embedding-004 compatible vector dim
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Document Backlinks Table (Knowledge Graph Topology)
CREATE TABLE IF NOT EXISTS document_backlinks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_doc_id VARCHAR(64) REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    target_doc_id VARCHAR(64),
    target_doc_title VARCHAR(255) NOT NULL,
    link_context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. HNSW Vector Index for Sub-Millisecond Cosine Similarity Search
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_hnsw 
ON knowledge_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 5. Full-Text Search GIN Index for Hybrid Search
CREATE INDEX IF NOT EXISTS idx_doc_content_tsv
ON knowledge_documents
USING gin (to_tsvector('simple', title || ' ' || content));
