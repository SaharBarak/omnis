import { BaseElement } from '../core/element.ts'
import { asKin } from '../core/types.ts'
import { kinToSeal, kinToTone } from '../lib/calculations/dreamspell.ts'
import { getSeal } from '../lib/data/seals.ts'
import { getTone } from '../lib/data/tones.ts'
import { generateMantra } from '../lib/data/mantras.ts'

export class MantraDisplay extends BaseElement {
  static observedAttributes = ['kin']

  private styles = this.css(`
    :host {
      display: block;
      text-align: center;
      padding: var(--space-4, 1rem);
    }
    .hebrew {
      font-family: var(--font-body, system-ui);
      font-size: var(--text-base, 1rem);
      color: var(--text-primary, #1F2937);
      margin-block-end: var(--space-2, 0.5rem);
      line-height: 1.6;
    }
    .english {
      font-family: var(--font-body, system-ui);
      font-size: var(--text-sm, 0.833rem);
      font-style: italic;
      color: var(--text-secondary, #6B7280);
      line-height: 1.5;
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
    const kinNum = parseInt(this.getAttribute('kin') || '1', 10)
    const kin = asKin(kinNum)
    const sealNum = kinToSeal(kin)
    const toneNum = kinToTone(kin)

    const seal = getSeal(sealNum)
    const tone = getTone(toneNum)
    const mantra = generateMantra(seal, tone)

    this.html(`
      <div class="hebrew">${mantra.hebrew}</div>
      <div class="english">${mantra.english}</div>
    `)
  }
}
