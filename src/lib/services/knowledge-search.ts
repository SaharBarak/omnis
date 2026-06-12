import { getCloudflareContext } from '@opennextjs/cloudflare'
import { connectMongo } from '@/lib/db/connection'
import { ContentChunk } from '@/lib/db/models'

/**
 * Knowledge base semantic search.
 *
 * Query embeddings are produced by Cloudflare Workers AI (bge-small-en-v1.5,
 * 384-dim) — the previous in-process @xenova/transformers pipeline does not run
 * on the Workers runtime. The corpus MUST be embedded with the SAME model
 * (handled in the scraper, packages/scraper) so query and corpus share one
 * 384-dim vector space.
 *
 * Vector search runs through an Atlas Vector Search index named
 * `embedding_vector_index` on content_chunks.embedding (384 dims, cosine),
 * replacing the Postgres pgvector `search_knowledge` RPC.
 */

const EMBEDDING_MODEL = '@cf/baai/bge-small-en-v1.5'
const VECTOR_INDEX = 'embedding_vector_index'

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

interface VectorSearchRow {
  _id: unknown
  knowledge_base_id: unknown
  chunk_index: number
  chunk_text: string
  score: number
  kb: { source_url: string; title: string }
}

/**
 * Search the knowledge base by semantic similarity.
 * Embeds the query with Workers AI, then runs Atlas $vectorSearch.
 */
export async function searchKnowledge(
  query: string,
  limit: number = 5,
  threshold: number = 0.7
): Promise<KnowledgeResult[]> {
  const queryEmbedding = await embedQuery(query)
  await connectMongo()

  const rows = await ContentChunk.aggregate<VectorSearchRow>([
    {
      $vectorSearch: {
        index: VECTOR_INDEX,
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: Math.max(limit * 10, 100),
        limit,
      },
    },
    {
      $project: {
        knowledge_base_id: 1,
        chunk_index: 1,
        chunk_text: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
    {
      $lookup: {
        from: 'knowledge_base',
        localField: 'knowledge_base_id',
        foreignField: '_id',
        as: 'kb',
      },
    },
    { $unwind: '$kb' },
  ])

  return rows
    .filter((row) => row.score >= threshold)
    .map((row) => ({
      id: String(row._id),
      knowledgeBaseId: String(row.knowledge_base_id),
      chunkIndex: row.chunk_index,
      chunkText: row.chunk_text,
      sourceUrl: row.kb.source_url,
      title: row.kb.title,
      similarity: row.score,
    }))
}
