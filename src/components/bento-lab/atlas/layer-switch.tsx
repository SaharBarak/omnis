'use client'

import s from './atlas.module.css'
import { LAYER_META } from '@/lib/atlas/layers'
import { ATLAS_LAYERS, type AtlasLayerId } from '@/lib/atlas/types'

/** Picks the layer in focus. "All" shows every layer at full strength. */
export function LayerSwitch({ value, onChange, label = 'Atlas layer' }: { readonly value: AtlasLayerId | null; readonly onChange: (next: AtlasLayerId | null) => void; readonly label?: string }) {
  return (
    <div className={`${s.switch} ${s.tokens}`} role="group" aria-label={label}>
      <button type="button" aria-pressed={value === null} onClick={() => onChange(null)}>
        All
      </button>
      {ATLAS_LAYERS.map((layer) => (
        <button key={layer} type="button" aria-pressed={value === layer} onClick={() => onChange(layer)}>
          <span className={s.swatch} data-layer={layer} aria-hidden />
          {LAYER_META[layer].name}
        </button>
      ))}
    </div>
  )
}
