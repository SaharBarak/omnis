import { BaseElement } from '../core/element.ts'
import { asKin } from '../core/types.ts'
import { kinToSeal } from '../lib/calculations/dreamspell.ts'
import { calculateOracle } from '../lib/calculations/oracle.ts'

export class OracleMap extends BaseElement {
  static observedAttributes = ['kin']

  private styles = this.css(`
    :host {
      display: block;
    }
    .oracle-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      grid-template-rows: 1fr 1fr 1fr;
      gap: var(--space-2, 0.5rem);
      justify-items: center;
      align-items: center;
      width: 180px;
      height: 180px;
      margin: 0 auto;
    }
    .position {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-1, 0.25rem);
    }
    .label {
      font-size: var(--text-xs, 0.694rem);
      color: var(--text-secondary, #6B7280);
      text-transform: uppercase;
    }
    .guide { grid-column: 2; grid-row: 1; }
    .antipode { grid-column: 1; grid-row: 2; }
    .kin { grid-column: 2; grid-row: 2; }
    .analog { grid-column: 3; grid-row: 2; }
    .occult { grid-column: 2; grid-row: 3; }
    .kin seal-icon {
      --icon-size: 64px;
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
    const seal = kinToSeal(kin)
    const oracle = calculateOracle(kin)

    this.html(`
      <div class="oracle-grid" role="img" aria-label="Oracle map">
        <div class="position guide">
          <seal-icon seal="${oracle.guide}" size="sm"></seal-icon>
          <span class="label">Guide</span>
        </div>
        <div class="position antipode">
          <seal-icon seal="${oracle.antipode}" size="sm"></seal-icon>
          <span class="label">Antipode</span>
        </div>
        <div class="position kin">
          <seal-icon seal="${seal}" size="lg"></seal-icon>
        </div>
        <div class="position analog">
          <seal-icon seal="${oracle.analog}" size="sm"></seal-icon>
          <span class="label">Analog</span>
        </div>
        <div class="position occult">
          <seal-icon seal="${oracle.occult}" size="sm"></seal-icon>
          <span class="label">Occult</span>
        </div>
      </div>
    `)
  }
}
