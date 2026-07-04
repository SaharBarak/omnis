import { getCloudflareContext } from '@opennextjs/cloudflare'
import { sql } from 'drizzle-orm'

import { getDb } from '@/lib/db/client'

/**
 * Knowledge base semantic search.
 *
 * Query embeddings are produced by Cloudflare Workers AI (bge-small-en-v1.5,
 * 384-dim) — the previous in-process @xenova/transformers pipeline does not run
 * on the Workers runtime. The corpus MUST be embedded with the SAME model
 * (handled in the scraper, packages/scraper) so query and corpus share one
 * 384-dim vector space.
 *
 * Vector search runs through pgvector cosine distance (`<=>`) on
 * content_chunks.embedding (vector(384)), replacing the Atlas
 * `$vectorSearch` aggregation. Similarity is normalized to [0,1] as
 * `1 - cosine_distance/2`, matching Atlas's `(1 + cosine)/2` vectorSearchScore
 * scale so the 0.7 default threshold keeps its original meaning.
 */

const EMBEDDING_MODEL = '@cf/baai/bge-small-en-v1.5'

interface WorkersAi {
  run(model: string, inputs: { text: string | string[] }): Promise<{ data: number[][] }>
}

async function embedQuery(query: string): Promise<number[]> {
  const { env } = await getCloudflareContext({ async: true })
  const ai = (env as unknown as { AI: WorkersAi }).AI
  if (!ai) {
    throw new Error('Workers AI binding (AI) is not available')
  }
  const result = await ai.run(EMBEDDING_MODEL, { text: query })
  const vector = result.data?.[0]
  if (!vector) {
    throw new Error('Workers AI returned no embedding')
  }
  return vector
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

type VectorSearchRow = {
  id: string
  knowledge_base_id: string
  chunk_index: number
  chunk_text: string
  score: number
  source_url: string
  title: string
}

/**
 * Search the knowledge base by semantic similarity.
 * Embeds the query with Workers AI, then runs a pgvector cosine search.
 */
export async function searchKnowledge(
  query: string,
  limit: number = 5,
  threshold: number = 0.7
): Promise<KnowledgeResult[]> {
  const queryEmbedding = await embedQuery(query)
  const db = getDb()

  const queryVector = `[${queryEmbedding.join(',')}]`

  const rows = await db.execute<VectorSearchRow>(sql`
    SELECT
      cc.id,
      cc.knowledge_base_id,
      cc.chunk_index,
      cc.chunk_text,
      kb.title,
      kb.source_url,
      -- Normalize cosine similarity to [0,1] to preserve the Atlas
      -- vectorSearchScore scale the 0.7 default threshold was tuned for:
      -- Atlas score = (1 + cosine) / 2, and (cc.embedding <=> v) = 1 - cosine.
      1 - ((cc.embedding <=> ${queryVector}::vector) / 2) AS score
    FROM content_chunks cc
    JOIN knowledge_base kb ON kb.id = cc.knowledge_base_id
    WHERE cc.embedding IS NOT NULL
    ORDER BY cc.embedding <=> ${queryVector}::vector
    LIMIT ${limit}
  `)

  return rows
    .filter((row) => row.score >= threshold)
    .map((row) => ({
      id: String(row.id),
      knowledgeBaseId: String(row.knowledge_base_id),
      chunkIndex: row.chunk_index,
      chunkText: row.chunk_text,
      sourceUrl: row.source_url,
      title: row.title,
      similarity: row.score,
    }))
}
