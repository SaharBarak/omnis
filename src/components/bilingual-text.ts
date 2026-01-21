import { BaseElement } from '../core/element.ts'

export class BilingualText extends BaseElement {
  static observedAttributes = ['hebrew', 'english']

  private styles = this.css(`
    :host {
      display: block;
      text-align: center;
    }
    .hebrew {
      font-family: var(--font-body, system-ui);
      font-size: var(--text-base, 1rem);
      color: var(--text-primary, #1F2937);
      margin-block-end: var(--space-1, 0.25rem);
    }
    .english {
      font-family: var(--font-body, system-ui);
      font-size: var(--text-sm, 0.833rem);
      font-style: italic;
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
    const hebrew = this.getAttribute('hebrew') || ''
    const english = this.getAttribute('english') || ''

    this.html(`
      <div class="hebrew">${hebrew}</div>
      <div class="english">${english}</div>
    `)
  }
}
