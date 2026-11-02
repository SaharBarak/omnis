import s from './atlas.module.css'
import { LAYER_META } from '@/lib/atlas/layers'
import { ATLAS_LAYERS, type AtlasLayerId, type PersonAtlas } from '@/lib/atlas/types'

/** Every value the drawing shows, as text, grouped by layer. */
export function AtlasReadout({
  atlas,
  id,
  focus = null,
  layers = ATLAS_LAYERS,
  className,
}: {
  readonly atlas: PersonAtlas
  readonly id?: string
  readonly focus?: AtlasLayerId | null
  /** Which layers to list; all four by default. */
  readonly layers?: readonly AtlasLayerId[]
  readonly className?: string
}) {
  return (
    <div id={id} className={[s.readout, s.tokens, className].filter(Boolean).join(' ')} data-focus={focus ?? undefined}>
      {layers.map((layer) => (
        <div key={layer} className={s.readoutGroup} data-active={focus === layer ? '' : undefined}>
          <div className={s.readoutHead}>
            <span className={s.swatch} data-layer={layer} aria-hidden />
            {LAYER_META[layer].name} · {LAYER_META[layer].reads}
          </div>
          <dl style={{ margin: 0 }}>
            {atlas.readout
              .filter((r) => r.layer === layer)
              .map((r) => (
                <div key={r.label} className={s.readoutRow}>
                  <dt>{r.label}</dt>
                  <dd>{r.value}</dd>
                </div>
              ))}
          </dl>
        </div>
      ))}
    </div>
  )
}
