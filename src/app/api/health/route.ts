import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { getDb } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

/**
 * Liveness + DB readiness probe (pre-deploy playbook gate 8). Unauthenticated
 * and PII-free on purpose: it returns only up/down + latency so an uptime
 * monitor can hit it. A failing DB ping flips `ok` to false and the status to
 * 503 so the monitor pages instead of silently seeing 200.
 */
export async function GET() {
  const startedAt = Date.now()
  try {
    await getDb().execute(sql`select 1`)
    return NextResponse.json({
      ok: true,
      db: 'up',
      latencyMs: Date.now() - startedAt,
    })
  } catch (error) {
    console.error('health: db ping failed', error)
    return NextResponse.json(
      { ok: false, db: 'down', latencyMs: Date.now() - startedAt },
      { status: 503 },
    )
  }
}
