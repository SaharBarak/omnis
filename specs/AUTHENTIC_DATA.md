# Authentic Dreamspell & Symbolic Data Specification

> **Status:** TODO
> **Created:** 2026-01-25
> **Priority:** HIGH
> **Goal:** Replace template/placeholder data with authentic source data

---

## Current Problem

The app currently uses **template-based mantras** and some placeholder data instead of authentic Dreamspell content from the original source materials.

From `IMPLEMENTATION_PLAN.md`:
> **Mantras** | TEMPLATE | Template-based, not authentic 260 (P2)

This means:
- Mantras are generated from templates, not the real 260 affirmations
- Some kin descriptions may be incomplete
- Missing authentic keywords, themes, and interpretations

---

## Data to Source from Internet

### 1. Dreamspell Kin Mantras (260 unique)

**What we need:**
- All 260 authentic mantras (affirmations) from the Dreamspell Kit
- Format: "I [action] in order to [purpose]..."
- Each kin (1-260) has a unique mantra

**Potential Sources:**
- `lawoftime.org` - Official Law of Time foundation
- `13moon.com` - Dreamspell calculators
- `mayankin.com` - Kin database
- `tzolkincalendar.com` - Calendar resources
- Academic PDFs of Dreamspell materials

**Data Structure:**
```typescript
interface AuthenticMantra {
  kin: number           // 1-260
  mantra: string        // Full mantra text
  affirmation: string   // Short version
  keywords: string[]    // Seal + Tone combined keywords
}
```

### 2. Seal Descriptions & Keywords

**What we need:**
- Authentic keywords for each of 20 seals
- Power/Action/Essence for each seal
- Extended descriptions

**Example (Red Dragon - Seal 1):**
```typescript
{
  number: 1,
  name: "Dragon",
  nameHebrew: "תנין",
  power: "Birth",
  action: "Nurtures",
  essence: "Being",
  keywords: ["nurturing", "birth", "trust", "primordial mother"],
  description: "The primal force of birth and nurturing..."
}
```

### 3. Tone Descriptions & Keywords

**What we need:**
- Authentic keywords for each of 13 tones
- Power/Action/Essence
- Pulsars and overtone pulsar info

**Example (Tone 1 - Magnetic):**
```typescript
{
  number: 1,
  name: "Magnetic",
  nameHebrew: "מגנטי",
  power: "Unify",
  action: "Attract",
  essence: "Purpose",
  question: "What is my purpose?",
  keywords: ["unity", "attraction", "purpose"]
}
```

### 4. Oracle Relationships Descriptions

**What we need:**
- Meaning of Guide position
- Meaning of Analog (support)
- Meaning of Antipode (challenge)
- Meaning of Occult (hidden power)

### 5. Wavespell Descriptions (20 wavespells)

**What we need:**
- Theme/purpose of each wavespell
- 13-day journey description
- Power animal/archetype

### 6. Castle Descriptions (5 castles)

**What we need:**
- Theme of each castle (52 days)
- Court positions
- Transformation journey

---

## Implementation Approach

### Option A: Web Scraping (One-time)

1. Create scraping scripts to extract data from sources
2. Store as static JSON files in `src/lib/data/`
3. Manually verify and clean data
4. No runtime dependency on external sites

**Pros:** Fast, offline, no API limits
**Cons:** May need updates if sources change, copyright concerns

### Option B: API Integration (If available)

Check if any sources have APIs:
- `lawoftime.org` - Check for API
- Create wrapper service for fallback

**Pros:** Always current
**Cons:** Dependency, rate limits, may not exist

### Option C: Hybrid

1. Scrape and store authentic data as static files
2. Add manual curation layer
3. Allow community contributions/corrections

---

## Data Files to Create/Update

| File | Current State | Needed |
|------|---------------|--------|
| `src/lib/data/mantras.ts` | Template-based | 260 authentic mantras |
| `src/lib/data/seals.ts` | Basic | Add power/action/essence/description |
| `src/lib/data/tones.ts` | Basic | Add power/action/essence/question |
| `src/lib/data/wavespells.ts` | NEW | 20 wavespell descriptions |
| `src/lib/data/castles.ts` | NEW | 5 castle descriptions |
| `src/lib/data/kin-descriptions.ts` | NEW | 260 kin interpretations |

