#!/usr/bin/env npx tsx
/**
 * Omnis Deep Knowledge Crawler
 *
 * Recursively crawls configured knowledge sources, following ALL internal links
 * within allowed paths. Saves content as both markdown and structured JSON.
 * Optionally upserts to Supabase as it goes.
 *
 * Usage:
 *   npx tsx scripts/scrape-knowledge.ts                    # Scrape all sources
 *   npx tsx scripts/scrape-knowledge.ts --source=jovianarchive
 *   npx tsx scripts/scrape-knowledge.ts --dry-run
 *   npx tsx scripts/scrape-knowledge.ts --max-pages=50
 *   npx tsx scripts/scrape-knowledge.ts --category=kabbalah
 *   npx tsx scripts/scrape-knowledge.ts --no-db            # Skip Supabase upsert
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
  allowPaths: string[]
  denyPaths: string[]
  maxDepth: number
  maxPages: number
  priority: number
  notes?: string
}

interface PageData {
  url: string
  title: string
  source_id: string
  category: string
  content_markdown: string
  content_text: string
  headings: string[]
  links: string[]
  scraped_at: string
  depth: number
  parent_url: string | null
}

interface CrawlQueueItem {
  path: string
  depth: number
  parentUrl: string | null
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
const DEFAULT_DELAY_MS = 800
const DEFAULT_MAX_PAGES = 500
const DEFAULT_MAX_DEPTH = 5

// Global deny patterns — always skip these regardless of source config
const GLOBAL_DENY_PATTERNS = [
  '/cart', '/checkout', '/login', '/signup', '/register', '/account',
  '/my-account', '/profile', '/settings', '/password', '/auth',
  '/privacy', '/privacy-policy', '/terms', '/terms-of-service', '/tos',
  '/cookie-policy', '/gdpr', '/legal', '/disclaimer',
  '/contact', '/contact-us', '/support', '/help', '/faq',
  '/search', '/tag/', '/tags/', '/author/',
  '/wp-admin', '/wp-login', '/admin', '/dashboard',
  '/feed', '/rss', '/sitemap', '/robots.txt',
  '/cdn-cgi/', '/.well-known/',
  '/print/', '/pdf/',
  '/share', '/email-friend',
]

const SKIP_EXTENSIONS = [
  '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico',
  '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv',
  '.zip', '.rar', '.tar', '.gz', '.7z',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.css', '.js', '.json', '.xml', '.woff', '.woff2', '.ttf', '.eot',
]

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
    maxPages: parseInt(opts['max-pages'] ?? '0', 10) || 0, // 0 = use per-source config
    noDb: opts['no-db'] === 'true',
  }
}

// ---------------------------------------------------------------------------
// Supabase (optional)
// ---------------------------------------------------------------------------

let supabase: any = null

async function getSupabase() {
  if (supabase) return supabase
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  const { createClient } = await import('@supabase/supabase-js')
  supabase = createClient(url, key)
  return supabase
}

async function upsertToSupabase(page: PageData): Promise<void> {
  const sb = await getSupabase()
  if (!sb) return

  try {
    const { error } = await sb
      .from('knowledge_base')
      .upsert(
        {
          source_url: page.url,
          title: page.title,
          content: page.content_markdown,
          metadata: {
            source_id: page.source_id,
            category: page.category,
            headings: page.headings,
            depth: page.depth,
            parent_url: page.parent_url,
            scraped_at: page.scraped_at,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'source_url' }
      )
    if (error) console.warn(`     ⚠ DB upsert failed: ${error.message}`)
  } catch (err: any) {
    console.warn(`     ⚠ DB error: ${err.message}`)
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
    if (!res.ok) { robotsCache.set(baseUrl, []); return [] }
    const text = await res.text()
    const disallowed: string[] = []
    let applicable = false
    for (const line of text.split('\n')) {
      const trimmed = line.trim().toLowerCase()
      if (trimmed.startsWith('user-agent:')) {
        const agent = trimmed.slice(11).trim()
        applicable = agent === '*' || agent.includes('omnisbot')
      } else if (applicable && trimmed.startsWith('disallow:')) {
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

function isRobotsAllowed(pagePath: string, disallowed: string[]): boolean {
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
// Path filtering
// ---------------------------------------------------------------------------

function isPathAllowed(urlPath: string, source: KnowledgeSource): boolean {
  const lower = urlPath.toLowerCase()

  // Check file extensions
  for (const ext of SKIP_EXTENSIONS) {
    if (lower.endsWith(ext)) return false
  }

  // Check global deny patterns
  for (const deny of GLOBAL_DENY_PATTERNS) {
    if (lower.startsWith(deny) || lower.includes(deny + '/') || lower === deny) return false
  }

  // Check source-specific deny paths
  for (const deny of source.denyPaths) {
    if (lower.startsWith(deny.toLowerCase())) return false
  }

  // If allowPaths is empty or contains just "/", allow everything on the domain
  if (source.allowPaths.length === 0 || (source.allowPaths.length === 1 && source.allowPaths[0] === '/')) {
    return true
  }

  // Check source-specific allow paths
  for (const allow of source.allowPaths) {
    if (lower.startsWith(allow.toLowerCase())) return true
  }

  // Also allow the root path itself
  if (urlPath === '/' || urlPath === '') return true

  return false
}

// ---------------------------------------------------------------------------
// HTTP fetching with rate limiting
// ---------------------------------------------------------------------------

const domainLastFetch = new Map<string, number>()

function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

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
      if (res.status !== 404) console.warn(`  ⚠ ${res.status} for ${url}`)
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

function extractContent($: cheerio.CheerioAPI): { title: string; markdown: string; text: string; headings: string[] } {
  // Remove non-content elements
  $('nav, footer, script, style, header, .site-header, .site-footer, .sidebar, .navigation, [role="navigation"], .cookie-banner, .popup, .modal, .ad, .advertisement, .share-buttons, .social-share, .comments, #comments, .related-posts, .breadcrumb, .breadcrumbs, .pagination, .menu, .widget, .newsletter, .subscribe-form, noscript, iframe').remove()

  const title = $('h1').first().text().trim() || $('title').text().trim() || 'Untitled'

  // Collect headings
  const headings: string[] = []
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const text = $(el).text().trim()
    if (text) headings.push(`${el.type === 'tag' ? el.tagName : 'h1'}: ${text}`)
  })

  const mainContent = $('main, article, .page-content, .entry-content, .content, .post-content, [role="main"], .article-body, .post-body, #content, .main-content').first()
  const contentEl = mainContent.length ? mainContent : $('body')

  const lines: string[] = []
  contentEl.find('h1, h2, h3, h4, h5, h6, p, li, blockquote, pre, td, th').each((_, el) => {
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

  const markdown = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  const text = contentEl.text().replace(/\s+/g, ' ').trim()

  return { title, markdown, text, headings }
}

function extractLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const links: string[] = []
  const base = new URL(baseUrl)

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return
    // Skip anchors, javascript, mailto
    if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return

    let resolved: URL
    try {
      resolved = new URL(href, baseUrl)
    } catch { return }

    // Only same-domain links
    if (resolved.hostname !== base.hostname) return

    // Normalize: remove hash, trailing slash variations
    let urlPath = resolved.pathname
    // Remove trailing slash except for root
    if (urlPath !== '/' && urlPath.endsWith('/')) urlPath = urlPath.slice(0, -1)

    links.push(urlPath)
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
// Main crawler for a single source
// ---------------------------------------------------------------------------

async function scrapeSource(source: KnowledgeSource, opts: { dryRun: boolean; maxPages: number; noDb: boolean }) {
  const mdDir = path.join(DATA_DIR, source.id, 'md')
  const jsonDir = path.join(DATA_DIR, source.id, 'json')
  const stateFile = path.join(DATA_DIR, source.id, '_state.json')
  const effectiveMaxPages = opts.maxPages || source.maxPages || DEFAULT_MAX_PAGES
  const effectiveMaxDepth = source.maxDepth || DEFAULT_MAX_DEPTH

  console.log(`\n${'='.repeat(60)}`)
  console.log(`📚 ${source.name} (${source.id})`)
  console.log(`   URL: ${source.url}`)
  console.log(`   Category: ${source.category}`)
  console.log(`   Allow: ${source.allowPaths.join(', ') || '/'}`)
  console.log(`   Deny: ${source.denyPaths.join(', ') || '(none)'}`)
  console.log(`   Max depth: ${effectiveMaxDepth}, Max pages: ${effectiveMaxPages}`)
  console.log(`${'='.repeat(60)}`)

  if (opts.dryRun) {
    console.log(`   🔍 DRY RUN — would crawl starting from:`)
    for (const sp of source.startPaths) {
      console.log(`      ${source.url}${sp}`)
    }
    return { pages: 0, source: source.id }
  }

  await fs.mkdir(mdDir, { recursive: true })
  await fs.mkdir(jsonDir, { recursive: true })

  // Load resume state
  const state = await loadState(stateFile)
  const visited = new Set<string>(state.scraped)
  const queue: CrawlQueueItem[] = []

  // Seed the queue
  for (const sp of source.startPaths) {
    if (!visited.has(sp)) queue.push({ path: sp, depth: 0, parentUrl: null })
  }

  // Check robots.txt
  const disallowed = await getDisallowedPaths(source.url)
  if (disallowed.length > 0) {
    console.log(`   🤖 robots.txt disallows ${disallowed.length} paths`)
  }

  let processed = 0

  while (queue.length > 0 && processed < effectiveMaxPages) {
    const item = queue.shift()!
    if (visited.has(item.path)) continue
    if (item.depth > effectiveMaxDepth) continue
    if (!isRobotsAllowed(item.path, disallowed)) {
      visited.add(item.path)
      continue
    }
    if (!isPathAllowed(item.path, source)) {
      visited.add(item.path)
      continue
    }

    visited.add(item.path)
    const fullUrl = `${source.url}${item.path}`
    console.log(`  📄 [${processed + 1}/${effectiveMaxPages}] d=${item.depth} ${fullUrl}`)

    const html = await rateLimitedFetch(fullUrl)
    if (!html) continue

    const $ = cheerio.load(html)
    const { title, markdown, text, headings } = extractContent($)

    if (!markdown || markdown.length < 50) {
      console.log(`     ⏭ Too short, skipping`)
      continue
    }

    // Extract internal links and queue them
    const foundLinks = extractLinks($, fullUrl)
    let queued = 0
    for (const link of foundLinks) {
      if (!visited.has(link) && !queue.some(q => q.path === link)) {
        queue.push({ path: link, depth: item.depth + 1, parentUrl: fullUrl })
        queued++
      }
    }

    // Build page data
    const pageData: PageData = {
      url: fullUrl,
      title,
      source_id: source.id,
      category: source.category,
      content_markdown: markdown,
      content_text: text,
      headings,
      links: foundLinks.map(l => `${source.url}${l}`),
      scraped_at: new Date().toISOString(),
      depth: item.depth,
      parent_url: item.parentUrl,
    }

    // Save markdown
    const slug = slugify(item.path)
    const mdContent = [
      '---',
      `source: ${fullUrl}`,
      `source_id: ${source.id}`,
      `category: ${source.category}`,
      `title: "${title.replace(/"/g, '\\"')}"`,
      `depth: ${item.depth}`,
      `parent_url: ${item.parentUrl || 'null'}`,
      `scraped_at: ${pageData.scraped_at}`,
      '---',
      '',
      markdown,
    ].join('\n')
    await fs.writeFile(path.join(mdDir, `${slug}.md`), mdContent, 'utf-8')

    // Save JSON
    await fs.writeFile(path.join(jsonDir, `${slug}.json`), JSON.stringify(pageData, null, 2), 'utf-8')

    // Upsert to Supabase
    if (!opts.noDb) {
      await upsertToSupabase(pageData)
    }

    console.log(`     💾 ${slug} (${markdown.length} chars, ${headings.length} headings, +${queued} links)`)

    processed++

    // Save state periodically
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

  console.log(`  ✅ Done — ${processed} pages scraped (${queue.length} remaining in queue)`)
  return { pages: processed, source: source.id }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const opts = parseArgs()

  console.log('🚀 Omnis Deep Knowledge Crawler')
  console.log(`   Mode: ${opts.dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`   DB upsert: ${opts.noDb ? 'DISABLED' : 'ENABLED'}`)

  const raw = await fs.readFile(SOURCES_FILE, 'utf-8')
  const allSources: KnowledgeSource[] = JSON.parse(raw)

  let sources = allSources
  if (opts.source) {
    sources = allSources.filter((s) => s.id === opts.source)
    if (sources.length === 0) {
      console.error(`❌ Source "${opts.source}" not found. Available:`)
      for (const s of allSources) console.error(`   - ${s.id}`)
      process.exit(1)
    }
  } else if (opts.category) {
    sources = allSources.filter((s) => s.category === opts.category)
    if (sources.length === 0) {
      console.error(`❌ No sources in category "${opts.category}".`)
      process.exit(1)
    }
  }

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

  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 Summary')
  console.log(`${'='.repeat(60)}`)
  const total = results.reduce((sum, r) => sum + r.pages, 0)
  for (const r of results) {
    if (r.pages > 0) console.log(`   ${r.source}: ${r.pages} pages`)
  }
  console.log(`   TOTAL: ${total} pages across ${results.filter(r => r.pages > 0).length} sources`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
