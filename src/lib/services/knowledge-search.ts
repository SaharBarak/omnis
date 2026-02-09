import { createClient } from '@supabase/supabase-js'
import { pipeline, type FeatureExtractionPipeline } from '@xenova/transformers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2'

// Lazy-loaded embedding pipeline (singleton)
let embedder: FeatureExtractionPipeline | null = null

async function getEmbedder(): Promise<FeatureExtractionPipeline> {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', EMBEDDING_MODEL)
  }
  return embedder
}

export interface KnowledgeResult {
  id: string
  knowledgeBaseId: string
  chunkIndex: number
  chunkText: string
  sourceUrl: string
  title: string
  similarity: number
}

/**
 * Search the knowledge base using semantic similarity.
 * Generates an embedding locally and performs vector search.
 * No API keys needed — runs entirely in-process.
 */
export async function searchKnowledge(
  query: string,
  limit: number = 5,
  threshold: number = 0.7
): Promise<KnowledgeResult[]> {
  // Generate embedding locally
  const model = await getEmbedder()
  const output = await model(query, { pooling: 'mean', normalize: true })
  const queryEmbedding = Array.from(output.data as Float32Array)

  // Call the Supabase RPC function
  const { data, error } = await supabase.rpc('search_knowledge', {
    query_embedding: JSON.stringify(queryEmbedding),
    match_threshold: threshold,
    match_count: limit,
  })

  if (error) {
    console.error('Knowledge search error:', error)
    throw new Error(`Knowledge search failed: ${error.message}`)
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    knowledgeBaseId: row.knowledge_base_id as string,
    chunkIndex: row.chunk_index as number,
    chunkText: row.chunk_text as string,
    sourceUrl: row.source_url as string,
    title: row.title as string,
    similarity: row.similarity as number,
  }))
}
