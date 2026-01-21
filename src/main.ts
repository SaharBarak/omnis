import {
  SealIcon,
  ToneDisplay,
  BilingualText,
  SectionTitle,
  OracleMap,
  MantraDisplay,
  DreamspellSection,
  TzolkinSection,
  PersonCard,
  CardGrid,
} from './components/index.ts'
import { TEST_PEOPLE } from './lib/data/people.ts'

// Register all Web Components
customElements.define('seal-icon', SealIcon)
customElements.define('tone-display', ToneDisplay)
customElements.define('bilingual-text', BilingualText)
customElements.define('section-title', SectionTitle)
customElements.define('oracle-map', OracleMap)
customElements.define('mantra-display', MantraDisplay)
customElements.define('dreamspell-section', DreamspellSection)
customElements.define('tzolkin-section', TzolkinSection)
customElements.define('person-card', PersonCard)
customElements.define('card-grid', CardGrid)

// Render cards for all test people
function renderCards(): void {
  const grid = document.querySelector('card-grid')
  if (!grid) {
    console.error('card-grid element not found')
    return
  }

  const fragment = document.createDocumentFragment()

  for (const person of TEST_PEOPLE) {
    const card = document.createElement('person-card')
    card.setAttribute('name', person.name)
    card.setAttribute('birth-date', person.birthDate)
    fragment.appendChild(card)
  }

  grid.appendChild(fragment)
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderCards)
} else {
  renderCards()
}