---

## Scraping Targets

### Primary: lawoftime.org

**Kin Database URL Pattern:**
```
https://lawoftime.org/thirteenmoon/kin-[NUMBER].html
```

**Data available:**
- Kin name and number
- Seal and tone
- Mantra/affirmation
- Keywords
- Oracle positions

**Example scraping for Kin 1 (Red Magnetic Dragon):**

```typescript
// Expected output structure
{
  kin: 1,
  name: "Red Magnetic Dragon",
  mantra: `I unify in order to nurture
Attracting being
I seal the input of birth
With the magnetic tone of purpose
I am guided by my own power doubled`,
  seal: {
    number: 1,
    name: "Dragon",
    color: "red",
    power: "Birth",
    action: "Nurtures",
    essence: "Being"
  },
  tone: {
    number: 1,
    name: "Magnetic",
    power: "Unify",
    action: "Attract",
    essence: "Purpose",
    question: "What is my purpose?"
  }
}
```

### Secondary: 13moon.com

**URL Pattern:**
```
https://www.13moon.com/kin.htm
```

**Data available:**
- Complete kin listings
- Mantra text
- Color coding

### Tertiary: Academic/PDF Sources

- "Dreamspell: The Journey of Timeship Earth 2013" manual
- "The Mayan Factor" by José Argüelles
- 13 Moon calendar resources

---

## Complete Seal Data (with Hebrew)

All 20 seals with Power/Action/Essence:

| # | Name | Hebrew | Color | Power | Action | Essence |
|---|------|--------|-------|-------|--------|---------|
| 1 | Dragon | תנין | Red | Birth | Nurtures | Being |
| 2 | Wind | רוח | White | Spirit | Communicates | Breath |
| 3 | Night | לילה | Blue | Abundance | Dreams | Intuition |
| 4 | Seed | זרע | Yellow | Flowering | Targets | Awareness |
| 5 | Serpent | נחש | Red | Life Force | Survives | Instinct |
| 6 | Worldbridger | מגשר עולמות | White | Death | Equalizes | Opportunity |
| 7 | Hand | יד | Blue | Accomplishment | Knows | Healing |
| 8 | Star | כוכב | Yellow | Elegance | Beautifies | Art |
| 9 | Moon | ירח | Red | Universal Water | Purifies | Flow |
| 10 | Dog | כלב | White | Heart | Loves | Loyalty |
| 11 | Monkey | קוף | Blue | Magic | Plays | Illusion |
| 12 | Human | אדם | Yellow | Free Will | Influences | Wisdom |
| 13 | Skywalker | הולך שמיים | Red | Space | Explores | Wakefulness |
| 14 | Wizard | קוסם | White | Timelessness | Enchants | Receptivity |
| 15 | Eagle | נשר | Blue | Vision | Creates | Mind |
| 16 | Warrior | לוחם | Yellow | Intelligence | Questions | Fearlessness |
| 17 | Earth | אדמה | Red | Navigation | Evolves | Synchronicity |
| 18 | Mirror | מראה | White | Endlessness | Reflects | Order |
| 19 | Storm | סערה | Blue | Self-Generation | Catalyzes | Energy |
| 20 | Sun | שמש | Yellow | Universal Fire | Enlightens | Life |

---

## Complete Tone Data (with Hebrew)

All 13 tones with Power/Action/Essence and Question:

| # | Name | Hebrew | Power | Action | Essence | Question |
|---|------|--------|-------|--------|---------|----------|
| 1 | Magnetic | מגנטי | Unify | Attract | Purpose | What is my purpose? |
| 2 | Lunar | ירחי | Polarize | Stabilize | Challenge | What are my obstacles? |
| 3 | Electric | חשמלי | Activate | Bond | Service | How can I serve? |
| 4 | Self-Existing | קיים-עצמי | Define | Measure | Form | What form will my service take? |
| 5 | Overtone | על-טון | Empower | Command | Radiance | How do I take command? |
| 6 | Rhythmic | קצבי | Organize | Balance | Equality | How do I create balance? |
| 7 | Resonant | מהדהד | Channel | Inspire | Attunement | How do I attune to the greater whole? |
| 8 | Galactic | גלקטי | Harmonize | Model | Integrity | Do I live what I believe? |
| 9 | Solar | שמשי | Pulse | Realize | Intention | How do I realize my purpose? |
| 10 | Planetary | כוכבי | Perfect | Produce | Manifestation | How do I perfect what I do? |
| 11 | Spectral | ספקטרלי | Dissolve | Release | Liberation | How do I release and let go? |
| 12 | Crystal | קריסטלי | Dedicate | Universalize | Cooperation | How can I dedicate to all? |
| 13 | Cosmic | קוסמי | Endure | Transcend | Presence | How do I take my practice to the next level? |

