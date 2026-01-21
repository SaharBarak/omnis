import { BaseElement } from '../core/element.ts'

export class CardGrid extends BaseElement {
  private styles = this.css(`
    :host {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(148mm, 1fr));
      gap: var(--space-8, 2rem);
      padding: var(--space-8, 2rem);
      justify-items: center;
    }
    @media print {
      :host {
        display: block;
        padding: 0;
      }
    }
  `)

  constructor() {
    super()
    this.root.adoptedStyleSheets = [this.styles]
    this.html(`<slot></slot>`)
  }
}
