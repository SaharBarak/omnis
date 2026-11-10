import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Hung } from './hung'
import { MEDIAN_BEARING } from '@/lib/design/face-bearings'
import { DISPLAY_BEARINGS } from '@/lib/design/face-bearings.gen'

describe('Hung', () => {
  it('sets its hang from its first glyph and names itself to the check', () => {
    const { container } = render(<Hung as="h2" id="t">Your circle</Hung>)
    const el = container.querySelector('h2')!
    expect(el.id).toBe('t')
    expect(el.hasAttribute('data-hang')).toBe(true)
    expect(el.style.getPropertyValue('--hang')).toBe(String(DISPLAY_BEARINGS.proportional.Y))
    expect(el.style.getPropertyValue('--hang-median')).toBe(String(MEDIAN_BEARING))
  })

  it('hangs mixed content by its lead, and digits by their set figures', () => {
    const { container } = render(
      <Hung as="p" figures="tabular" lead="12">
        <span>12</span>%
      </Hung>,
    )
    expect(container.querySelector('p')!.style.getPropertyValue('--hang')).toBe(String(DISPLAY_BEARINGS.tabular['1']))
  })
})
