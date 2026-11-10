import { describe, expect, it } from 'vitest'
import { SKETCH_STEPS, sketchSteps, stepNumeral, type SketchProgress } from './v2-sketch'

const states = (progress: SketchProgress) => sketchSteps(progress).map((step) => step.state)

describe('sketchSteps', () => {
  it('starts on the date', () => {
    expect(states({ hasDate: false, hasHour: false, drawn: false })).toEqual(['current', 'todo', 'todo'])
  })

  it('never counts a drawn map as read without a date (the sample is drawn too)', () => {
    expect(states({ hasDate: false, hasHour: false, drawn: true })).toEqual(['current', 'todo', 'todo'])
  })

  it('moves to the hour once the date parses, while the map draws', () => {
    expect(states({ hasDate: true, hasHour: false, drawn: false })).toEqual(['done', 'current', 'todo'])
  })

  it('keeps the optional hour current without holding back the read', () => {
    expect(states({ hasDate: true, hasHour: false, drawn: true })).toEqual(['done', 'current', 'done'])
  })

  it('reads the map last when the hour is given', () => {
    expect(states({ hasDate: true, hasHour: true, drawn: false })).toEqual(['done', 'done', 'current'])
  })

  it('is all done when everything is given and drawn', () => {
    expect(states({ hasDate: true, hasHour: true, drawn: true })).toEqual(['done', 'done', 'done'])
  })

  it('has exactly one current step until every step is done', () => {
    const flags = [false, true]
    for (const hasDate of flags)
      for (const hasHour of flags)
        for (const drawn of flags) {
          const s = states({ hasDate, hasHour, drawn })
          const current = s.filter((state) => state === 'current').length
          expect(current).toBe(s.every((state) => state === 'done') ? 0 : 1)
        }
  })

  it('numbers the steps in table order', () => {
    expect(sketchSteps({ hasDate: false, hasHour: false, drawn: false }).map((s) => s.number)).toEqual(SKETCH_STEPS.map((_, i) => i + 1))
    expect(stepNumeral(1)).toBe('01')
  })
})
