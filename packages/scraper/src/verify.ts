#!/usr/bin/env npx tsx
/**
 * End-to-end verification of the ingested knowledge base.
 *
 * Embeds test queries with the same local bge-small-en-v1.5 model and runs
 * the EXACT SQL used by src/lib/services/knowledge-search.ts (pgvector cosine
 * distance, Atlas-style score = 1 - distance/2, 0.7 threshold), so results
 * mirror what /api/knowledge/search returns in prod.
 *
 * Usage:
 *   DATABASE_URL='postgresql://postgres:omnisx@localhost:5433/omnisx' npm run ingest:knowledge:verify
 *   # Extra queries as args:
 *   DATABASE_URL='...' npm run ingest:knowledge:verify -- "what is a wavespell"
 */

import postgres from 'postgres'

import { embedText, toVectorLiteral } from './embed'

const THRESHOLD = 0.7 // matches searchKnowledge() default
const LIMIT = 5

const DEFAULT_QUERIES = [
  'what is a kin',
  'mercury retrograde',
  'gematria value',
  'human design strategy and authority',
  'what are the 20 solar seals',
]

interface Row {
  chunk_index: number
  chunk_text: string
  score: number
  source_url: string
  title: string
  heading: string | null
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error(
      'Missing DATABASE_URL. Example (local docker pg):\n' +
        "  DATABASE_URL='postgresql://postgres:omnisx@localhost:5433/omnisx' npm run ingest:knowledge:verify"
    )
    process.exit(1)
  }

  const extraQueries = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
  const queries = extraQueries.length > 0 ? extraQueries : DEFAULT_QUERIES

  const sql = postgres(databaseUrl, { max: 1, prepare: false, connect_timeout: 15 })

  try {
    for (const query of queries) {
      const vector = toVectorLiteral(await embedText(query))
      const rows = await sql<Row[]>`
        SELECT
          cc.chunk_index,
          cc.chunk_text,
          kb.title,
          kb.source_url,
          cc.metadata->>'heading' AS heading,
          1 - ((cc.embedding <=> ${vector}::vector) / 2) AS score
        FROM content_chunks cc
        JOIN knowledge_base kb ON kb.id = cc.knowledge_base_id
        WHERE cc.embedding IS NOT NULL
        ORDER BY cc.embedding <=> ${vector}::vector
        LIMIT ${LIMIT}
      `

      console.log(`\n=== "${query}"`)
      if (rows.length === 0) {
        console.log('  (no rows — is the corpus ingested?)')
        continue
      }
      for (const row of rows) {
        const pass = row.score >= THRESHOLD ? 'PASS' : 'below-threshold'
        console.log(
          `  ${row.score.toFixed(4)} [${pass}] ${row.title} :: ${row.heading ?? '?'} (#${row.chunk_index})`
        )
        console.log(`    ${row.chunk_text.replace(/\s+/g, ' ').slice(0, 140)}...`)
      }
    }
  } finally {
    await sql.end()
  }
}

main().catch((error) => {
  console.error('Verification failed:', error)
  process.exit(1)
})
