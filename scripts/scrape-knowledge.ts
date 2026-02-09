#!/usr/bin/env npx tsx
/**
 * Multi-Source Knowledge Base Scraper
 *
 * Reads from knowledge-sources.json and crawls configured websites,
 * saving content as markdown files for later embedding.
 *
 * Usage:
 *   npx tsx scripts/scrape-knowledge.ts                    # Scrape all sources
 *   npx tsx scripts/scrape-knowledge.ts --source=jovianarchive  # Single source
 *   npx tsx scripts/scrape-knowledge.ts --dry-run          # Show what would be scraped
 *   npx tsx scripts/scrape-knowledge.ts --source=jovianarchive --dry-run
 *   npx tsx scripts/scrape-knowledge.ts --max-pages=50     # Limit pages per source
 *   npx tsx scripts/scrape-knowledge.ts --category=kabbalah # Scrape all in category
 */

import * as cheerio from 'cheerio'
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

interface ScrapeState {
  scraped: string[]
  lastRun: string
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SOURCES_FILE = path.join(__dirname, 'knowledge-sources.json')
const DATA_DIR = path.join(process.cwd(), 'data', 'knowledge')
const USER_AGENT = 'OmnisBot/1.0 (knowledge scraper; https://omnis.app)'
const DEFAULT_DELAY_MS = 800 // ~1.2 req/sec
const DEFAULT_MAX_PAGES = 200

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
    maxPages: parseInt(opts['max-pages'] ?? String(DEFAULT_MAX_PAGES), 10),
  }
}

// ---------------------------------------------------------------------------
// Robots.txt
// ---------------------------------------------------------------------------

const robotsCache = new Map<string, string[]>()

async function getDisallowedPaths(baseUrl: string): Promise<string[]> {
  if (robotsCache.has(baseUrl)) return robotsCache.get(baseUrl)!

  try {
    const res = await fetch(`${baseUrl}/robots.txt`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      robotsCache.set(baseUrl, [])
      return []
    }
    const text = await res.text()
    const disallowed: string[] = []
    let inOurSection = false
    let inWildcard = false

    for (const line of text.split('\n')) {
      const trimmed = line.trim().toLowerCase()
      if (trimmed.startsWith('user-agent:')) {
        const agent = trimmed.slice(11).trim()
        inOurSection = agent === 'omnisbot' || agent === 'omnisbot/1.0'
        inWildcard = agent === '*'
      } else if ((inOurSection || inWildcard) && trimmed.startsWith('disallow:')) {
        const p = trimmed.slice(9).trim()
        if (p) disallowed.push(p)
      }
    }
    robotsCache.set(baseUrl, disallowed)
    return disallowed
  } catch {
    robotsCache.set(baseUrl, [])
    return []
  }
}

function isPathAllowed(pagePath: string, disallowed: string[]): boolean {
  for (const rule of disallowed) {
    if (rule.endsWith('*')) {
      if (pagePath.startsWith(rule.slice(0, -1))) return false
    } else if (pagePath === rule || pagePath.startsWith(rule)) {
      return false
    }
  }
  return true
}

// ---------------------------------------------------------------------------
// Glob-style pattern matching
// ---------------------------------------------------------------------------

function matchesCrawlPattern(urlPath: string, pattern: string): boolean {
  // Convert glob pattern to regex
  // /pages/* → matches /pages/ and anything under it
  // /* → matches everything
  const regexStr = '^' + pattern
    .replace(/[.*+?^${}()|[\]\\]/g, (m) => (m === '*' ? '___STAR___' : '\\' + m))
    .replace(/___STAR___/g, '.*') + '$'
  return new RegExp(regexStr).test(urlPath)
}

// ---------------------------------------------------------------------------
// HTTP fetching with rate limiting
// ---------------------------------------------------------------------------

const domainLastFetch = new Map<string, number>()

