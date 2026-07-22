import { fetchWithTimeout } from './http'
import type { Section, OnPageSeoData } from './types'

/**
 * On-page / technical SEO grade — computed by crawling our own public pages.
 * No external key: we fetch a handful of key URLs and score the fundamentals
 * every crawler and ranking model reads (title, meta description, single H1,
 * canonical, Open Graph, JSON-LD structured data) plus robots.txt + sitemap.xml.
 *
 * This is deliberately regex-based, not a DOM parse — mail runs on the Worker
 * runtime and these checks only need presence/length, not a full tree.
 */

const PAGES = ['/', '/pricing', '/learn', '/compatibility', '/about', '/calculate', '/today']

interface PageScore {
  path: string
  points: number
  max: number
  issues: string[]
}

function firstMatch(html: string, re: RegExp): string | null {
  const m = html.match(re)
  return m ? m[1].trim() : null
}

function scorePage(path: string, html: string): PageScore {
  const issues: string[] = []
  let points = 0
  const max = 6

  const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i)
  if (title && title.length >= 15 && title.length <= 65) points++
  else issues.push(`${path}: title ${title ? `length ${title.length} (want 15–65)` : 'missing'}`)

  const desc = firstMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
  if (desc && desc.length >= 60 && desc.length <= 165) points++
  else issues.push(`${path}: meta description ${desc ? `length ${desc.length} (want 60–165)` : 'missing'}`)

  const h1Count = (html.match(/<h1[\s>]/gi) || []).length
  if (h1Count === 1) points++
  else issues.push(`${path}: ${h1Count} <h1> (want exactly 1)`)

  if (/<link[^>]+rel=["']canonical["']/i.test(html)) points++
  else issues.push(`${path}: no canonical link`)

  if (/<meta[^>]+property=["']og:(title|image|description)["']/i.test(html)) points++
  else issues.push(`${path}: no Open Graph tags`)

  if (/<script[^>]+type=["']application\/ld\+json["']/i.test(html)) points++
  else issues.push(`${path}: no JSON-LD structured data`)

  return { path, points, max, issues }
}

function letterGrade(pct: number): string {
  if (pct >= 97) return 'A+'
  if (pct >= 90) return 'A'
  if (pct >= 80) return 'B'
  if (pct >= 70) return 'C'
  if (pct >= 55) return 'D'
  return 'F'
}

export async function collectOnPageSeo(siteUrl: string): Promise<Section<OnPageSeoData>> {
  const base = siteUrl.replace(/\/$/, '')
  try {
    const results = await Promise.all(
      PAGES.map(async (path): Promise<PageScore | null> => {
        try {
          const res = await fetchWithTimeout(`${base}${path}`, { headers: { 'user-agent': 'PleiadBriefingBot/1.0' } })
          if (!res.ok) return { path, points: 0, max: 6, issues: [`${path}: HTTP ${res.status}`] }
          return scorePage(path, await res.text())
        } catch {
          return { path, points: 0, max: 6, issues: [`${path}: fetch failed`] }
        }
      }),
    )

    const checked = results.filter((r): r is PageScore => r !== null)
    if (checked.length === 0) return { connected: false, reason: 'On-page SEO: no pages could be fetched.' }

    // robots.txt + sitemap.xml.
    const [robotsOk, sitemapOk] = await Promise.all([
      fetchWithTimeout(`${base}/robots.txt`).then((r) => r.ok).catch(() => false),
      fetchWithTimeout(`${base}/sitemap.xml`).then((r) => r.ok).catch(() => false),
    ])

    const issues = checked.flatMap((r) => r.issues)
    if (!robotsOk) issues.push('robots.txt missing or unreachable')
    if (!sitemapOk) issues.push('sitemap.xml missing or unreachable')

    const pagePoints = checked.reduce((s, r) => s + r.points, 0)
    const pageMax = checked.reduce((s, r) => s + r.max, 0)
    const infraPoints = (robotsOk ? 1 : 0) + (sitemapOk ? 1 : 0)
    const totalPoints = pagePoints + infraPoints
    const totalMax = pageMax + 2
    const score = totalMax > 0 ? Math.round((totalPoints / totalMax) * 100) : 0

    return {
      connected: true,
      grade: letterGrade(score),
      score,
      pagesChecked: checked.length,
      robotsOk,
      sitemapOk,
      issues: issues.slice(0, 12),
    }
  } catch (err) {
    return { connected: false, reason: `On-page SEO crawl failed: ${(err as Error).message}` }
  }
}
