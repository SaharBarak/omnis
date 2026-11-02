import { bodyPoint, polar, RING, skyAngle, type Point } from './geometry'
import { CENTER_POSITIONS } from '@/components/human-design/bodygraph-layout'
import { LAYER_META } from '@/lib/atlas/layers'
import type { AtlasLayerId, PersonAtlas } from '@/lib/atlas/types'

export interface AtlasPin {
  readonly n: number
  readonly layer: AtlasLayerId
  readonly point: Point
  readonly title: string
  readonly value: string
}

const row = (atlas: PersonAtlas, label: string): string => atlas.readout.find((r) => r.label === label)?.value ?? ''

/** One pin per drawn ring, anchored where that ring's headline value sits; an empty bodygraph gets none. */
export function atlasPins(atlas: PersonAtlas): readonly AtlasPin[] {
  const sun = atlas.sky.bodies.find((b) => b.id === 'sun')
  const anchorCenter = atlas.body?.definedCenters.includes('g') ? 'g' : (atlas.body?.definedCenters[0] ?? 'g')
  const center = CENTER_POSITIONS[anchorCenter]
  return [
    {
      n: LAYER_META.sky.pin,
      layer: 'sky',
      point: polar(RING.planetTrack, skyAngle(sun?.longitude ?? 0, atlas.sky.ascendant)),
      title: 'Sun',
      value: row(atlas, 'Sun'),
    },
    { n: LAYER_META.maya.pin, layer: 'maya', point: polar(RING.sealTrack, 90), title: `Kin ${atlas.maya.kin}`, value: atlas.maya.title },
    ...(atlas.body
      ? [{ n: LAYER_META.body.pin, layer: 'body' as const, point: bodyPoint(center.x, center.y), title: atlas.body.type, value: atlas.body.profile }]
      : []),
  ]
}