async function rateLimitedFetch(url: string): Promise<string | null> {
  const hostname = new URL(url).hostname
  const now = Date.now()
  const last = domainLastFetch.get(hostname) ?? 0
  const wait = Math.max(0, DEFAULT_DELAY_MS - (now - last))
  if (wait > 0) await delay(wait)
  domainLastFetch.set(hostname, Date.now())

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    })
    if (!res.ok) {
      console.warn(`  ⚠ ${res.status} for ${url}`)
      return null
    }
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('text/html') && !ct.includes('text/plain') && !ct.includes('application/xhtml')) {
      return null
    }
    return await res.text()
  } catch (err: any) {
    console.warn(`  ⚠ Failed: ${url} — ${err.message ?? err}`)
    return null
  }
}

// ---------------------------------------------------------------------------
// Content extraction
// ---------------------------------------------------------------------------

function extractContent($: cheerio.CheerioAPI): { title: string; markdown: string } {
  $('nav, footer, script, style, header, .site-header, .site-footer, .sidebar, .navigation, [role="navigation"], .cookie-banner, .popup, .modal, .ad, .advertisement, .share-buttons, .social-share, .comments, #comments, .related-posts').remove()

  const title = $('h1').first().text().trim() || $('title').text().trim() || 'Untitled'

  const mainContent = $('main, article, .page-content, .entry-content, .content, .post-content, [role="main"], .article-body').first()
  const contentEl = mainContent.length ? mainContent : $('body')

  const lines: string[] = []
  contentEl.find('h1, h2, h3, h4, h5, h6, p, li, blockquote, pre, td').each((_, el) => {
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
      case 'pre': lines.push(`\`\`\`\n${text}\n\`\`\`\n`); break
      default: lines.push(`${text}\n`); break
    }
  })

  return { title, markdown: lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() }
}

function extractLinks($: cheerio.CheerioAPI, baseUrl: string, crawlPattern: string): string[] {
  const links: string[] = []
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return

    let resolved: URL
    try {
      resolved = new URL(href, baseUrl)
    } catch {
      return
    }

    // Only follow same-domain links matching the crawl pattern
    const base = new URL(baseUrl)
    if (resolved.hostname !== base.hostname) return

    const urlPath = resolved.pathname
    if (matchesCrawlPattern(urlPath, crawlPattern)) {
      links.push(urlPath)
    }
  })
  return [...new Set(links)]
}

// ---------------------------------------------------------------------------
// Slug & state helpers
// ---------------------------------------------------------------------------