---

## Wavespell Data (20 Wavespells)

Each wavespell is named after its first kin (Magnetic tone):

| # | Wavespell | Kins | Theme | Journey |
|---|-----------|------|-------|---------|
| 1 | Red Dragon | 1-13 | Birth & Nurturing | From purpose through transcendence |
| 2 | White Wizard | 14-26 | Timelessness | Enchanting receptivity |
| 3 | Blue Hand | 27-39 | Healing & Accomplishment | Knowing through doing |
| 4 | Yellow Sun | 40-52 | Enlightenment | Universal fire of life |
| 5 | Red Skywalker | 53-65 | Space & Exploration | Wakefulness expands |
| 6 | White Worldbridger | 66-78 | Surrender & Opportunity | Death leads to rebirth |
| 7 | Blue Storm | 79-91 | Transformation | Self-generation catalyzes |
| 8 | Yellow Human | 92-104 | Free Will | Wisdom influences choice |
| 9 | Red Serpent | 105-117 | Life Force | Instinct and survival |
| 10 | White Mirror | 118-130 | Reflection | Endless order revealed |
| 11 | Blue Monkey | 131-143 | Magic & Play | Illusion as teacher |
| 12 | Yellow Seed | 144-156 | Flowering | Awareness targets growth |
| 13 | Red Earth | 157-169 | Synchronicity | Navigation evolves |
| 14 | White Dog | 170-182 | Love & Loyalty | Heart guides |
| 15 | Blue Night | 183-195 | Abundance | Dreams of intuition |
| 16 | Yellow Warrior | 196-208 | Intelligence | Questions bring fearlessness |
| 17 | Red Moon | 209-221 | Universal Water | Purification flows |
| 18 | White Wind | 222-234 | Spirit | Communication breathes |
| 19 | Blue Eagle | 235-247 | Vision | Mind creates |
| 20 | Yellow Star | 248-260 | Elegance | Art beautifies |

---

## Castle Data (5 Castles)

| # | Castle | Color | Kins | Theme | Court |
|---|--------|-------|------|-------|-------|
| 1 | Eastern Court of Turning | Red | 1-52 | Initiation | Red Dragon → Yellow Sun |
| 2 | Northern Court of Crossing | White | 53-104 | Refinement | Red Skywalker → Yellow Human |
| 3 | Western Court of Burning | Blue | 105-156 | Transformation | Red Serpent → Yellow Seed |
| 4 | Southern Court of Giving | Yellow | 157-208 | Ripening | Red Earth → Yellow Warrior |
| 5 | Central Court of Enchantment | Green | 209-260 | Matrix | Red Moon → Yellow Star |

---

## Scraping Script Spec

### Full Implementation

