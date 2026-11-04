'use client'

import { useId, useState } from 'react'
import m from './map.module.css'
import kit from '../kit.module.css'
import { AtlasStage, type StageStatus } from '../atlas/atlas-stage'
import { AtlasDigest } from '../atlas/digest'
import { AtlasReadout } from '../atlas/readout'
import type { AtlasLayerId, PersonAtlas } from '@/lib/atlas/types'

const READY: StageStatus = { status: 'ready', error: null }

/**
 * One person's map as a full-width figure (BENTO_SITE.md "Figures"): the
 * atlas sized to the viewport under the bar, its digest as a row under it. A tile or the layer switch brings one layer forward; the full
 * readout is there for assistive tech, as on the home hero.
 */
export function MapFigure({ atlas }: { readonly atlas: PersonAtlas }) {
  const [focus, setFocus] = useState<AtlasLayerId | null>(null)
  const readoutId = useId()
  return (
    <div className={m.figure}>
      <AtlasStage atlas={atlas} status={READY} focus={focus} onFocus={setFocus} readoutId={readoutId} className={m.stage} fit />
      <AtlasDigest atlas={atlas} focus={focus} onFocus={setFocus} cardAt="above" className={m.digest} />
      <AtlasReadout atlas={atlas} id={readoutId} focus={focus} className={kit.srOnly} />
    </div>
  )
}
