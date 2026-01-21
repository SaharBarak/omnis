import { BaseElement } from '../core/element.ts'
import { getSeal } from '../lib/data/seals.ts'

const SEAL_FILENAMES: Record<number, string> = {
  1: '01-dragon', 2: '02-wind', 3: '03-night', 4: '04-seed', 5: '05-serpent',
  6: '06-world-bridger', 7: '07-hand', 8: '08-star', 9: '09-moon', 10: '10-dog',
  11: '11-monkey', 12: '12-human', 13: '13-skywalker', 14: '14-wizard', 15: '15-eagle',
  16: '16-warrior', 17: '17-earth', 18: '18-mirror', 19: '19-storm', 20: '20-sun',
}

const SIZE_MAP = {
  sm: 32,
  md: 48,
  lg: 64,
} as const

export class SealIcon extends BaseElement {
  static observedAttributes = ['seal', 'size']

  private styles = this.css(`
    :host {
      display: inline-block;
    }
    img {
      display: block;
      width: var(--icon-size, 48px);
      height: var(--icon-size, 48px);
    }
  `)

  constructor() {
    super()
    this.root.adoptedStyleSheets = [this.styles]
  }

  connectedCallback(): void {
    this.render()
  }

  attributeChangedCallback(): void {
    this.render()
  }

  private render(): void {
    const sealNum = parseInt(this.getAttribute('seal') || '1', 10)
    const size = (this.getAttribute('size') || 'md') as keyof typeof SIZE_MAP
    const sizeValue = SIZE_MAP[size] || SIZE_MAP.md

    const seal = getSeal(sealNum)
    const filename = SEAL_FILENAMES[sealNum]
    const src = `/icons/dreamspell/seals/${filename}.svg`

    this.style.setProperty('--icon-size', `${sizeValue}px`)

    this.html(`
      <img src="${src}" alt="${seal.english}" loading="lazy">
    `)
  }
}