```typescript
// scripts/scrape-dreamspell-data.ts

import * as cheerio from 'cheerio'
import * as fs from 'fs/promises'
import * as path from 'path'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ScrapedKinData {
  kin: number
  name: string
  mantra: string
  seal: {
    number: number
    name: string
    nameHebrew: string
    color: 'red' | 'white' | 'blue' | 'yellow'
    power: string
    action: string
    essence: string
  }
  tone: {
    number: number
    name: string
    nameHebrew: string
    power: string
    action: string
    essence: string
    question: string
  }
  keywords: string[]
  oracle: {
    guide: number
    analog: number
    antipode: number
    occult: number
  }
}

// ═══════════════════════════════════════════════════════════════
// STATIC DATA (from spec above)
// ═══════════════════════════════════════════════════════════════

const SEAL_DATA = [
  { number: 1, name: 'Dragon', nameHebrew: 'תנין', color: 'red', power: 'Birth', action: 'Nurtures', essence: 'Being' },
  { number: 2, name: 'Wind', nameHebrew: 'רוח', color: 'white', power: 'Spirit', action: 'Communicates', essence: 'Breath' },
  { number: 3, name: 'Night', nameHebrew: 'לילה', color: 'blue', power: 'Abundance', action: 'Dreams', essence: 'Intuition' },
  { number: 4, name: 'Seed', nameHebrew: 'זרע', color: 'yellow', power: 'Flowering', action: 'Targets', essence: 'Awareness' },
  { number: 5, name: 'Serpent', nameHebrew: 'נחש', color: 'red', power: 'Life Force', action: 'Survives', essence: 'Instinct' },
  { number: 6, name: 'Worldbridger', nameHebrew: 'מגשר עולמות', color: 'white', power: 'Death', action: 'Equalizes', essence: 'Opportunity' },
  { number: 7, name: 'Hand', nameHebrew: 'יד', color: 'blue', power: 'Accomplishment', action: 'Knows', essence: 'Healing' },
  { number: 8, name: 'Star', nameHebrew: 'כוכב', color: 'yellow', power: 'Elegance', action: 'Beautifies', essence: 'Art' },
  { number: 9, name: 'Moon', nameHebrew: 'ירח', color: 'red', power: 'Universal Water', action: 'Purifies', essence: 'Flow' },
  { number: 10, name: 'Dog', nameHebrew: 'כלב', color: 'white', power: 'Heart', action: 'Loves', essence: 'Loyalty' },
  { number: 11, name: 'Monkey', nameHebrew: 'קוף', color: 'blue', power: 'Magic', action: 'Plays', essence: 'Illusion' },
  { number: 12, name: 'Human', nameHebrew: 'אדם', color: 'yellow', power: 'Free Will', action: 'Influences', essence: 'Wisdom' },
  { number: 13, name: 'Skywalker', nameHebrew: 'הולך שמיים', color: 'red', power: 'Space', action: 'Explores', essence: 'Wakefulness' },
  { number: 14, name: 'Wizard', nameHebrew: 'קוסם', color: 'white', power: 'Timelessness', action: 'Enchants', essence: 'Receptivity' },
  { number: 15, name: 'Eagle', nameHebrew: 'נשר', color: 'blue', power: 'Vision', action: 'Creates', essence: 'Mind' },
  { number: 16, name: 'Warrior', nameHebrew: 'לוחם', color: 'yellow', power: 'Intelligence', action: 'Questions', essence: 'Fearlessness' },
  { number: 17, name: 'Earth', nameHebrew: 'אדמה', color: 'red', power: 'Navigation', action: 'Evolves', essence: 'Synchronicity' },
  { number: 18, name: 'Mirror', nameHebrew: 'מראה', color: 'white', power: 'Endlessness', action: 'Reflects', essence: 'Order' },
  { number: 19, name: 'Storm', nameHebrew: 'סערה', color: 'blue', power: 'Self-Generation', action: 'Catalyzes', essence: 'Energy' },
  { number: 20, name: 'Sun', nameHebrew: 'שמש', color: 'yellow', power: 'Universal Fire', action: 'Enlightens', essence: 'Life' },
] as const

const TONE_DATA = [
  { number: 1, name: 'Magnetic', nameHebrew: 'מגנטי', power: 'Unify', action: 'Attract', essence: 'Purpose', question: 'What is my purpose?' },
  { number: 2, name: 'Lunar', nameHebrew: 'ירחי', power: 'Polarize', action: 'Stabilize', essence: 'Challenge', question: 'What are my obstacles?' },
  { number: 3, name: 'Electric', nameHebrew: 'חשמלי', power: 'Activate', action: 'Bond', essence: 'Service', question: 'How can I serve?' },
  { number: 4, name: 'Self-Existing', nameHebrew: 'קיים-עצמי', power: 'Define', action: 'Measure', essence: 'Form', question: 'What form will my service take?' },
  { number: 5, name: 'Overtone', nameHebrew: 'על-טון', power: 'Empower', action: 'Command', essence: 'Radiance', question: 'How do I take command?' },
  { number: 6, name: 'Rhythmic', nameHebrew: 'קצבי', power: 'Organize', action: 'Balance', essence: 'Equality', question: 'How do I create balance?' },
  { number: 7, name: 'Resonant', nameHebrew: 'מהדהד', power: 'Channel', action: 'Inspire', essence: 'Attunement', question: 'How do I attune to the greater whole?' },
  { number: 8, name: 'Galactic', nameHebrew: 'גלקטי', power: 'Harmonize', action: 'Model', essence: 'Integrity', question: 'Do I live what I believe?' },
  { number: 9, name: 'Solar', nameHebrew: 'שמשי', power: 'Pulse', action: 'Realize', essence: 'Intention', question: 'How do I realize my purpose?' },
  { number: 10, name: 'Planetary', nameHebrew: 'כוכבי', power: 'Perfect', action: 'Produce', essence: 'Manifestation', question: 'How do I perfect what I do?' },
  { number: 11, name: 'Spectral', nameHebrew: 'ספקטרלי', power: 'Dissolve', action: 'Release', essence: 'Liberation', question: 'How do I release and let go?' },
  { number: 12, name: 'Crystal', nameHebrew: 'קריסטלי', power: 'Dedicate', action: 'Universalize', essence: 'Cooperation', question: 'How can I dedicate to all?' },
  { number: 13, name: 'Cosmic', nameHebrew: 'קוסמי', power: 'Endure', action: 'Transcend', essence: 'Presence', question: 'How do I take my practice to the next level?' },
] as const

// ═══════════════════════════════════════════════════════════════
// SCRAPING FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  })
  if (!response.ok) throw new Error(`Failed to fetch ${url}`)
  return response.text()
}

async function scrapeKinData(kinNumber: number): Promise<ScrapedKinData> {
  console.log(`Scraping kin ${kinNumber}...`)

  // Calculate seal and tone
  const sealNumber = ((kinNumber - 1) % 20) + 1
  const toneNumber = ((kinNumber - 1) % 13) + 1

  const seal = SEAL_DATA[sealNumber - 1]
  const tone = TONE_DATA[toneNumber - 1]

  // Try to scrape mantra from lawoftime.org
  let mantra = ''
  try {
    const html = await fetchPage(`https://lawoftime.org/thirteenmoon/kin-${kinNumber}.html`)
    const $ = cheerio.load(html)
    mantra = $('p.affirmation, .mantra, blockquote').first().text().trim()
  } catch (e) {
    // Generate fallback mantra from template
    mantra = generateMantra(tone, seal)
  }

  return {
    kin: kinNumber,
    name: `${seal.color.charAt(0).toUpperCase() + seal.color.slice(1)} ${tone.name} ${seal.name}`,
    mantra,
    seal: { ...seal, number: sealNumber },
    tone: { ...tone, number: toneNumber },
    keywords: [tone.essence.toLowerCase(), seal.essence.toLowerCase(), seal.power.toLowerCase()],
    oracle: calculateOracle(kinNumber, sealNumber, toneNumber)
  }
}

