#!/usr/bin/env npx tsx
/**
 * Knowledge Embedding Pipeline
 *
 * Reads scraped markdown content from data/knowledge/{source-id}/,
 * chunks it, generates embeddings locally using transformers.js, and upserts into Supabase.
 *
 * No API keys needed for embeddings — runs entirely locally.
 *
 * Usage:
 *   npx tsx scripts/embed-knowledge.ts                         # Embed all sources
 *   npx tsx scripts/embed-knowledge.ts --source=jovianarchive  # Single source
 *   npx tsx scripts/embed-knowledge.ts --category=kabbalah     # All in category
 *   npx tsx scripts/embed-knowledge.ts --dry-run               # Show stats only
 */

import { createClient } from '@supabase/supabase-js'
import { pipeline, type FeatureExtractionPipeline } from '@xenova/transformers'
import * as fs from 'fs/promises'
import * as path from 'path'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KnowledgeSource {
  id: string
  name: string
  url: string
  category: string
  startPaths: string[]
  crawlPattern: string
  priority: number
  notes?: string
}

interface ParsedFile {
  sourceUrl: string
  sourceId: string
  category: string
  title: string
  content: string
  filename: string
}

interface Chunk {
  text: string
  index: number
  metadata: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SOURCES_FILE = path.join(__dirname, 'knowledge-sources.json')
const DATA_DIR = path.join(process.cwd(), 'data', 'knowledge')
const CHUNK_MAX_CHARS = 3000
const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2'
const EMBEDDING_DIMS = 384
const BATCH_SIZE = 32 // Local model can handle larger batches

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Lazy-loaded embedding pipeline (singleton)
let embedder: FeatureExtractionPipeline | null = null

async function getEmbedder(): Promise<FeatureExtractionPipeline> {
  if (!embedder) {
    console.log(`🔄 Loading embedding model: ${EMBEDDING_MODEL}...`)
    embedder = await pipeline('feature-extraction', EMBEDDING_MODEL)
    console.log(`✅ Model loaded (${EMBEDDING_DIMS}-dim vectors)`)
  }
  return embedder
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2)
  const opts: Record<string, string> = {}
  for (const arg of args) {
    const m = arg.match(/^--(\w[\w-]*)(?:=(.+))?$/)
    if (m) opts[m[1]] = m[2] ?? 'true'
  }
  return {
    source: opts['source'] ?? null,
    category: opts['category'] ?? null,
    dryRun: opts['dry-run'] === 'true',
  }
}

// ---------------------------------------------------------------------------
// Frontmatter parsing
// ---------------------------------------------------------------------------

function parseFrontmatter(raw: string, filename: string): ParsedFile {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/)
  if (!match) {
    return { sourceUrl: '', sourceId: '', category: '', title: 'Unknown', content: raw, filename }
  }

  const fm = match[1]
  const content = match[2]

  return {
    sourceUrl: fm.match(/source:\s*(.+)/)?.[1]?.trim() || '',
    sourceId: fm.match(/source_id:\s*(.+)/)?.[1]?.trim() || '',
    category: fm.match(/category:\s*(.+)/)?.[1]?.trim() || '',
    title: fm.match(/title:\s*"(.+)"/)?.[1]?.trim() || 'Unknown',
    content,
    filename,
  }
}

// ---------------------------------------------------------------------------
// Chunking
// ---------------------------------------------------------------------------

function chunkContent(content: string, title: string): Chunk[] {
  const chunks: Chunk[] = []
  const sections = content.split(/\n(?=#{1,6}\s)/)
  let currentChunk = ''
  let chunkIndex = 0
  let currentHeading = title

  for (const section of sections) {
    const headingMatch = section.match(/^(#{1,6})\s+(.+)/)
    if (headingMatch) currentHeading = headingMatch[2].trim()

    if (currentChunk && (currentChunk.length + section.length > CHUNK_MAX_CHARS)) {
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex++,
        metadata: { heading: currentHeading },
      })
      currentChunk = ''
    }

    currentChunk += section + '\n'

    if (currentChunk.length >= CHUNK_MAX_CHARS) {
      const paragraphs = currentChunk.split(/\n\n+/)
      let subChunk = ''
      for (const para of paragraphs) {
        if (subChunk && (subChunk.length + para.length > CHUNK_MAX_CHARS)) {
          chunks.push({
            text: subChunk.trim(),
            index: chunkIndex++,
            metadata: { heading: currentHeading },
          })
          subChunk = ''
        }
        subChunk += para + '\n\n'
      }
      currentChunk = subChunk
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      index: chunkIndex++,
      metadata: { heading: currentHeading },
    })
  }

  return chunks.filter((c) => c.text.length > 30)
}

// ---------------------------------------------------------------------------
// Embedding (local)
// ---------------------------------------------------------------------------

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const model = await getEmbedder()
  const results: number[][] = []

  for (const text of texts) {
    const output = await model(text, { pooling: 'mean', normalize: true })
    results.push(Array.from(output.data as Float32Array))
  }

  return results
}

