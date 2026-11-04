import { describe, expect, it } from 'vitest'
import { DIGEST, LAYER_META, LAYERS_BY_PIN, systemLabel } from './layers'
import { ATLAS_LAYERS } from './types'

describe('the lead order', () => {
  it('leads with every layer of the map exactly once', () => {
    expect([...LAYERS_BY_PIN].sort()).toEqual([...ATLAS_LAYERS].sort())
  })

  it('numbers the layers 1 to n in the order the digest reads them', () => {
    expect(LAYERS_BY_PIN.map((layer) => LAYER_META[layer].pin)).toEqual(LAYERS_BY_PIN.map((_, i) => i + 1))
  })

  it('names each layer by its first system in the catalog', () => {
    for (const layer of ATLAS_LAYERS) expect(LAYER_META[layer].name).toBe(systemLabel(LAYER_META[layer].systems[0]))
  })

  it('never reads a system twice', () => {
    const systems = DIGEST.flatMap((entry) => (entry.kind === 'layer' ? LAYER_META[entry.layer].systems : [entry.system]))
    expect(new Set(systems).size).toBe(systems.length)
  })

  it('never calls the Dreamspell layer Maya', () => {
    expect(LAYER_META.maya.name).not.toMatch(/maya/i)
  })
})
