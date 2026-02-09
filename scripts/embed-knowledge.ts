#!/usr/bin/env npx tsx
/**
 * Knowledge Embedding Pipeline
 * Reads scraped markdown content, chunks it, generates embeddings,
 * and upserts into the content_chunks table.
 *
 * Usage: npx tsx scripts/embed-knowledge.ts
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import * as fs from 'fs/promises'
import * as path from 'path'

const INPUT_DIR = path.join(process.cwd(), 'data', 'knowledge')
const CHUNK_TARGET_TOKENS = 600 // ~500-800 range
const CHUNK_MAX_CHARS = 3000 // rough upper bound
const EMBEDDING_MODEL = 'text-embedding-3-small'
const BATCH_SIZE = 20 // embeddings per API call

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

interface ParsedFile {
  sourceUrl: string
  title: string
  content: string
  filename: string
}

function parseFrontmatter(raw: string): ParsedFile {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/)
  if (!match) {
    return { sourceUrl: '', title: 'Unknown', content: raw, filename: '' }
  }

  const frontmatter = match[1]
  const content = match[2]

  const sourceUrl = frontmatter.match(/source:\s*(.+)/)?.[1]?.trim() || ''
  const title = frontmatter.match(/title:\s*"(.+)"/)?.[1]?.trim() || 'Unknown'

  return { sourceUrl, title, content, filename: '' }
}

interface Chunk {
  text: string
  index: number
  metadata: Record<string, unknown>
}

function chunkContent(content: string, title: string): Chunk[] {
  const chunks: Chunk[] = []

  // Split by headings
  const sections = content.split(/\n(?=#{1,6}\s)/)
  let currentChunk = ''
  let chunkIndex = 0
  let currentHeading = title

  for (const section of sections) {
    const headingMatch = section.match(/^(#{1,6})\s+(.+)/)
    if (headingMatch) {
      currentHeading = headingMatch[2].trim()
    }

    // If adding this section would exceed max, flush current chunk
    if (currentChunk && (currentChunk.length + section.length > CHUNK_MAX_CHARS)) {
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex++,
        metadata: { heading: currentHeading },
      })
      currentChunk = ''
    }

    currentChunk += section + '\n'

    // If current chunk is large enough on its own, flush
    if (currentChunk.length >= CHUNK_MAX_CHARS) {
      // Split large chunks by paragraphs
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

  // Flush remaining
  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      index: chunkIndex++,
      metadata: { heading: currentHeading },
    })
  }

  return chunks.filter((c) => c.text.length > 30)
}

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  })
  return response.data.map((d) => d.embedding)
}

async function main() {
  console.log('🧠 Starting embedding pipeline\n')

  // Read all markdown files
  const files = (await fs.readdir(INPUT_DIR)).filter((f) => f.endsWith('.md'))
  console.log(`📂 Found ${files.length} files in ${INPUT_DIR}\n`)

  let totalChunks = 0

  for (const file of files) {
    const raw = await fs.readFile(path.join(INPUT_DIR, file), 'utf-8')
    const parsed = parseFrontmatter(raw)
    parsed.filename = file

    if (!parsed.sourceUrl || !parsed.content) {
      console.warn(`⏭ Skipping ${file}: missing source URL or content`)
      continue
    }

    console.log(`📄 Processing: ${parsed.title} (${file})`)

    // Get or create knowledge_base entry
    const { data: kbEntry, error: kbError } = await supabase
      .from('knowledge_base')
      .select('id')
      .eq('source_url', parsed.sourceUrl)
      .single()

    if (kbError || !kbEntry) {
      console.warn(`  ⚠ No knowledge_base entry for ${parsed.sourceUrl}, upserting...`)
      const { data: inserted, error: insertErr } = await supabase
        .from('knowledge_base')
        .upsert(
          {
            source_url: parsed.sourceUrl,
            title: parsed.title,
            content: parsed.content,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'source_url' }
        )
        .select('id')
        .single()

      if (insertErr || !inserted) {
        console.error(`  ❌ Failed to upsert: ${insertErr?.message}`)
        continue
      }
      var knowledgeBaseId = inserted.id
    } else {
      var knowledgeBaseId = kbEntry.id
    }

    // Chunk content
    const chunks = chunkContent(parsed.content, parsed.title)
    console.log(`  📦 ${chunks.length} chunks`)

    // Delete existing chunks for this entry
    await supabase
      .from('content_chunks')
      .delete()
      .eq('knowledge_base_id', knowledgeBaseId)

    // Generate embeddings in batches and insert
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE)
      const texts = batch.map((c) => c.text)

      console.log(`  🔄 Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}`)
      const embeddings = await generateEmbeddings(texts)

      const rows = batch.map((chunk, j) => ({
        knowledge_base_id: knowledgeBaseId,
        chunk_index: chunk.index,
        chunk_text: chunk.text,
        embedding: JSON.stringify(embeddings[j]),
        metadata: chunk.metadata,
      }))

      const { error: insertError } = await supabase
        .from('content_chunks')
        .insert(rows)

      if (insertError) {
        console.error(`  ❌ Insert error: ${insertError.message}`)
      }

      totalChunks += batch.length
    }

    console.log(`  ✅ Done`)
  }

  console.log(`\n✅ Embedding pipeline complete! ${totalChunks} chunks embedded.`)
}

main().catch(console.error)
