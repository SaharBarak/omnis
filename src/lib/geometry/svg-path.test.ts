import { describe, expect, it } from 'vitest'
import { flattenPath, insidePath, winding } from './svg-path'

const area = (polygon: readonly (readonly [number, number])[]): number =>
  Math.abs(polygon.reduce((sum, [x, y], i) => {
    const [nx, ny] = polygon[(i + 1) % polygon.length] ?? [0, 0]
    return sum + x * ny - nx * y
  }, 0)) / 2

describe('flattenPath', () => {
  it('reads a square as one closed polygon', () => {
    const [square] = flattenPath('M0 0L10 0L10 10L0 10Z')
    expect(square).toHaveLength(4)
    expect(area(square ?? [])).toBe(100)
  })

  it('flattens a full circle of two arcs close to πr²', () => {
    const [disc] = flattenPath('M-5 0A5 5 0 1 1 5 0A5 5 0 1 1 -5 0Z')
    expect(area(disc ?? [])).toBeGreaterThan(Math.PI * 25 * 0.99)
    expect(area(disc ?? [])).toBeLessThan(Math.PI * 25)
  })

  it('keeps every subpath', () => {
    expect(flattenPath('M0 0L1 0L1 1Z M5 5L6 5L6 6Z')).toHaveLength(2)
  })

  it('rejects a command it cannot draw', () => {
    expect(() => flattenPath('M0 0C1 1 2 2 3 3Z')).toThrow()
    expect(() => flattenPath('M0 0l1 0 0 1z')).toThrow()
    expect(() => flattenPath('m0 0L1 0 1 1z')).toThrow()
  })
})

describe('nonzero fill', () => {
  const ring = flattenPath('M-5 0A5 5 0 1 1 5 0A5 5 0 1 1 -5 0Z M-2 0A2 2 0 1 0 2 0A2 2 0 1 0 -2 0Z')

  it('fills the band of a ring wound outward then inward', () => {
    expect(insidePath(ring, [3.5, 0.1])).toBe(true)
  })

  it('leaves the hole open', () => {
    expect(winding(ring, [0, 0.1])).toBe(0)
  })

  it('leaves the outside empty', () => {
    expect(insidePath(ring, [6, 0])).toBe(false)
  })
})
