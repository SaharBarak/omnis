#!/usr/bin/env npx tsx
/**
 * Omnis Scraper Pipeline — Entry point for Render background worker
 *
 * Runs: scrape → embed (full pipeline)
 *
 * Environment:
 *   SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY / SUPABASE_SERVICE_ROLE_KEY
 *   SCRAPER_SOURCE  — optional: single source ID
 *   SCRAPER_CATEGORY — optional: single category
 *   SCRAPER_MAX_PAGES — optional: override max pages per source
 */

import { execSync } from 'child_process'
import * as path from 'path'

const SCRIPTS_DIR = __dirname

async function main() {
  const startTime = Date.now()
  console.log('═'.repeat(60))
  console.log('🚀 Omnis Knowledge Pipeline')
  console.log(`   Started: ${new Date().toISOString()}`)
  console.log('═'.repeat(60))

  // Build scraper args from env
  const scraperArgs: string[] = []
  if (process.env.SCRAPER_SOURCE) scraperArgs.push(`--source=${process.env.SCRAPER_SOURCE}`)
  if (process.env.SCRAPER_CATEGORY) scraperArgs.push(`--category=${process.env.SCRAPER_CATEGORY}`)
  if (process.env.SCRAPER_MAX_PAGES) scraperArgs.push(`--max-pages=${process.env.SCRAPER_MAX_PAGES}`)

  // Phase 1: Scrape
  console.log('\n📥 Phase 1: Deep Crawl')
  console.log('─'.repeat(40))
  try {
    execSync(
      `npx tsx ${path.join(SCRIPTS_DIR, 'scrape-knowledge.ts')} ${scraperArgs.join(' ')}`,
      { stdio: 'inherit', cwd: path.resolve(SCRIPTS_DIR, '..') }
    )
  } catch (err: any) {
    console.error('❌ Scraping failed:', err.message)
    // Continue to embedding for whatever was scraped
  }

  // Phase 2: Embed
  console.log('\n📤 Phase 2: Embed & Upsert')
  console.log('─'.repeat(40))
  const embedArgs: string[] = []
  if (process.env.SCRAPER_SOURCE) embedArgs.push(`--source=${process.env.SCRAPER_SOURCE}`)
  if (process.env.SCRAPER_CATEGORY) embedArgs.push(`--category=${process.env.SCRAPER_CATEGORY}`)

  try {
    execSync(
      `npx tsx ${path.join(SCRIPTS_DIR, 'embed-knowledge.ts')} ${embedArgs.join(' ')}`,
      { stdio: 'inherit', cwd: path.resolve(SCRIPTS_DIR, '..') }
    )
  } catch (err: any) {
    console.error('❌ Embedding failed:', err.message)
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
  console.log('\n═'.repeat(60))
  console.log(`✅ Pipeline complete in ${elapsed} minutes`)
  console.log('═'.repeat(60))
}

main().catch((err) => {
  console.error('Fatal pipeline error:', err)
  process.exit(1)
})
