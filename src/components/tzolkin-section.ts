import { BaseElement } from '../core/element.ts'
import { dateToTzolkin } from '../lib/calculations/tzolkin.ts'

const TZOLKIN_FILENAMES: Record<number, string> = {
  1: '01-imix', 2: '02-ik', 3: '03-akbal', 4: '04-kan', 5: '05-chikchan',
  6: '06-kimi', 7: '07-manik', 8: '08-lamat', 9: '09-muluk', 10: '10-ok',
  11: '11-chuwen', 12: '12-eb', 13: '13-ben', 14: '14-ix', 15: '15-men',
  16: '16-kib', 17: '17-kaban', 18: '18-etznab', 19: '19-kawak', 20: '20-ajaw',
}

export class TzolkinSection extends BaseElement {
  static observedAttributes = ['date']

  private styles = this.css(`
    :host {
      display: block;
      padding: var(--space-4, 1rem);
    }
    .content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3, 0.75rem);
    }
    .sign-row {
      display: flex;
      align-items: center;
      gap: var(--space-4, 1rem);
    }
    .sign-icon {
      width: 64px;
      height: 64px;
    }
    .sign-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-1, 0.25rem);
    }
    .tone-sign {
      font-family: var(--font-head, system-ui);
      font-size: var(--text-xl, 1.44rem);
      font-weight: 700;
      color: var(--text-primary, #1F2937);
    }
    .names {
      font-family: var(--font-body, system-ui);
      font-size: var(--text-sm, 0.833rem);
      color: var(--text-secondary, #6B7280);
    }
    .names .hebrew {
      font-weight: 600;
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
    const tzolkin = dateToTzolkin(dateStr)
    const { daySign, tone } = tzolkin

    const filename = TZOLKIN_FILENAMES[daySign.number]
    const iconSrc = `/icons/tzolkin/signs/${filename}.svg`

    this.html(`
      <section-title hebrew="לפי הצולקין" english="According to the Tzolkin"></section-title>
      <div class="content">
        <div class="sign-row">
          <img class="sign-icon" src="${iconSrc}" alt="${daySign.yucatec}" loading="lazy">
          <div class="sign-info">
            <span class="tone-sign">${tone} ${daySign.yucatec}</span>
            <span class="names">
              <span class="hebrew">${daySign.hebrew}</span> — ${daySign.english}
            </span>
          </div>
        </div>
      </div>
    `)
  }
}