// ---------------------------------------------------------------------------
// Process a single source directory
// ---------------------------------------------------------------------------

async function processSource(sourceId: string, dryRun: boolean): Promise<number> {
  const sourceDir = path.join(DATA_DIR, sourceId)

  let files: string[]
  try {
    files = (await fs.readdir(sourceDir)).filter(
      (f) => f.endsWith('.md') && !f.startsWith('_')
    )
  } catch {
    console.warn(`  ⚠ No data directory for ${sourceId}`)
    return 0
  }

  if (files.length === 0) {
    console.log(`  ⏭ No markdown files for ${sourceId}`)
    return 0
  }

  console.log(`\n📂 ${sourceId}: ${files.length} files`)

  if (dryRun) {
    let totalChars = 0
    for (const file of files) {
      const raw = await fs.readFile(path.join(sourceDir, file), 'utf-8')
      const parsed = parseFrontmatter(raw, file)
      const chunks = chunkContent(parsed.content, parsed.title)
      totalChars += parsed.content.length
      console.log(`   ${file}: ${chunks.length} chunks, ${parsed.content.length} chars`)
    }
    console.log(`   Total: ~${Math.ceil(totalChars / 4)} tokens`)
    return 0
  }

  let totalChunks = 0

  for (const file of files) {
    const raw = await fs.readFile(path.join(sourceDir, file), 'utf-8')
    const parsed = parseFrontmatter(raw, file)

    if (!parsed.sourceUrl || !parsed.content) {
      console.warn(`  ⏭ Skipping ${file}: missing source URL or content`)
      continue
    }

    console.log(`  📄 ${parsed.title} (${file})`)

    // Upsert knowledge_base entry
    const { data: kbEntry, error: kbError } = await supabase
      .from('knowledge_base')
      .upsert(
        {
          source_url: parsed.sourceUrl,
          title: parsed.title,
          content: parsed.content,
          metadata: {
            source_id: parsed.sourceId || sourceId,
            category: parsed.category,
            scraped_at: new Date().toISOString(),
            filename: file,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'source_url' }
      )
      .select('id')
      .single()

    if (kbError || !kbEntry) {
      console.error(`     ❌ KB upsert failed: ${kbError?.message}`)
      continue
    }

    const knowledgeBaseId = kbEntry.id

    // Chunk and embed
    const chunks = chunkContent(parsed.content, parsed.title)
    console.log(`     📦 ${chunks.length} chunks`)

    // Delete existing chunks
    await supabase.from('content_chunks').delete().eq('knowledge_base_id', knowledgeBaseId)

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE)
      const texts = batch.map((c) => c.text)

      console.log(`     🔄 Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}`)
      const embeddings = await generateEmbeddings(texts)

      const rows = batch.map((chunk, j) => ({
        knowledge_base_id: knowledgeBaseId,
        chunk_index: chunk.index,
        chunk_text: chunk.text,
        embedding: JSON.stringify(embeddings[j]),
        metadata: {
          ...chunk.metadata,
          source_id: parsed.sourceId || sourceId,
          category: parsed.category,
        },
      }))

      const { error: insertError } = await supabase.from('content_chunks').insert(rows)
      if (insertError) console.error(`     ❌ Insert error: ${insertError.message}`)

      totalChunks += batch.length
    }

    console.log(`     ✅ Done`)
  }

  return totalChunks
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const opts = parseArgs()

  console.log('🧠 Omnis Knowledge Embedding Pipeline (local model)')
  console.log(`   Model: ${EMBEDDING_MODEL} (${EMBEDDING_DIMS} dimensions)`)
  console.log(`   Mode: ${opts.dryRun ? 'DRY RUN' : 'LIVE'}`)

  // Load sources config
  const raw = await fs.readFile(SOURCES_FILE, 'utf-8')
  const allSources: KnowledgeSource[] = JSON.parse(raw)

  // Filter
  let sources = allSources
  if (opts.source) {
    sources = allSources.filter((s) => s.id === opts.source)
    if (sources.length === 0) {
      console.error(`❌ Source "${opts.source}" not found.`)
      process.exit(1)
    }
  } else if (opts.category) {
    sources = allSources.filter((s) => s.category === opts.category)
    if (sources.length === 0) {
      console.error(`❌ No sources in category "${opts.category}".`)
      process.exit(1)
    }
  }

  let grandTotal = 0

  for (const source of sources) {
    try {
      const chunks = await processSource(source.id, opts.dryRun)
      grandTotal += chunks
    } catch (err: any) {
      console.error(`❌ Error processing ${source.id}: ${err.message}`)
    }
  }

  console.log(`\n✅ Embedding pipeline complete! ${grandTotal} chunks embedded.`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
