import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { bodyTransform } from './geometry'
import { currentLanes, PersonAtlasDrawing } from './person-atlas'
import { GATE_HALVES } from '@/components/human-design/bodygraph-layout'
import { buildPersonAtlas } from '@/lib/atlas/build'
import { demoPerson } from '@/lib/atlas/demo'

const atlas = buildPersonAtlas(demoPerson('maya').input, '2026-10-11')
const body = atlas.body!

const overlay = (currents: boolean): string =>
  renderToStaticMarkup(createElement(PersonAtlasDrawing, { atlas, currents })).match(/<svg[^>]*channelCurrents[\s\S]*?<\/svg>/)?.[0] ?? ''

describe('channel currents (BENTO_SITE.md "Currents")', () => {
  it('runs one lane from each gate of every defined channel, along the half the drawing shows', () => {
    const lanes = currentLanes(body)
    expect(body.channels.length).toBeGreaterThan(0)
    expect(lanes).toHaveLength(body.channels.length * 2)
    for (const channel of body.channels) {
      for (const gate of channel.gates) {
        const half = GATE_HALVES[gate]?.find((h) => h.channel === channel.id)
        expect(lanes.find((lane) => lane.key === `${channel.id}:${gate}`)?.points, `${channel.id}:${gate}`).toEqual(half?.shown)
      }
    }
  })

  it('runs no lane where no channel is defined', () => {
    expect(currentLanes({ ...body, channels: [] })).toEqual([])
  })

  it('draws its lanes on the drawing body, under its zoom, hidden from assistive tech, and only once allowed to', () => {
    const svg = overlay(true)
    expect(svg).toContain('aria-hidden="true"')
    expect(svg).toContain('data-loop=""')
    expect(svg).toContain(`transform="${bodyTransform}"`)
    expect(svg.match(/<path /g)).toHaveLength(currentLanes(body).length)
    expect(overlay(false)).toBe('')
  })
})
