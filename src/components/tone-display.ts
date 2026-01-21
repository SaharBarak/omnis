import { BaseElement } from '../core/element.ts'
import { getTone } from '../lib/data/tones.ts'

export class ToneDisplay extends BaseElement {
  static observedAttributes = ['tone']

  private styles = this.css(`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-head, system-ui);
      font-weight: 700;
      font-size: var(--text-lg, 1.2rem);
      color: var(--text-primary, #1F2937);
    }
    .tone-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2em;
      height: 2em;
      border-radius: 50%;
      background: var(--bg-card, #fff);
      border: 2px solid var(--border, #E5E7EB);
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
    const toneNum = parseInt(this.getAttribute('tone') || '1', 10)
    const tone = getTone(toneNum)

    this.html(`
      <span class="tone-number" title="${tone.name} / ${tone.hebrewName}">${toneNum}</span>
    `)
  }
}
