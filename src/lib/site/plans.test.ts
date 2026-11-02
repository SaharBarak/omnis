import { describe, expect, it } from 'vitest'
import { CHART_SYSTEMS, planAction, planCards, planLedger } from './plans'
import { PLANS } from '@/lib/services/billing'
import { SYSTEM_CATALOG } from '@/lib/system-preferences'

describe('plans', () => {
  it('derives every card from billing limits', () => {
    const cards = planCards()
    expect(cards.map((c) => c.id)).toEqual(Object.keys(PLANS))
    const explorer = cards.find((c) => c.id === 'explorer')!
    expect(explorer.facts).toContain(`Up to ${PLANS.explorer.limits.profiles} people`)
    const gated = new Set(Object.values(PLANS).flatMap((p) => p.limits.systems))
    expect(CHART_SYSTEMS).toHaveLength(gated.size)
    const n = PLANS.explorer.limits.systems.length
    expect(explorer.facts).toContain(n === gated.size ? `All ${n} chart systems` : `${n} of ${gated.size} chart systems`)
    const catalog = new Set(SYSTEM_CATALOG.map((s) => s.key))
    expect(CHART_SYSTEMS.every((k) => catalog.has(k as never))).toBe(true)
  })

  it('never writes a system count by hand', () => {
    const text = JSON.stringify([planCards().map((c) => c.facts), planLedger()])
    expect(text).not.toMatch(/\bsix\b/i)
    expect(JSON.stringify(planCards().map((c) => c.tagline))).not.toMatch(/\bsix\b/i)
  })

  it('sends paid plans to the store once a listing is live', () => {
    const store = 'https://apps.apple.com/app/pleiad/id0'
    expect(planAction('explorer', store)).toEqual({ href: store, external: true })
    expect(planAction('explorer', null).external).toBe(false)
    expect(planAction('free', store).external).toBe(false)
  })

  it('reads plan systems as unique catalog keys', () => {
    const catalog = new Set<string>(SYSTEM_CATALOG.map((s) => s.key))
    for (const plan of Object.values(PLANS)) {
      const keys: readonly string[] = plan.limits.systems
      expect(new Set(keys).size, plan.name).toBe(keys.length)
      expect(keys.filter((k) => !catalog.has(k)), plan.name).toEqual([])
    }
  })
})
