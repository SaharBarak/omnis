#!/usr/bin/env npx tsx
/**
 * Knowledge-base ingestion pipeline (OmnisX).
 *
 * Corpus (src/lib/docs/content.ts, the /learn guides) -> section-aware chunks
 * -> local bge-small-en-v1.5 embeddings -> knowledge_base + content_chunks
 * (Postgres/pgvector). Runs on plain Node — it does NOT need the Workers
 * runtime; only the query side (src/lib/services/knowledge-search.ts) does.
 *
 * Idempotent: knowledge_base is upserted per source_url and that source's
 * chunks are replaced in the same transaction — re-running never duplicates.
 *
 * Usage:
 *   # Local docker Postgres (container omnisx-pg; `docker start omnisx-pg` if stopped):
 *   DATABASE_URL='postgresql://postgres:omnisx@localhost:5433/omnisx' npm run ingest:knowledge
 *
 *   # Supabase prod (run manually — use the Supavisor pooler URL from the dashboard):
 *   DATABASE_URL='postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres' npm run ingest:knowledge
 *
 *   # Stats only, no DB writes:
 *   npm run ingest:knowledge -- --dry-run
 */

import postgres from 'postgres'

import { chunkDoc } from './chunk'
import { buildCorpus } from './corpus'
import { embedTexts, toVectorLiteral } from './embed'

const INSERT_BATCH = 50

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run')
  const corpus = buildCorpus()

  console.log(`Corpus: ${corpus.length} documents`)

  const prepared = corpus.map((doc) => {
    const chunks = chunkDoc(doc)
    const totalChars = chunks.reduce((sum, c) => sum + c.text.length, 0)
    console.log(
      `  ${doc.slug}: ${doc.sections.length} sections -> ${chunks.length} chunks ` +
        `(avg ${Math.round(totalChars / chunks.length)} chars)`
    )
    return { doc, chunks }
  })

  const totalChunks = prepared.reduce((sum, p) => sum + p.chunks.length, 0)
  console.log(`Total: ${totalChunks} chunks`)

  if (dryRun) {
    console.log('--dry-run: skipping embeddings and DB writes')
    return
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error(
      'Missing DATABASE_URL. Example (local docker pg):\n' +
        "  DATABASE_URL='postgresql://postgres:omnisx@localhost:5433/omnisx' npm run ingest:knowledge"
    )
    process.exit(1)
  }

  // prepare:false — safe for Supabase Supavisor transaction-mode pooling
  const sql = postgres(databaseUrl, { max: 1, prepare: false, connect_timeout: 15 })

  try {
    console.log('Embedding chunks with Xenova/bge-small-en-v1.5 (local, 384-dim)...')
    for (const { doc, chunks } of prepared) {
      const started = Date.now()
      const embeddings = await embedTexts(chunks.map((c) => c.text))

      await sql.begin(async (tx) => {
        const [kb] = await tx<{ id: string }[]>`
          INSERT INTO knowledge_base (source_url, title, content, metadata)
          VALUES (
            ${doc.sourceUrl},
            ${doc.title},
            ${doc.sections.map((s) => `${s.heading}\n\n${s.text}`).join('\n\n---\n\n')},
            ${tx.json({
              system: doc.slug,
              description: doc.description,
              source: 'learn-docs',
              embedding_model: 'bge-small-en-v1.5',
              ingested_at: new Date().toISOString(),
            })}
          )
          ON CONFLICT (source_url) DO UPDATE SET
            title = EXCLUDED.title,
            content = EXCLUDED.content,
            metadata = EXCLUDED.metadata
          RETURNING id
        `

        await tx`DELETE FROM content_chunks WHERE knowledge_base_id = ${kb.id}`

        const rows = chunks.map((chunk, i) => ({
          knowledge_base_id: kb.id,
          chunk_index: chunk.index,
          chunk_text: chunk.text,
          embedding: toVectorLiteral(embeddings[i]),
          metadata: tx.json(chunk.metadata),
        }))
        for (let i = 0; i < rows.length; i += INSERT_BATCH) {
          await tx`
            INSERT INTO content_chunks ${tx(
              rows.slice(i, i + INSERT_BATCH),
              'knowledge_base_id',
              'chunk_index',
              'chunk_text',
              'embedding',
              'metadata'
            )}
          `
        }
      })

      console.log(
        `  upserted ${doc.slug} (${chunks.length} chunks, ${Date.now() - started}ms)`
      )
    }

    const [{ count }] = await sql<{ count: string }[]>`
      SELECT count(*) FROM content_chunks WHERE embedding IS NOT NULL
    `
    console.log(`Done. content_chunks with embeddings: ${count}`)
  } finally {
    await sql.end()
  }
}

main().catch((error) => {
  console.error('Ingestion failed:', error)
  process.exit(1)
})
