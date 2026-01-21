import { BaseElement } from '../core/element.ts'
import { dateToKin, kinToSeal, kinToTone } from '../lib/calculations/dreamspell.ts'
import { getSeal } from '../lib/data/seals.ts'
import { getTone } from '../lib/data/tones.ts'

export class DreamspellSection extends BaseElement {
  static observedAttributes = ['date']

  private styles = this.css(`
    :host {
      display: block;
      padding: var(--space-4, 1rem);
      border-block-end: 1px solid var(--border, #E5E7EB);
    }
    .kin-name {
      text-align: center;
      font-family: var(--font-head, system-ui);
      font-size: var(--text-lg, 1.2rem);
      font-weight: 600;
      color: var(--text-primary, #1F2937);
      margin-block-end: var(--space-4, 1rem);
    }
    .kin-name .hebrew {
      display: block;
      margin-block-end: var(--space-1, 0.25rem);
    }
    .kin-name .english {
      font-size: var(--text-sm, 0.833rem);
      font-weight: normal;
      color: var(--text-secondary, #6B7280);
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
    const dateStr = this.getAttribute('date') || '1987-07-26'
    const kin = dateToKin(dateStr)
    const sealNum = kinToSeal(kin)
    const toneNum = kinToTone(kin)

    const seal = getSeal(sealNum)
    const tone = getTone(toneNum)

    const englishName = `${seal.color.charAt(0).toUpperCase() + seal.color.slice(1)} ${tone.name} ${seal.english}`
    const hebrewName = `${seal.hebrew} ${tone.hebrewName}`

    this.html(`
      <section-title hebrew="לפי הדרימספל" english="According to the Dreamspell"></section-title>
      <div class="kin-name">
        <span class="hebrew">${hebrewName}</span>
        <span class="english">${englishName} (Kin ${kin})</span>
      </div>
      <oracle-map kin="${kin}"></oracle-map>
      <mantra-display kin="${kin}"></mantra-display>
    `)
  }
}
