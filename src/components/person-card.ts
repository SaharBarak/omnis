import { BaseElement } from '../core/element.ts'

export class PersonCard extends BaseElement {
  static observedAttributes = ['name', 'birth-date']

  private styles = this.css(`
    :host {
      display: block;
      direction: rtl;
      width: var(--card-width, 148mm);
      height: var(--card-height, 210mm);
      background: var(--bg-card, #FFFFFF);
      border-radius: var(--radius-lg, 1rem);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      overflow: hidden;
      font-family: var(--font-body, system-ui);
    }
    .card-content {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .header {
      padding: var(--space-6, 1.5rem);
      text-align: center;
      border-block-end: 1px solid var(--border, #E5E7EB);
    }
    .name {
      font-family: var(--font-head, system-ui);
      font-size: var(--text-3xl, 2.074rem);
      font-weight: 700;
      color: var(--text-primary, #1F2937);
      margin: 0;
    }
    .dreamspell-section {
      flex: 1;
    }
    .tzolkin-section {
      flex: 0 0 auto;
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
    const name = this.getAttribute('name') || ''
    const birthDate = this.getAttribute('birth-date') || ''

    this.html(`
      <div class="card-content">
        <header class="header">
          <h1 class="name">${name}</h1>
        </header>
        <dreamspell-section class="dreamspell-section" date="${birthDate}"></dreamspell-section>
        <tzolkin-section class="tzolkin-section" date="${birthDate}"></tzolkin-section>
      </div>
    `)
  }
}
