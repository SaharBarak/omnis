export abstract class BaseElement extends HTMLElement {
  protected root: ShadowRoot

  constructor() {
    super()
    this.root = this.attachShadow({ mode: 'open' })
  }

  protected css(styles: string): CSSStyleSheet {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(styles)
    return sheet
  }

  protected html(template: string): void {
    this.root.innerHTML = template
  }

  protected $<T extends Element>(selector: string): T | null {
    return this.root.querySelector<T>(selector)
  }

  protected $$<T extends Element>(selector: string): NodeListOf<T> {
    return this.root.querySelectorAll<T>(selector)
  }

  protected emit<T>(name: string, detail?: T): void {
    this.dispatchEvent(new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true
    }))
  }

  connectedCallback(): void {}
  disconnectedCallback(): void {}
}
