import { describe, it, expect } from 'vitest'

import { renderBriefingEmail } from './daily-briefing'
import type { Briefing } from '@/lib/services/briefing/types'

/**
 * The renderer is pure string assembly over discriminated sections. These tests
 * pin the two shapes every section can take — connected (real numbers) and not
 * connected (a seam line) — so the briefing email never throws on a partial run
 * and always separates humans from bots.
 */

const base = {
  generatedAt: '2026-07-16T07:00:00.000Z',
  windowLabel: 'last 24 hours',
  siteUrl: 'https://pleiad.io',
}

function fullyConnected(): Briefing {
  return {
    ...base,
    traffic: {
      connected: true,
      humans: { visits: 420, pageViews: 900, uniques: 310 },
      totalEdgeRequests: 5000,
      botOrAutomated: 4100,
      botSharePct: 82,
      topPaths: [{ label: '/', count: 300 }],
      topCountries: [{ label: 'Israel', count: 210 }],
      topReferrers: [{ label: 'google.com', count: 88 }],
    },
    users: { connected: true, total: 1200, new24h: 14, prev24h: 9, new7d: 71, peopleTotal: 340, activeUsers: 210, usersWithReadings: 96 },
    revenue: {
      connected: true,
      newPaid24h: 2,
      activePaidByPlan: [{ plan: 'complete', count: 5 }],
      activePaidTotal: 5,
      canceling: 1,
    },
    seoOnPage: {
      connected: true,
      grade: 'B',
      score: 82,
      pagesChecked: 7,
      robotsOk: true,
      sitemapOk: true,
      issues: ['/learn: meta description missing'],
    },
    gsc: {
      connected: true,
      day: '2026-07-13',
      clicks: 38,
      impressions: 1240,
      ctrPct: 3.1,
      avgPosition: 12.4,
      topQueries: [{ query: 'dreamspell calculator', clicks: 9, impressions: 210, position: 6.2 }],
    },
    backlinks: { connected: false, reason: 'Backlinks not connected — needs a paid SEO API key.' },
  }
}

function allSeams(): Briefing {
  const reason = 'not connected'
  return {
    ...base,
    traffic: { connected: false, reason },
    users: { connected: false, reason },
    revenue: { connected: false, reason },
    seoOnPage: { connected: false, reason },
    gsc: { connected: false, reason },
    backlinks: { connected: false, reason },
  }
}

describe('renderBriefingEmail', () => {
  it('renders every section when fully connected', () => {
    const out = renderBriefingEmail(fullyConnected())
    expect(out.subject).toContain('Pleiad daily · 2026-07-16')
    // Humans and bots are separated, not merged.
    expect(out.bodyHtml).toContain('Human visits')
    expect(out.bodyHtml).toContain('Bot / automated')
    expect(out.bodyHtml).toContain('82%')
    expect(out.bodyHtml).toContain('New paid (24h)')
    expect(out.bodyHtml).toContain('dreamspell calculator')
    expect(out.bodyHtml).toContain('B') // on-page grade
    // Delta vs prior day rendered (14 vs 9 → up 5).
    expect(out.bodyHtml).toContain('vs prior day')
  })

  it('never throws and shows seams when nothing is connected', () => {
    const out = renderBriefingEmail(allSeams())
    expect(out.subject).toContain('Pleiad daily')
    expect(out.preheader).toBe('Your Pleiad daily briefing')
    // Seam reason surfaces for each source.
    expect(out.bodyHtml).toContain('not connected')
  })

  it('escapes dynamic text (no raw injection from query strings)', () => {
    const b = fullyConnected()
    if (b.gsc.connected) b.gsc.topQueries[0].query = '<script>x</script>'
    const out = renderBriefingEmail(b)
    expect(out.bodyHtml).not.toContain('<script>x</script>')
    expect(out.bodyHtml).toContain('&lt;script&gt;')
  })
})
