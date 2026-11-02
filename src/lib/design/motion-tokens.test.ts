import { describe, expect, it } from 'vitest'
import { MAGNET, PRESS_SCALE, STAGGER, motionCssVars, shortestTurn, staggerStep } from './motion-tokens'

describe('staggerStep', () => {
  it('uses the step for small sets and compresses long ones under the cap', () => {
    expect(staggerStep(1)).toBe(0)
    expect(staggerStep(5)).toBe(STAGGER.step)
    expect(staggerStep(260) * 259).toBeLessThanOrEqual(STAGGER.cap)
  })
})

describe('shortestTurn', () => {
  it('turns the short way round', () => {
    expect(shortestTurn(10, 350)).toBe(-20)
    expect(shortestTurn(350, 10)).toBe(20)
    expect(shortestTurn(0, 180)).toBe(180)
    expect(shortestTurn(90, 90)).toBe(0)
  })
})

describe('press and pull', () => {
  it('presses within the tactile range and emits the scale for CSS', () => {
    expect(PRESS_SCALE).toBeGreaterThanOrEqual(0.95)
    expect(PRESS_SCALE).toBeLessThan(1)
    expect(motionCssVars()['--press-scale']).toBe(String(PRESS_SCALE))
  })

  it('leans a magnetic control less than the pointer moves', () => {
    expect(MAGNET.pull).toBeGreaterThan(0)
    expect(MAGNET.pull).toBeLessThan(1)
    expect(MAGNET.reach).toBeGreaterThan(0)
  })
})