function generateMantra(tone: typeof TONE_DATA[number], seal: typeof SEAL_DATA[number]): string {
  return `I ${tone.action.toLowerCase()} in order to ${seal.action.toLowerCase()}
${tone.power}ing ${seal.essence.toLowerCase()}
I seal the ${getSealDomain(seal.number)} of ${seal.power.toLowerCase()}
With the ${tone.name.toLowerCase()} tone of ${tone.essence.toLowerCase()}
I am guided by ${getGuidedBy(seal)}`
}

function getSealDomain(sealNumber: number): string {
  const domains = ['input', 'store', 'process', 'output']
  return domains[(sealNumber - 1) % 4]
}

function getGuidedBy(seal: typeof SEAL_DATA[number]): string {
  // Simplified - in reality depends on tone
  return `the power of ${seal.power.toLowerCase()}`
}

function calculateOracle(kin: number, seal: number, tone: number) {
  // Oracle calculation logic (already exists in codebase)
  return {
    guide: calculateGuide(kin, seal, tone),
    analog: ((seal + 18) % 20) + 1,
    antipode: ((seal + 9) % 20) + 1,
    occult: 21 - seal
  }
}

function calculateGuide(kin: number, seal: number, tone: number): number {
  // Guide depends on tone position
  const guideOffsets = [0, 12, 4, 16, 8]
  const offset = guideOffsets[(tone - 1) % 5]
  return ((seal - 1 + offset) % 20) + 1
}

