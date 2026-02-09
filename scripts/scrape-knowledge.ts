#!/usr/bin/env npx tsx
/**
 * Knowledge Base Scraper
 * Crawls jovianarchive.com and saves content as markdown files.
 * Also upserts into the knowledge_base Supabase table.
 *
 * Usage: npx tsx scripts/scrape-knowledge.ts
 */

import * as cheerio from 'cheerio'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs/promises'
import * as path from 'path'

const BASE_URL = 'https://jovianarchive.com'
const START_PATH = '/pages/about-human-design'
const OUTPUT_DIR = path.join(process.cwd(), 'data', 'knowledge')
const MAX_CONCURRENCY = 3
const DELAY_MS = 1000 // Be polite

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const visited = new Set<string>()
const queue: string[] = [START_PATH]

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'OmnisBot/1.0 (knowledge scraper; contact@omnis.app)',
      },
    })
    if (!res.ok) {
      console.warn(`  ⚠ ${res.status} for ${url}`)
      return null
    }
    return await res.text()
  } catch (err) {
    console.warn(`  ⚠ Failed to fetch ${url}:`, err)
    return null
  }
}

function extractContent($: cheerio.CheerioAPI): { title: string; markdown: string } {
  // Remove nav, footer, scripts, styles, sidebars
  $('nav, footer, script, style, header, .site-header, .site-footer, .sidebar, .navigation, [role="navigation"]').remove()

  const title = $('h1').first().text().trim() || $('title').text().trim() || 'Untitled'

  // Get main content area
  const mainContent = $('main, article, .page-content, .entry-content, .content, [role="main"]').first()
  const contentEl = mainContent.length ? mainContent : $('body')

  // Convert to markdown-ish text
  const lines: string[] = []

  contentEl.find('h1, h2, h3, h4, h5, h6, p, li, blockquote').each((_, el) => {
    const $el = $(el)
    const tag = el.type === 'tag' ? el.tagName.toLowerCase() : ''
    const text = $el.text().trim()
    if (!text) return

    switch (tag) {
      case 'h1': lines.push(`\n# ${text}\n`); break
      case 'h2': lines.push(`\n## ${text}\n`); break
      case 'h3': lines.push(`\n### ${text}\n`); break
      case 'h4': lines.push(`\n#### ${text}\n`); break
      case 'h5': lines.push(`\n##### ${text}\n`); break
      case 'h6': lines.push(`\n###### ${text}\n`); break
      case 'li': lines.push(`- ${text}`); break
      case 'blockquote': lines.push(`> ${text}\n`); break
      default: lines.push(`${text}\n`); break
    }
  })

  return { title, markdown: lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() }
}

function extractLinks($: cheerio.CheerioAPI): string[] {
  const links: string[] = []
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return

    let resolved: string
    try {
      resolved = new URL(href, BASE_URL).pathname
    } catch {
      return
    }

    // Only follow /pages/* links on the same domain
    if (resolved.startsWith('/pages/') && !visited.has(resolved) && !queue.includes(resolved)) {
      links.push(resolved)
    }
  })
  return links
}

function slugify(urlPath: string): string {
  return urlPath
    .replace(/^\/pages\//, '')
    .replace(/\//g, '-')
    .replace(/[^a-z0-9-]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'index'
}

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function processPage(pagePath: string) {
  const fullUrl = `${BASE_URL}${pagePath}`
  console.log(`📄 Scraping: ${fullUrl}`)

  const html = await fetchPage(fullUrl)
  if (!html) return

  const $ = cheerio.load(html)
  const { title, markdown } = extractContent($)

  if (!markdown || markdown.length < 50) {
    console.log(`  ⏭ Skipping (too short): ${pagePath}`)
    return
  }

  // Save to file
  const filename = `${slugify(pagePath)}.md`
  const filepath = path.join(OUTPUT_DIR, filename)
  const fileContent = `---\nsource: ${fullUrl}\ntitle: "${title.replace(/"/g, '\\"')}"\nscraped_at: ${new Date().toISOString()}\n---\n\n${markdown}`
  await fs.writeFile(filepath, fileContent, 'utf-8')
  console.log(`  💾 Saved: ${filename} (${markdown.length} chars)`)

  // Upsert into Supabase
  const { error } = await supabase
    .from('knowledge_base')
    .upsert(
      {
        source_url: fullUrl,
        title,
        content: markdown,
        metadata: { scraped_at: new Date().toISOString(), filename },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'source_url' }
    )

  if (error) {
    console.warn(`  ⚠ Supabase upsert error: ${error.message}`)
  } else {
    console.log(`  ✅ Upserted to Supabase`)
  }

  // Extract and queue new links
  const newLinks = extractLinks($)
  for (const link of newLinks) {
    if (!visited.has(link) && !queue.includes(link)) {
      queue.push(link)
      console.log(`  🔗 Queued: ${link}`)
    }
  }
}

async function main() {
  console.log('🚀 Starting knowledge base scraper')
  console.log(`   Target: ${BASE_URL}`)
  console.log(`   Start page: ${START_PATH}`)
  console.log(`   Output: ${OUTPUT_DIR}\n`)

  // Check robots.txt
  const robotsTxt = await fetchPage(`${BASE_URL}/robots.txt`)
  if (robotsTxt) {
    console.log('📋 robots.txt found:')
    console.log(robotsTxt.slice(0, 500))
    console.log()
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  let processed = 0
  while (queue.length > 0) {
    const pagePath = queue.shift()!
    if (visited.has(pagePath)) continue
    visited.add(pagePath)

    await processPage(pagePath)
    processed++
    await delay(DELAY_MS)
  }

  console.log(`\n✅ Done! Processed ${processed} pages.`)
}

main().catch(console.error)
