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

## Scraping Script Spec

```typescript
// scripts/scrape-dreamspell-data.ts

interface ScrapedKinData {
  kin: number
  seal: {
    number: number
    name: string
    power: string
    action: string
    essence: string
  }
  tone: {
    number: number
    name: string
    power: string
    action: string
    essence: string
  }
  mantra: string
  keywords: string[]
  oracle: {
    guide: number
    analog: number
    antipode: number
    occult: number
  }
}

async function scrapeKinData(kinNumber: number): Promise<ScrapedKinData>
async function scrapeAllKins(): Promise<ScrapedKinData[]>
async function saveToDataFiles(data: ScrapedKinData[]): Promise<void>
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