// ═══════════════════════════════════════════════════════════════
// MAIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function scrapeAllKins(): Promise<ScrapedKinData[]> {
  const results: ScrapedKinData[] = []

  for (let kin = 1; kin <= 260; kin++) {
    const data = await scrapeKinData(kin)
    results.push(data)
    // Rate limit: 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return results
}

async function saveToDataFiles(data: ScrapedKinData[]): Promise<void> {
  const outputDir = path.join(__dirname, '../src/lib/data')

  // Save mantras
  const mantras = data.map(d => ({ kin: d.kin, mantra: d.mantra }))
  await fs.writeFile(
    path.join(outputDir, 'mantras-authentic.json'),
    JSON.stringify(mantras, null, 2)
  )

  // Save full kin data
  await fs.writeFile(
    path.join(outputDir, 'kin-data-full.json'),
    JSON.stringify(data, null, 2)
  )

  console.log(`Saved ${data.length} kins to data files`)
}

// Run if executed directly
if (require.main === module) {
  scrapeAllKins()
    .then(saveToDataFiles)
    .catch(console.error)
}

export { scrapeKinData, scrapeAllKins, saveToDataFiles, ScrapedKinData }
```

### Running the Scraper

```bash
# Install dependencies
npm install cheerio

# Run scraper
npx ts-node scripts/scrape-dreamspell-data.ts
```

---

## Validation Checklist

After scraping, verify:

- [ ] All 260 kins have mantras
- [ ] All 20 seals have complete data
- [ ] All 13 tones have complete data
- [ ] Oracle calculations match our existing logic
- [ ] No duplicate or missing entries
- [ ] Hebrew translations added where missing
- [ ] Data passes TypeScript type checks

---

## Legal Considerations

- Dreamspell is educational/spiritual material
- Fair use for personal/educational app
- Credit sources appropriately
- Don't republish raw scraped content as-is
- Transform data into app-specific format

---

## Implementation Tasks

### Phase AD.1: Research & Scraping

- [ ] **AD.1.1** Survey available sources
- [ ] **AD.1.2** Create scraping script for lawoftime.org
- [ ] **AD.1.3** Extract all 260 kin data
- [ ] **AD.1.4** Extract seal/tone detailed data
- [ ] **AD.1.5** Validate scraped data

### Phase AD.2: Data Integration

- [ ] **AD.2.1** Update mantras.ts with authentic mantras
- [ ] **AD.2.2** Update seals.ts with extended data
- [ ] **AD.2.3** Update tones.ts with extended data
- [ ] **AD.2.4** Create wavespells.ts
- [ ] **AD.2.5** Create castles.ts
- [ ] **AD.2.6** Create kin-descriptions.ts

### Phase AD.3: UI Updates

- [ ] **AD.3.1** Display authentic mantras in cards
- [ ] **AD.3.2** Show extended kin descriptions
- [ ] **AD.3.3** Add wavespell context to displays
- [ ] **AD.3.4** Add castle journey information

---

## Definition of Done

- [ ] All 260 mantras are authentic (not template-generated)
- [ ] Seal data includes power/action/essence
- [ ] Tone data includes power/action/essence/question
- [ ] Wavespell descriptions available
- [ ] Castle descriptions available
- [ ] Data properly attributed to sources
- [ ] TypeScript types updated
- [ ] Unit tests pass with new data

---

## Priority

This should be done AFTER Phase DS (Design System) since:
1. Design system fixes critical UX blockers
2. Authentic data is enhancement, not blocker
3. Can be done in parallel by different agent

**Recommended order:**
1. DS.1 - Birth data input (CRITICAL)
2. DS.2 - Design system foundation
3. DS.3 - Dashboard redesign
4. AD.1 - Scrape authentic data
5. AD.2 - Integrate data
6. Polish - English-first translation
