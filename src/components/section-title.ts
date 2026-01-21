import { BaseElement } from '../core/element.ts'

export class SectionTitle extends BaseElement {
  static observedAttributes = ['hebrew', 'english']

  private styles = this.css(`
    :host {
      display: block;
      text-align: center;
      margin-block-end: var(--space-4, 1rem);
    }
    h2 {
      font-family: var(--font-head, system-ui);
      font-size: var(--text-sm, 0.833rem);
      font-weight: 600;
      color: var(--text-secondary, #6B7280);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0;
    }
    .divider {
      display: block;
      font-weight: normal;
      color: var(--text-secondary, #6B7280);
      opacity: 0.5;
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
      <h2>${hebrew} <span class="divider">/</span> ${english}</h2>
    `)
  }
}
