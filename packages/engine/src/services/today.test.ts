import { describe, expect, it } from 'vitest'

import { getTodayAcrossSystems, moonPhase, sunNow } from './today'

describe('moonPhase', () => {
  it('epoch reference is a new moon', () => {
    expect(moonPhase(new Date(Date.UTC(2000, 0, 6, 18, 14)))).toBe('New Moon')
  })

  it('half a synodic month later is full', () => {
    const full = new Date(Date.UTC(2000, 0, 6, 18, 14) + 14.765 * 86_400_000)
    expect(moonPhase(full)).toBe('Full Moon')
  })
})

describe('sunNow', () => {
  it('returns a valid gate.line and sane sign for fixed dates', () => {
    const summer = sunNow('2026-06-21')
    expect(summer.gate).toBeGreaterThanOrEqual(1)
    expect(summer.gate).toBeLessThanOrEqual(64)
    expect(summer.line).toBeGreaterThanOrEqual(1)
    expect(summer.line).toBeLessThanOrEqual(6)
    expect(['Gemini', 'Cancer']).toContain(summer.sign)

    const winter = sunNow('2026-01-05')
    expect(winter.sign).toBe('Capricorn')
    expect(winter.gate).not.toBe(summer.gate)
  })

  it('is deterministic', () => {
    expect(sunNow('2026-07-10')).toEqual(sunNow('2026-07-10'))
  })
})

describe('getTodayAcrossSystems', () => {
  it('assembles the full calendar-atlas board', () => {
    const board = getTodayAcrossSystems(new Date(Date.UTC(2026, 6, 10, 12)))
    expect(board.kin).toMatch(/^Kin \d+ · .+/)
    expect(board.moon).toMatch(/Moon|Crescent|Quarter|Gibbous/)
    expect(board.sun).toMatch(/^Sun \d+° (Cancer|Gemini)$/)
    expect(board.gate).toMatch(/^Gate \d+\.\d$/)
    // Node has full Intl — calendar dates resolve here (may be null on Hermes).
    expect(board.hebrewDate).toMatch(/5786/)
    expect(board.sidereal).toMatch(/^Sun \d+° (Gemini|Cancer)$/)
    expect(board.hijri).toMatch(/1447|1448/)
    expect(board.persian).toMatch(/1405/)
    expect(board.chineseYear).toBe('Fire Horse')
    expect(board.panchang).toMatch(/^(Shukla|Krishna) .+/)
    expect(board.longCount).toMatch(/^\d+\.\d+\.\d+\.\d+\.\d+$/)
  })
})
