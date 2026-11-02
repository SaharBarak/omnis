import { describe, expect, it } from 'vitest'
import { circleSeats } from './circle-drawing'

describe('circleSeats', () => {
  const label = (name: string) => ({ name, sub: 'Red Lunar Skywalker' })

  it('always seats the hub and at least two others', () => {
    expect(circleSeats([label('A'.repeat(400))])).toBe(3)
  })

  it('seats fewer people when the widest label grows', () => {
    const short = circleSeats([label('Noa')])
    const long = circleSeats([label('Noa'), label('Maximiliana Konstantinopoulou')])
    expect(long).toBeLessThan(short)
  })

  it('is decided by the widest label, not by how many there are', () => {
    expect(circleSeats([label('Ari')])).toBe(circleSeats(Array.from({ length: 30 }, () => label('Ari'))))
  })
})