function slugify(urlPath: string): string {
  return urlPath
    .replace(/^\//, '')
    .replace(/\//g, '-')
    .replace(/[^a-z0-9-]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'index'
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function loadState(stateFile: string): Promise<ScrapeState> {
  try {
    const raw = await fs.readFile(stateFile, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { scraped: [], lastRun: '' }
  }
}

async function saveState(stateFile: string, state: ScrapeState) {
  await fs.writeFile(stateFile, JSON.stringify(state, null, 2), 'utf-8')
}

// ---------------------------------------------------------------------------
// Main scraper for a single source
// ---------------------------------------------------------------------------

async function scrapeSource(source: KnowledgeSource, opts: { dryRun: boolean; maxPages: number }) {
  const sourceDir = path.join(DATA_DIR, source.id)
  const stateFile = path.join(sourceDir, '_state.json')

  console.log(`\n${'='.repeat(60)}`)
  console.log(`📚 ${source.name} (${source.id})`)
  console.log(`   URL: ${source.url}`)
  console.log(`   Category: ${source.category}`)
  console.log(`   Pattern: ${source.crawlPattern}`)
  console.log(`${'='.repeat(60)}`)

  if (opts.dryRun) {
    console.log(`   🔍 DRY RUN — would crawl starting from:`)
    for (const sp of source.startPaths) {
      console.log(`      ${source.url}${sp}`)
    }
    return { pages: 0, source: source.id }
  }

  await fs.mkdir(sourceDir, { recursive: true })

  // Load resume state
  const state = await loadState(stateFile)
  const visited = new Set<string>(state.scraped)
  const queue: string[] = []

  // Seed the queue with start paths not yet visited
  for (const sp of source.startPaths) {
    if (!visited.has(sp)) queue.push(sp)
  }

  // Check robots.txt
  const disallowed = await getDisallowedPaths(source.url)
  if (disallowed.length > 0) {
    console.log(`   🤖 robots.txt disallows ${disallowed.length} paths`)
  }

  let processed = 0

  while (queue.length > 0 && processed < opts.maxPages) {
    const pagePath = queue.shift()!
    if (visited.has(pagePath)) continue
    if (!isPathAllowed(pagePath, disallowed)) {
      console.log(`  🚫 Blocked by robots.txt: ${pagePath}`)
      visited.add(pagePath)
      continue
    }

    visited.add(pagePath)
    const fullUrl = `${source.url}${pagePath}`
    console.log(`  📄 [${processed + 1}] ${fullUrl}`)

    const html = await rateLimitedFetch(fullUrl)
    if (!html) continue

    const $ = cheerio.load(html)
    const { title, markdown } = extractContent($)

    if (!markdown || markdown.length < 50) {
      console.log(`     ⏭ Too short, skipping`)
      continue
    }

    // Save markdown file
    const filename = `${slugify(pagePath)}.md`
    const filepath = path.join(sourceDir, filename)
    const fileContent = [
      '---',
      `source: ${fullUrl}`,
      `source_id: ${source.id}`,
      `category: ${source.category}`,
      `title: "${title.replace(/"/g, '\\"')}"`,
      `scraped_at: ${new Date().toISOString()}`,
      '---',
      '',
      markdown,
    ].join('\n')
    await fs.writeFile(filepath, fileContent, 'utf-8')
    console.log(`     💾 ${filename} (${markdown.length} chars)`)

    // Extract and queue new links
    const newLinks = extractLinks($, source.url, source.crawlPattern)
    let queued = 0
    for (const link of newLinks) {
      if (!visited.has(link) && !queue.includes(link)) {
        queue.push(link)
        queued++
      }
    }
    if (queued > 0) console.log(`     🔗 +${queued} links queued (${queue.length} total)`)

    processed++

    // Save state periodically (every 10 pages)
    if (processed % 10 === 0) {
      state.scraped = [...visited]
      state.lastRun = new Date().toISOString()
      await saveState(stateFile, state)
    }
  }

  // Final state save
  state.scraped = [...visited]
  state.lastRun = new Date().toISOString()
  await saveState(stateFile, state)

  console.log(`  ✅ Done — ${processed} pages scraped`)
  return { pages: processed, source: source.id }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const opts = parseArgs()

  console.log('🚀 Omnis Knowledge Scraper')
  console.log(`   Mode: ${opts.dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`   Max pages per source: ${opts.maxPages}`)

  // Load sources
  const raw = await fs.readFile(SOURCES_FILE, 'utf-8')
  const allSources: KnowledgeSource[] = JSON.parse(raw)

  // Filter sources
  let sources = allSources
  if (opts.source) {
    sources = allSources.filter((s) => s.id === opts.source)
    if (sources.length === 0) {
      console.error(`❌ Source "${opts.source}" not found. Available sources:`)
      for (const s of allSources) console.error(`   - ${s.id} (${s.name})`)
      process.exit(1)
    }
  } else if (opts.category) {
    sources = allSources.filter((s) => s.category === opts.category)
    if (sources.length === 0) {
      console.error(`❌ No sources in category "${opts.category}". Available categories:`)
      const cats = [...new Set(allSources.map((s) => s.category))]
      for (const c of cats) console.error(`   - ${c}`)
      process.exit(1)
    }
  }

  // Sort by priority (lower = higher priority)
  sources.sort((a, b) => a.priority - b.priority)

  console.log(`   Sources: ${sources.length}`)
  if (!opts.dryRun) {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }

  const results: { pages: number; source: string }[] = []
  for (const source of sources) {
    try {
      const result = await scrapeSource(source, opts)
      results.push(result)
    } catch (err: any) {
      console.error(`❌ Error scraping ${source.id}: ${err.message}`)
      results.push({ pages: 0, source: source.id })
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 Summary')
  console.log(`${'='.repeat(60)}`)
  const total = results.reduce((sum, r) => sum + r.pages, 0)
  for (const r of results) {
    console.log(`   ${r.source}: ${r.pages} pages`)
  }
  console.log(`   TOTAL: ${total} pages`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
