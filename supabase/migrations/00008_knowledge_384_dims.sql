-- Migrate knowledge embeddings from 1536 dims (OpenAI) to 384 dims (all-MiniLM-L6-v2)
-- This requires re-embedding all content after applying this migration.

-- Drop the old HNSW index (dimension is changing)
DROP INDEX IF EXISTS idx_content_chunks_embedding;

-- Change the embedding column to 384 dimensions
ALTER TABLE public.content_chunks
  ALTER COLUMN embedding TYPE extensions.vector(384);

-- Recreate the HNSW index for 384-dim vectors
CREATE INDEX idx_content_chunks_embedding ON public.content_chunks
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Replace the search function with 384-dim version
CREATE OR REPLACE FUNCTION public.search_knowledge(
  query_embedding extensions.vector(384),
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
