import Image from 'next/image'
import s from './tools.module.css'
import kit from '../kit.module.css'
import { buildLightAtlas } from '@/lib/atlas/light'
import type { AtlasPerson } from '@/lib/atlas/pair'

/**
 * What a map knows before the heavy engines arrive: each person's kin, the
 * traditional Tzolkin day and the life path, from the data tables alone.
 */
export function LightPreview({ people, today }: { readonly people: readonly AtlasPerson[]; readonly today: string }) {
  return (
    <ul className={s.preview} aria-label="Drawn so far: the 260-day count and the numbers">
      {people.map((person) => {
        const { maya, number } = buildLightAtlas(person.input, today)
        return (
          <li key={person.id} className={s.previewRow}>
            <Image src={maya.seal.src} alt="" width={40} height={40} className={kit.glyph} />
            <span className={s.previewText}>
              <strong>{person.name}</strong>
              <span>
                Kin {maya.kin} · {maya.title}
              </span>
              <span>
                Tzolkin {maya.tzolkin} · Life path {number.lifePath}
              </span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
