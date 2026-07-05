/**
 * Local embedding generation via @xenova/transformers.
 *
 * Model: Xenova/bge-small-en-v1.5 (384-dim) — the ONNX export of the exact
 * model the query side runs on Cloudflare Workers AI
 * (@cf/baai/bge-small-en-v1.5, see src/lib/services/knowledge-search.ts).
 * Query and corpus therefore share one vector space; cosine distance is
 * scale-invariant so mean-pool + L2-normalize here is compatible regardless
 * of whether Workers AI normalizes its output.
 *
 * No API keys or Workers bindings needed — the model (~34MB) is downloaded
 * to the local transformers cache on first run.
 */

import { pipeline } from '@xenova/transformers'

const MODEL = 'Xenova/bge-small-en-v1.5'
export const EMBEDDING_DIMS = 384
const BATCH_SIZE = 16

type FeatureExtractor = (
  texts: string[],
  options: { pooling: 'mean'; normalize: boolean }
) => Promise<{ dims: number[]; data: Float32Array }>

let extractorPromise: Promise<FeatureExtractor> | null = null

function getExtractor(): Promise<FeatureExtractor> {
  extractorPromise ??= pipeline('feature-extraction', MODEL).then(
    (p) => p as unknown as FeatureExtractor
  )
  return extractorPromise
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const extractor = await getExtractor()
  const vectors: number[][] = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const output = await extractor(batch, { pooling: 'mean', normalize: true })
    const [rows, dims] = output.dims
    if (dims !== EMBEDDING_DIMS) {
      throw new Error(`Expected ${EMBEDDING_DIMS}-dim embeddings, got ${dims}`)
    }
    for (let row = 0; row < rows; row++) {
      vectors.push(Array.from(output.data.slice(row * dims, (row + 1) * dims)))
    }
  }
  return vectors
}

export async function embedText(text: string): Promise<number[]> {
  const [vector] = await embedTexts([text])
  return vector
}

/** pgvector literal, e.g. "[0.1,0.2,...]" — cast with ::vector in SQL. */
export function toVectorLiteral(vector: number[]): string {
  return `[${vector.join(',')}]`
}
