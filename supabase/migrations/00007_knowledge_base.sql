-- Knowledge Base Schema for semantic search
-- Stores scraped content and vector embeddings for RAG

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ============================================================================
-- KNOWLEDGE_BASE TABLE
-- Stores full scraped pages
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  source_url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CONTENT_CHUNKS TABLE
-- Chunked content with vector embeddings for similarity search
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.content_chunks (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  knowledge_base_id UUID NOT NULL REFERENCES public.knowledge_base(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding extensions.vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_chunks_kb_id ON public.content_chunks(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_content_chunks_embedding ON public.content_chunks
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_chunks ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access on knowledge_base"
  ON public.knowledge_base
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on content_chunks"
  ON public.content_chunks
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can read
CREATE POLICY "Authenticated users can read knowledge_base"
  ON public.knowledge_base
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read content_chunks"
  ON public.content_chunks
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- SIMILARITY SEARCH FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.search_knowledge(
  query_embedding extensions.vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  knowledge_base_id UUID,
  chunk_index INTEGER,
  chunk_text TEXT,
  source_url TEXT,
  title TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id,
    cc.knowledge_base_id,
    cc.chunk_index,
    cc.chunk_text,
    kb.source_url,
    kb.title,
    1 - (cc.embedding <=> query_embedding) AS similarity
  FROM public.content_chunks cc
  JOIN public.knowledge_base kb ON kb.id = cc.knowledge_base_id
  WHERE 1 - (cc.embedding <=> query_embedding) > match_threshold
  ORDER BY cc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
