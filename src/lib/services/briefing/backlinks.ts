import type { Section, BacklinksData } from './types'

/**
 * Off-page authority — backlinks, referring domains, domain rating.
 *
 * No free API exposes this (Google Search Console does not report external
 * backlink counts). It requires a paid provider key. This collector is a seam:
 * the moment SEO_BACKLINKS_API_KEY is set we implement the chosen provider
 * (Ahrefs / Moz / SEMrush) here; until then the briefing shows a clear
 * "not connected" line rather than a fabricated number.
 */
export async function collectBacklinks(): Promise<Section<BacklinksData>> {
  const key = process.env.SEO_BACKLINKS_API_KEY
  if (!key) {
    return {
      connected: false,
      reason: 'Backlinks not connected — needs a paid SEO API key (Ahrefs / Moz / SEMrush).',
    }
  }
  // Provider integration lands here once the key + provider are chosen.
  return {
    connected: false,
    reason: 'Backlinks provider key present but collector not yet implemented — tell me which provider.',
  }
}
