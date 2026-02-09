import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

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
 * Generates an embedding for the query and performs vector search.
 */
export async function searchKnowledge(
  query: string,
  limit: number = 5,
  threshold: number = 0.7
): Promise<KnowledgeResult[]> {
  // Generate embedding for the query
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  })

  const queryEmbedding = embeddingResponse.data[0].embedding

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
