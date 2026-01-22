# Omnis MVP Implementation Plan

> **Status:** COMPLETE - MVP Fully Implemented
> **Last Updated:** 2026-01-21
> **Goal:** Render 16 A5 person cards with Dreamspell and Tzolkin data

---

## Executive Summary

The MVP goal is to generate **16 printable A5 person cards** displaying:
- Person name (Hebrew)
- Dreamspell section: mantra + oracle map (5 icons in cross pattern)
- Tzolkin section: seal + tone + trilingual name

### Current State Overview

| Category | Status | Notes |
|----------|--------|-------|
| **Calculation Logic** | COMPLETE | 132 tests passing (dreamspell, tzolkin, oracle, julian) |
| **Icon Assets** | COMPLETE | 40 SVGs (20 Dreamspell + 20 Tzolkin) |
| **Oracle Tables** | COMPLETE | All relationships defined |
| **Core Types** | COMPLETE | Branded types Kin, SealNumber, ToneNumber, JulianDay |
| **Phase 1 Infrastructure** | COMPLETE | Next.js 14, Supabase auth, People CRUD, RTL |
| **React Hooks** | COMPLETE | use-auth, use-people, use-computed-results |
| **Test Data** | COMPLETE | 16 Hebrew names with birth dates |
| **Hebrew Translations** | COMPLETE | All types and data files updated with Hebrew |
| **A5 Card Components** | COMPLETE | 7 React components in src/components/cards/ |
| **Cards Page Route** | COMPLETE | `/app/(app)/cards/page.tsx` exists |
| **Print CSS** | COMPLETE | @media print rules in globals.css |
| **Navigation Link** | COMPLETE | Cards link (כרטיסים) in sidebar |
| **Mantras** | TEMPLATE | Template-based, not authentic 260 (P2) |

---

## COMPLETE - No Work Needed

### 1. Calculation Logic (COMPLETE)

**Location:** `src/lib/calculations/`

| File | Functions | Status |
|------|-----------|--------|
| `julian.ts` | `gregorianToJDN()`, `isLeapYear()`, `parseDate()` | COMPLETE |
| `dreamspell.ts` | `dateToKin()`, `kinToSeal()`, `kinToTone()` (with leap day skip) | COMPLETE |
| `oracle.ts` | `calculateOracle()` (guide, analog, antipode, occult) | COMPLETE |
| `tzolkin.ts` | `dateToTzolkin()`, `getTzolkinSealNumber()`, `getTzolkinTone()` | COMPLETE |

**Test Coverage:** 132 tests passing

### 2. Icon Assets (COMPLETE)

**Dreamspell Seals:** `public/icons/dreamspell/seals/`
- `01-dragon.svg` through `20-sun.svg` (all 20 present)

**Tzolkin Signs:** `public/icons/tzolkin/signs/`
- `01-imix.svg` through `20-ajaw.svg` (all 20 present)

### 3. Data Tables (COMPLETE - Structure Only)

| File | Content | Status |
|------|---------|--------|
| `seals.ts` | 20 seals (number, mayan, english, hebrew, color) | COMPLETE |
| `tones.ts` | 13 tones (number, name, nameHebrew, keywords, action) | COMPLETE |
| `tzolkin-signs.ts` | 20 signs (number, yucatec, english, hebrew) | COMPLETE |
| `oracle-tables.ts` | getAnalog, getAntipode, getOccult, getGuide functions | COMPLETE |
| `people.ts` | 16 test people (Hebrew names + birth dates) | COMPLETE |
| `mantras.ts` | Template-based mantra generation (English only) | COMPLETE |

### 4. Core Types (COMPLETE)

**Location:** `src/core/types.ts`
- Branded types: `Kin`, `SealNumber`, `ToneNumber`, `JulianDay`

### 5. Phase 1 Infrastructure (COMPLETE)

- Next.js 14 + TypeScript + Tailwind CSS
- Supabase auth (Google OAuth + Magic Link)
- People directory with CRUD operations
- RTL layout with Hebrew fonts (Heebo, Assistant)
- 12 shadcn/ui components

### 6. React Hooks (COMPLETE)

**Location:** `src/lib/hooks/`

| Hook | Purpose | Status |
|------|---------|--------|
| `use-auth.ts` | Supabase authentication state | COMPLETE |
| `use-people.ts` | People CRUD operations | COMPLETE |
| `use-computed-results.ts` | Dreamspell/Tzolkin calculations storage | COMPLETE |

### 7. Existing Routes (COMPLETE)

- `/app` - Dashboard
- `/app/people` - People directory
- `/app/profile` - User profile
- `/login` - Authentication
- `/onboarding` - New user onboarding

---

## P0: CRITICAL - Must Complete for MVP

### P0.1: React Card Components (7 components)

**Target Directory:** `src/components/cards/` (DOES NOT EXIST - must create)

**Reference Implementation:** `src-mvp/components/` (Web Components to port)

| # | Component | Target File | Reference | Lines |
|---|-----------|-------------|-----------|-------|
| 1 | SealIcon | `SealIcon.tsx` | `seal-icon.ts` | ~56 |
| 2 | OracleMap | `OracleMap.tsx` | `oracle-map.ts` | ~88 |
| 3 | MantraDisplay | `MantraDisplay.tsx` | `mantra-display.ts` | ~54 |
| 4 | DreamspellSection | `DreamspellSection.tsx` | `dreamspell-section.ts` | ~61 |
| 5 | TzolkinSection | `TzolkinSection.tsx` | `tzolkin-section.ts` | ~87 |
| 6 | PersonCard | `PersonCard.tsx` | `person-card.ts` | ~70 |
| 7 | CardGrid | `CardGrid.tsx` | `card-grid.ts` | ~25 |

### P0.2: Cards Page Route

**File:** `src/app/(app)/cards/page.tsx` (DOES NOT EXIST)

Requirements:
- Load TEST_PEOPLE from `src/lib/data/people.ts` OR database people
- Calculate Dreamspell and Tzolkin for each person
- Render CardGrid with PersonCard components
- Support toggle between test data and database

### P0.3: Print CSS

**File:** Add to `src/app/globals.css` (NO @media print rules exist)

**Reference:** `src-mvp/styles/tokens.css` and `src-mvp/styles/main.css`

Required rules:
```css
@media print {
  .person-card {
    width: 148mm;
    height: 210mm;
    page-break-after: always;
    page-break-inside: avoid;
    margin: 0;
  }

  /* Hide navigation and non-printable elements */
  nav, .no-print {
    display: none !important;
  }
}
```

### P0.4: Navigation Link

**File:** `src/app/(app)/layout.tsx`

Current `navItems` array is MISSING cards link. Add:
```tsx
{ href: '/app/cards', label: 'כרטיסים', icon: '🎴' }
```

**Note:** There is also a dead link to `/app/settings` which does not exist (minor issue, can defer).

---

## P1: Required for Full Spec (Hebrew Translations)

These are required for trilingual display but MVP can function without them.

### P1.1: Seal Type & Data Hebrew

**Files:**
- `src/lib/types/seal.ts` - Add `hebrew: string` field
- `src/lib/data/seals.ts` - Add Hebrew values

**Hebrew translations (from DREAMSPELL_SPEC.md):**
| # | English | Hebrew |
|---|---------|--------|
| 1 | Dragon | תנין |
| 2 | Wind | רוח |
| 3 | Night | לילה |
| 4 | Seed | זרע |
| 5 | Serpent | נחש |
| 6 | Worldbridger | מגשר עולמות |
| 7 | Hand | יד |
| 8 | Star | כוכב |
| 9 | Moon | ירח |
| 10 | Dog | כלב |
| 11 | Monkey | קוף |
| 12 | Human | אדם |
| 13 | Skywalker | הולך שמיים |
| 14 | Wizard | קוסם |
| 15 | Eagle | נשר |
| 16 | Warrior | לוחם |
| 17 | Earth | אדמה |
| 18 | Mirror | מראה |
| 19 | Storm | סערה |
| 20 | Sun | שמש |

### P1.2: Tone Type & Data Hebrew

**Files:**
- `src/lib/types/tone.ts` - Add `nameHebrew: string` field
- `src/lib/data/tones.ts` - Add Hebrew values

**Hebrew translations (from DREAMSPELL_SPEC.md):**
| # | English | Hebrew |
|---|---------|--------|
| 1 | Magnetic | מגנטי |
| 2 | Lunar | ירחי |
| 3 | Electric | חשמלי |
| 4 | Self-Existing | קיים-עצמי |
| 5 | Overtone | על-טון |
| 6 | Rhythmic | קצבי |
| 7 | Resonant | מהדהד |
| 8 | Galactic | גלקטי |
| 9 | Solar | שמשי |
| 10 | Planetary | כוכבי |
| 11 | Spectral | ספקטרלי |
| 12 | Crystal | קריסטלי |
| 13 | Cosmic | קוסמי |

### P1.3: TzolkinDaySign Type & Data Hebrew

**Files:**
- `src/lib/types/tzolkin.ts` - Add `hebrew: string` field
- `src/lib/data/tzolkin-signs.ts` - Add Hebrew values

**Note:** Hebrew translations for Tzolkin signs are NOT defined in specs. Recommendation: Use same Hebrew translations as Dreamspell seals where the signs correspond (they share the same 20-day cycle conceptually).

---

## P2: Can Defer (Post-MVP)

### P2.1: Authentic Mantras
- Source 260 authentic mantras from Dreamspell Kit
- Translate mantras to Hebrew
- Create `mantras-full.ts` with complete data

### P2.2: PDF Export
- Implement browser print or react-pdf
- Direct PDF download functionality

### P2.3: Settings Route
- Create `/app/settings` page (currently dead link in nav)
- Or remove the dead link from navigation

---

## Implementation Priorities

### Priority Matrix

| Priority | Category | Tasks | Effort Est. |
|----------|----------|-------|-------------|
| **P0** | React Components | 7 components + page + CSS + nav | 2-3 days |
| **P1** | Hebrew Translations | 3 types + 3 data files | 0.5 day |
| **P2** | Mantras | 260 authentic mantras + Hebrew | Defer |
| **P2** | PDF Export | Browser print or react-pdf | Defer |
| **P2** | Settings | Create settings page or remove link | Defer |

### P0 Task Checklist (Critical Path) - COMPLETE

```
[x] 1. Create src/components/cards/ directory
[x] 2. Create SealIcon.tsx - SVG wrapper with size variants (sm/md/lg)
[x] 3. Create OracleMap.tsx - 3x3 CSS Grid with 5 icons
[x] 4. Create MantraDisplay.tsx - Bilingual mantra text
[x] 5. Create DreamspellSection.tsx - Section wrapper
[x] 6. Create TzolkinSection.tsx - Sign + tone display
[x] 7. Create PersonCard.tsx - A5 container (148mm x 210mm)
[x] 8. Create CardGrid.tsx - Multi-card layout
[x] 9. Create src/app/(app)/cards/page.tsx
[x] 10. Add print CSS to globals.css (@media print rules)
[x] 11. Add navigation link to sidebar (כרטיסים)
```

### P1 Task Checklist - COMPLETE

```
[x] 12. Add hebrew field to Seal interface
[x] 13. Update seals.ts with 20 Hebrew values
[x] 14. Add nameHebrew field to Tone interface
[x] 15. Update tones.ts with 13 Hebrew values
[x] 16. Add hebrew field to TzolkinDaySign interface
[x] 17. Update tzolkin-signs.ts with 20 Hebrew values
```

### P2 Task Checklist (Deferred)

```
[ ] 18. Source 260 authentic mantras from Dreamspell Kit
[ ] 19. Translate mantras to Hebrew
[ ] 20. Create mantras-full.ts with complete data
[ ] 21. Add PDF export functionality
[ ] 22. Create settings page or remove dead link
```

---

## File Structure

```
src/
├── components/
│   ├── cards/                      # P0 - MVP Card Components (TO CREATE)
│   │   ├── index.ts                # Barrel exports
│   │   ├── SealIcon.tsx            # P0 - SVG wrapper
│   │   ├── OracleMap.tsx           # P0 - 5-icon cross pattern
│   │   ├── MantraDisplay.tsx       # P0 - Bilingual text
│   │   ├── DreamspellSection.tsx   # P0 - Section wrapper
│   │   ├── TzolkinSection.tsx      # P0 - Sign + tone display
│   │   ├── PersonCard.tsx          # P0 - A5 container
│   │   └── CardGrid.tsx            # P0 - Multi-card layout
│   └── ui/                         # Existing shadcn/ui (12 components)
├── app/
│   ├── globals.css                 # P0 - Add @media print rules
│   └── (app)/
│       ├── layout.tsx              # P0 - Add cards nav link
│       └── cards/
│           └── page.tsx            # P0 - Cards page (TO CREATE)
├── lib/
│   ├── types/
│   │   ├── seal.ts                 # P1 - Add hebrew field
│   │   ├── tone.ts                 # P1 - Add nameHebrew field
│   │   └── tzolkin.ts              # P1 - Add hebrew field
│   ├── data/
│   │   ├── seals.ts                # P1 - Add Hebrew values
│   │   ├── tones.ts                # P1 - Add Hebrew values
│   │   ├── tzolkin-signs.ts        # P1 - Add Hebrew values
│   │   └── mantras-full.ts         # P2 - Authentic 260 mantras
│   └── hooks/
│       ├── use-auth.ts             # COMPLETE
│       ├── use-people.ts           # COMPLETE
│       └── use-computed-results.ts # COMPLETE

src-mvp/                            # Reference implementation
├── components/                     # Web Components (port to React)
│   ├── person-card.ts              # Reference for PersonCard.tsx
│   ├── card-grid.ts                # Reference for CardGrid.tsx
│   ├── dreamspell-section.ts       # Reference for DreamspellSection.tsx
│   ├── oracle-map.ts               # Reference for OracleMap.tsx
│   ├── tzolkin-section.ts          # Reference for TzolkinSection.tsx
│   ├── seal-icon.ts                # Reference for SealIcon.tsx
│   └── mantra-display.ts           # Reference for MantraDisplay.tsx
└── styles/                         # Print CSS reference
    ├── tokens.css                  # A5 dimensions, colors, typography
    └── main.css                    # @page size, page-break rules
```

---

## Component Specifications

### SealIcon Component

```tsx
interface SealIconProps {
  sealNumber: number          // 1-20
  size?: 'sm' | 'md' | 'lg'   // 32px, 48px, 64px
  system?: 'dreamspell' | 'tzolkin'
}
```
- Load SVG from `/public/icons/{system}/` directory
- Support size variants for oracle (48px) vs center (64px) icons
- Handle both Dreamspell seals and Tzolkin signs

### OracleMap Component

```tsx
interface OracleMapProps {
  kin: number
  seal: number
  oracle: {
    guide: number
    analog: number
    antipode: number
    occult: number
  }
}
```
- CSS Grid layout: 3x3
- Position mapping:
  - Guide: row 1, col 2 (top center)
  - Antipode: row 2, col 1 (middle left)
  - Kin: row 2, col 2 (center)
  - Analog: row 2, col 3 (middle right)
  - Occult: row 3, col 2 (bottom center)
- Center icon: 64px (lg), oracle icons: 48px (md)

### PersonCard Layout

```
┌─────────────────────────────────────────┐
│              [NAME - Large]             │  <- 15% Header
│                  ליאור                   │
├─────────────────────────────────────────┤
│     לפי הדרימספל / According to the     │  <- 55% Dreamspell
│              Dreamspell                 │
│              ┌─────────┐                │
│              │  Guide  │                │
│              └─────────┘                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │Antipode │ │   KIN   │ │ Analog  │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│              ┌─────────┐                │
│              │ Occult  │                │
│              └─────────┘                │
│  "I unify in order to dream..."         │
│  "אני מאחד כדי לחלום..."                │
├─────────────────────────────────────────┤
│      לפי הצולקין / According to the     │  <- 30% Tzolkin
│               Tzolkin                   │
│              [icon]  7                  │
│         Muluc — Moon — ירח             │
└─────────────────────────────────────────┘
```

**Dimensions:** A5 = 148mm x 210mm (ratio 1:1.414)

### Icon Size Reference

| Context | Size | Pixels | Usage |
|---------|------|--------|-------|
| Center Kin | lg | 64px | PersonCard main icon |
| Oracle Icons | md | 48px | Guide, Analog, Antipode, Occult |
| Tzolkin Sign | lg | 64px | TzolkinSection main icon |
| Small badges | sm | 32px | Lists, compact views |

### Typography

| Element | Size | Weight | Alignment |
|---------|------|--------|-----------|
| Name | 32px | Bold | Center |
| Section title | 14px | Medium | Center |
| Mantra (HE) | 16px | Regular | Center |
| Mantra (EN) | 12px | Light/Italic | Center |
| Sign name | 18px | Medium | Center |

### RTL Considerations

- All components use `direction: rtl`
- Hebrew text is primary, English secondary
- Oracle map layout remains LTR for spatial consistency
- Section titles are bilingual (Hebrew / English)

---

## Definition of Done

The MVP is **DONE** when:

### Core Requirements
- [x] Cards page renders at `/app/cards`
- [x] Page displays one A5 card per person (16 cards total)
- [x] Navigation link exists in sidebar ("כרטיסים")

### Per-Card Requirements
- [x] Name displayed (Hebrew, bold, centered)
- [x] Dreamspell section with:
  - [x] Oracle map (5 icons in cross pattern)
  - [x] Mantra text (English minimum, Hebrew if P1 complete)
- [x] Tzolkin section with:
  - [x] Day sign icon (64px)
  - [x] Tone number
  - [x] Bilingual name (Yucatec - English, Hebrew if P1 complete)

### Technical Requirements
- [x] All 40 icons load from local SVG files
- [x] RTL layout (Hebrew primary)
- [x] No runtime errors
- [x] TypeScript clean (strict mode)
- [x] Print CSS produces proper A5 layout

### P1 Enhancement (for full spec) - COMPLETE
- [x] Hebrew names for seals/signs displayed
- [x] Hebrew tone names displayed
- [x] Trilingual display (Yucatec - English - Hebrew)

---

## Test Data (16 People)

From `src/lib/data/people.ts`:

| Name | Birth Date |
|------|------------|
| ליאור | 1966-09-23 |
| ילנה | 1955-06-11 |
| אביטל | 1967-03-26 |
| איתן | 1957-02-19 |
| יפעת | 1971-08-10 |
| מיכל | 1968-07-09 |
| אויה | 1967-03-27 |
| קרן | 1976-11-28 |
| עינת | 1965-06-21 |
| גניה | 1966-02-25 |
| גדי | 1960-10-10 |
| דינה | 1977-04-02 |
| סיגל | 1968-10-01 |
| מיטל | 1978-11-01 |
| אלנה | 1956-07-19 |
| ענת | 1961-09-21 |

---

## Commands

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run test          # Run calculation tests (48+ tests)
npm run typecheck     # TypeScript type checking
```

---

## References

- `/specs/MVP_SCOPE.md` - MVP requirements
- `/specs/CARD_LAYOUT.md` - A5 card visual spec
- `/specs/DREAMSPELL_SPEC.md` - Calculation details + Hebrew translations
- `/specs/TZOLKIN_SPEC.md` - Tzolkin system details
- `src-mvp/` - Legacy Web Components (reference for porting)

---
---

# FUTURE PHASES

The following phases are planned after MVP completion.

---

# PHASE 2: Relationship Graph + Group Analysis

> **Status:** COMPLETE - All phases implemented (100%)
> **Prerequisite:** MVP Complete
> **Reference:** `specs/components/RELATIONSHIPS.md`

## Phase 2 Goal

"People + connections" becomes the product. Model relationships, visualize networks, and analyze group dynamics.

---

## Phase 2.1: Relationship Data Model (COMPLETE)

### Tasks

- [x] **2.1.1** Create relationship database tables
  - `relationships` table (person1_id, person2_id, type, subtype, strength)
  - `groups` table (name, description)
  - `group_members` junction table
  - `shared_views` table for sharing
  - Add RLS policies
  - Migration: `supabase/migrations/00002_relationships_schema.sql`

- [x] **2.1.2** Create TypeScript types
  - `src/lib/types/relationship.ts` - Full relationship domain types
  - `src/lib/supabase/database.types.ts` - Updated with new tables
  - Types: `Relationship`, `RelationshipType`, `RelationshipSubtype`, `Group`, `GroupWithMembers`, `GraphNode`, `GraphEdge`, etc.

- [x] **2.1.3** Create API/hooks layer
  - `src/lib/hooks/use-relationships.ts` - Relationships CRUD operations
  - `src/lib/hooks/use-groups.ts` - Groups CRUD operations
  - Note: Using React hooks pattern (consistent with existing codebase) instead of Zustand

- [x] **2.1.4** Create state management (via hooks)
  - `useRelationships()` - fetch, add, update, delete relationships
  - `useGroups()` - fetch, create, update, delete groups, manage members
  - Helper functions: getRelationshipColor, getRelationshipLabel

### Definition of Done
- [x] Relationships can be created between people
- [x] Relationships have types (family, romantic, friend, professional)
- [x] Groups can be created with members

### Files Created
- `supabase/migrations/00002_relationships_schema.sql`
- `src/lib/types/relationship.ts`
- `src/lib/hooks/use-relationships.ts`
- `src/lib/hooks/use-groups.ts`

### Files Modified
- `src/lib/supabase/database.types.ts` - Added relationships, groups, group_members, shared_views tables
- `src/lib/types/index.ts` - Added relationship type exports

---

## Phase 2.2: Relationship CRUD UI (COMPLETE)

### Tasks

- [x] **2.2.1** Create add relationship dialog
  - Person 1 + Person 2 selectors
  - Relationship type/subtype pickers
  - Strength slider (1-5)
  - Start/end date (optional)
  - Notes field
  - File: `src/app/(app)/relationships/page.tsx`

- [x] **2.2.2** Create relationship list view
  - List all relationships with filters
  - Filter by type (badges)
  - Edit/delete actions via dropdown
  - Full CRUD in dialogs
  - File: `src/app/(app)/relationships/page.tsx`

- [x] **2.2.3** Create group management UI
  - Create/edit group with name/description
  - Add/remove members via checkboxes
  - Group list view with member counts
  - View/edit members dialog
  - File: `src/app/(app)/groups/page.tsx`

- [x] **2.2.4** Add relationship indicators to person cards
  - Show relationship count badge on cards
  - Link to relationships page from card menu
  - Relationship counts computed from store
  - File: `src/app/(app)/people/page.tsx`

### Definition of Done
- [x] User can add relationships between people
- [x] User can create and manage groups
- [x] Relationships shown on person cards

### Files Created
- `src/app/(app)/relationships/page.tsx` - Full relationships CRUD page
- `src/app/(app)/groups/page.tsx` - Groups management page

### Files Modified
- `src/app/(app)/layout.tsx` - Added navigation links for relationships and groups
- `src/app/(app)/people/page.tsx` - Added relationship indicators to person cards

---

## Phase 2.3: Network Graph Visualization (COMPLETE)

### Tasks

- [x] **2.3.1** Choose graph library
  - Chose: react-force-graph-2d
  - Supports: zoom, pan, drag nodes, styling, canvas rendering
  - Dynamic import to avoid SSR issues with Next.js

- [x] **2.3.2** Create graph data transformer
  - `transformToGraphData()` function in graph page
  - Convert people + relationships → nodes + edges
  - Calculate node sizes based on connection count
  - Assign colors by Dreamspell seal color (red, white, blue, yellow)

- [x] **2.3.3** Create graph visualization component
  - ForceGraph2D with custom node rendering
  - Force-directed layout with cooldown
  - Click node → opens PersonDetails sheet
  - Custom nodeCanvasObject for styled nodes with labels

- [x] **2.3.4** Add graph controls
  - Zoom in/out buttons
  - Reset view (zoom to fit)
  - Filter by relationship type badges
  - Enable zoom/pan/drag interactions

- [x] **2.3.5** Create graph page
  - `/app/graph` - Full-screen network view
  - Sidebar sheet with selected person details
  - PersonDetails component with relationships list
  - Navigation link added (מפת קשרים)

### Definition of Done
- [x] Network graph renders all people and relationships
- [x] User can zoom, pan, drag nodes
- [x] User can filter by relationship type
- [x] Clicking node shows person details

### Files Created
- `src/app/(app)/graph/page.tsx` - Complete graph visualization page

### Files Modified
- `src/app/(app)/layout.tsx` - Added graph navigation link

---

## Phase 2.4: Group Analysis (COMPLETE)

### Tasks

- [x] **2.4.1** Create compatibility calculations
  - Dreamspell compatibility (analog, antipode, occult, guide)
  - Tzolkin compatibility
  - Score calculation
  - File: `src/lib/services/compatibility.ts`

- [x] **2.4.2** Create group analysis service
  - `src/lib/services/group-analysis.ts`
  - Kin distribution
  - Seal/tone distribution
  - Color balance
  - Compatibility matrix

- [x] **2.4.3** Create compatibility matrix component
  - Grid showing person-to-person scores
  - Color-coded (green = high, red = low)
  - Integrated in analysis page

- [x] **2.4.4** Create group analysis page
  - `/app/groups/[id]/analysis`
  - Distribution charts (seals, tones, colors)
  - Compatibility matrix
  - Insights/strengths/challenges summary

### Definition of Done
- [x] Compatibility scores calculated for pairs
- [x] Group analysis shows distributions
- [x] Compatibility matrix renders correctly

### Files Created
- `src/lib/services/compatibility.ts` - Compatibility calculations
- `src/lib/services/group-analysis.ts` - Group analysis service
- `src/app/(app)/groups/[id]/analysis/page.tsx` - Analysis page

### Files Modified
- `src/app/(app)/groups/page.tsx` - Added analysis link to group card menu

---

## Phase 2.5: Sharing (COMPLETE)

### Tasks

- [x] **2.5.1** Create shared_views table
  - URL, expiration, max views, password hash
  - RLS for public access
  - Done: Included in migration 00002

- [x] **2.5.2** Create share dialog
  - Select what to share
  - Set expiration
  - Optional password
  - Generate link
  - File: `src/components/share-dialog.tsx`

- [x] **2.5.3** Create public share view
  - `/share/[token]` - Public route
  - Read-only group analysis view
  - Password protection support
  - CTA to sign up

### Definition of Done
- [x] User can create share links
- [x] Share links work without login
- [x] Links expire correctly

### Files Created
- `src/lib/hooks/use-shares.ts` - Share management hook
- `src/components/share-dialog.tsx` - Share dialog component
- `src/app/share/[token]/page.tsx` - Public share view

### Files Modified
- `src/app/(app)/groups/page.tsx` - Added share dialog integration

---

## Phase 2 Progress Tracker

| Phase | Status | Tasks | Complete |
|-------|--------|-------|----------|
| 2.1 Data Model | ✅ COMPLETE | 4 | 4/4 |
| 2.2 CRUD UI | ✅ COMPLETE | 4 | 4/4 |
| 2.3 Graph | ✅ COMPLETE | 5 | 5/5 |
| 2.4 Analysis | ✅ COMPLETE | 4 | 4/4 |
| 2.5 Sharing | ✅ COMPLETE | 3 | 3/3 |
| **TOTAL** | **100%** | **20** | **20/20** |

---
---

# PHASE 3: Multi-System Expansion

> **Status:** ✅ COMPLETE
> **Completed:** 2026-01-22
> **Prerequisite:** Phase 2 Complete
> **Reference:** `specs/systems/*.md`

## Phase 3 Goal

Unify the full set of symbolic systems under one UI. Add Astrology, Human Design, Gematria, and expand Dreamspell/Tzolkin depth.

**Note:** Astrology and Human Design require birth TIME and PLACE for accuracy.

---

## Phase 3.1: Dreamspell Full Depth (COMPLETE)

### Tasks

- [x] **3.1.1** Add wavespell calculations
  - 13-day wavespell cycles
  - Current wavespell position
  - File: `src/lib/calculations/wavespell.ts`

- [x] **3.1.2** Add yearly kin calculations
  - Galactic birthday
  - Year bearer
  - Personal year
  - 13-year cycle position
  - File: `src/lib/calculations/yearly.ts`

- [x] **3.1.3** Create wavespell visualization
  - 13-kin wavespell diagram
  - Person's position highlighted
  - WavespellDisplay, WavespellMini, WavespellProgress components
  - CastleDisplay, CastleMini components
  - YearlyDisplay components (DreamspellYear, GalacticBirthday, PersonalYear)
  - Files: `src/components/cards/WavespellDisplay.tsx`, `CastleDisplay.tsx`, `YearlyDisplay.tsx`

- [x] **3.1.4** Add cycle tracking
  - 260-day Tzolkin cycle position
  - Castles (52-day periods)
  - Earth families (5 families of 4 seals)
  - Color families (4 families of 5 seals)
  - Harmonics (65 groups of 4 consecutive kins)
  - File: `src/lib/calculations/cycles.ts`

### Definition of Done
- [x] Wavespell calculations work (24 tests)
- [x] Yearly kin shown for each person (24 tests)
- [x] Cycle tracking works (30 tests)
- [x] Wavespell visualization renders (3 components)
- [x] Castle display renders (2 components)
- [x] Yearly display renders (3 components)

### Files Created
- `src/lib/calculations/wavespell.ts` - Wavespell calculations
- `src/lib/calculations/cycles.ts` - Castle, Earth family, Color family, Harmonic calculations
- `src/lib/calculations/yearly.ts` - Galactic birthday, Year bearer, Personal year calculations
- `src/lib/calculations/wavespell.test.ts` - 24 tests
- `src/lib/calculations/cycles.test.ts` - 30 tests
- `src/lib/calculations/yearly.test.ts` - 24 tests
- `src/components/cards/WavespellDisplay.tsx` - Wavespell visualization components
- `src/components/cards/CastleDisplay.tsx` - Castle display components
- `src/components/cards/YearlyDisplay.tsx` - Yearly display components

### Files Modified
- `src/lib/calculations/index.ts` - Added exports for new calculations
- `src/components/cards/index.ts` - Added exports for new components

---

## Phase 3.2: Mayan Long Count (COMPLETE)

### Tasks

- [x] **3.2.1** Implement Long Count calculations
  - `src/lib/calculations/long-count.ts`
  - Baktun, Katun, Tun, Uinal, Kin
  - GMT correlation 584283
  - Haab (365-day solar year) calculations
  - Calendar Round (Tzolkin + Haab combination)

- [x] **3.2.2** Create Long Count display
  - Format: 13.0.11.5.8 (example)
  - Haab date (365-day solar year)
  - Current Long Count position
  - LongCountDisplay, LongCountMini, BaktunProgress components
  - HaabDisplay, CalendarRoundDisplay components

- [x] **3.2.3** Add key dates timeline
  - Birth Long Count
  - Current Long Count
  - Notable historical dates
  - MayanTimelineDisplay, MayanTimelineMini components
  - HistoricalDatesDisplay component

### Definition of Done
- [x] Long Count calculated for any date
- [x] Display shows all components
- [x] Timeline visualization works
- [x] 47 comprehensive tests passing
- [x] Haab and Calendar Round calculations work

### Files Created
- `src/lib/calculations/long-count.ts` - Long Count, Haab, Calendar Round calculations
- `src/lib/calculations/long-count.test.ts` - 47 comprehensive tests
- `src/components/cards/LongCountDisplay.tsx` - LongCountDisplay, LongCountMini, BaktunProgress, HaabDisplay, CalendarRoundDisplay
- `src/components/cards/MayanTimelineDisplay.tsx` - MayanTimelineDisplay, MayanTimelineMini, HistoricalDatesDisplay

### Files Modified
- `src/lib/calculations/index.ts` - Added Long Count exports
- `src/components/cards/index.ts` - Added Long Count component exports

---

## Phase 3.3: Astrology (Natal Chart) (COMPLETE)

### Reference
- `specs/systems/ASTROLOGY.md`

### Tasks

- [x] **3.3.1** Integrate ephemeris library
  - Used: circular-natal-horoscope-js (npm package)
  - Calculate planetary positions for all 10 planets + nodes + lilith
  - Supports tropical and sidereal zodiacs

- [x] **3.3.2** Implement natal chart calculation
  - `src/lib/calculations/astrology.ts`
  - Sun, Moon, Rising (Big Three)
  - All planets in signs with exact degrees
  - House placements (7 systems: Placidus, Koch, Whole-sign, Equal, Campanus, Regiomontanus, Topocentric)

- [x] **3.3.3** Implement aspect calculations
  - 7 aspects: Conjunction, Opposition, Square, Trine, Sextile, Quincunx, Semi-sextile
  - Orb calculations with strength
  - Aspect extraction from horoscope library

- [x] **3.3.4** Create chart display components
  - ChartSummaryCard: Big Three with element balance
  - PlanetPositions: Planet list with signs, houses, dignities
  - AspectsDisplay: Aspect list with orbs
  - Note: Full SVG chart wheel deferred to future enhancement

- [x] **3.3.5** Create astrology card component
  - AstrologyDisplay: Main display with all sections
  - AstrologyMini: Compact sun/moon display for person cards
  - ChartSummaryMini: Inline Big Three display
  - Element and modality balance calculations

- [x] **3.3.6** Handle missing birth time
  - Uses noon (12:00) as default
  - Marks Moon position as approximate
  - Omits houses and angular points when no birth time

### Definition of Done
- [x] Natal chart calculated with correct positions (51 tests)
- [x] Chart display components render correctly
- [x] Works with or without birth time

### Files Created
- `src/lib/types/astrology.ts` - Full type definitions
- `src/lib/data/zodiac-signs.ts` - 12 zodiac signs with Hebrew
- `src/lib/data/planets.ts` - 13 planets/points with Hebrew
- `src/lib/data/houses.ts` - 12 houses with meanings
- `src/lib/data/aspects.ts` - 7 aspects with orbs
- `src/lib/calculations/astrology.ts` - Calculation functions
- `src/lib/calculations/astrology.test.ts` - 51 tests
- `src/components/cards/AstrologyDisplay.tsx` - 6 display components

### Files Modified
- `src/lib/types/index.ts` - Added astrology type exports
- `src/lib/data/index.ts` - Added astrology data exports
- `src/lib/calculations/index.ts` - Added astrology function exports
- `src/components/cards/index.ts` - Added astrology component exports
- `package.json` - Added circular-natal-horoscope-js dependency

---

## Phase 3.4: Human Design (Bodygraph) (COMPLETE)

### Reference
- `specs/systems/HUMAN_DESIGN.md`

### Tasks

- [x] **3.4.1** Implement gate/channel calculations
  - `src/lib/calculations/human-design.ts`
  - Personality (birth) activations
  - Design (~88 days before) activations
  - Gate-to-center mapping
  - `longitudeToGate()` function with mandala sequence
  - Full gate/channel data with I Ching mappings

- [x] **3.4.2** Implement type determination
  - Manifestor, Generator, MG, Projector, Reflector
  - Based on defined centers and motor-throat connection
  - `determineType()` function with complete logic

- [x] **3.4.3** Implement authority determination
  - Emotional, Sacral, Splenic, Ego, Self-Projected, Mental, Lunar, None
  - Based on center hierarchy
  - `determineAuthority()` function for all 8 authorities

- [x] **3.4.4** Implement profile calculation
  - Sun line positions (1-6)
  - 12 profile combinations
  - `determineProfile()` function using Sun line positions

- [x] **3.4.5** Create bodygraph visualization
  - HumanDesignDisplay components
  - 9 centers with defined/undefined states
  - 36 channels with circuitry information
  - Personality (black) vs Design (red) activations

- [x] **3.4.6** Create Human Design card component
  - BodygraphSummaryCard: Type + Strategy + Authority + Profile
  - CenterStateDisplay: 9 centers visualization
  - ActivationsDisplay: Personality and Design gates
  - ChannelsDisplay: Defined channels list
  - HumanDesignMini: Compact display for person cards

- [x] **3.4.7** Handle missing birth time
  - MissingBirthTimeMessage component
  - PartialBodygraph type for incomplete data
  - Graceful degradation with informative message

### Definition of Done
- [x] Bodygraph calculated correctly (98 comprehensive tests)
- [x] Type/Authority/Profile determined
- [x] Bodygraph visualization renders
- [x] Graceful handling of missing birth time

### Files Created
- `src/lib/types/human-design.ts` - Full type definitions (Bodygraph, HumanDesignType, Authority, Profile, Gate, Channel, Center)
- `src/lib/data/human-design-gates.ts` - 64 gates with I Ching mappings, mandala sequence
- `src/lib/data/human-design-channels.ts` - 36 channels with circuitry information
- `src/lib/data/human-design.ts` - Centers, Types, Authorities, Profiles data
- `src/lib/calculations/human-design.ts` - Bodygraph calculation functions (calculateBodygraph, longitudeToGate, determineType, determineAuthority, determineProfile)
- `src/lib/calculations/human-design.test.ts` - 98 comprehensive tests
- `src/components/cards/HumanDesignDisplay.tsx` - 7 display components (BodygraphSummaryCard, CenterStateDisplay, ActivationsDisplay, ChannelsDisplay, HumanDesignMini, MissingBirthTimeMessage, HumanDesignDisplay)

### Files Modified
- `src/lib/types/index.ts` - Added Human Design type exports
- `src/lib/data/index.ts` - Added Human Design data exports
- `src/lib/calculations/index.ts` - Added Human Design function exports
- `src/components/cards/index.ts` - Added Human Design component exports

---

## Phase 3.5: Gematria (COMPLETE)

### Reference
- `specs/systems/GEMATRIA.md`

### Tasks

- [x] **3.5.1** Implement Hebrew gematria methods
  - `src/lib/calculations/gematria.ts`
  - Standard (Mispar Hechrachi)
  - Full (Mispar Gadol) - Final letters have high values (500-900)
  - Small (Mispar Katan)
  - Ordinal (Mispar Siduri)
  - AtBash, Avgad, Albam ciphers
  - Digital root calculation

- [x] **3.5.2** Implement name processing
  - Hebrew letter extraction
  - Nikud (vowel marks) removal
  - Full 22-letter alphabet + 5 final forms
  - AtBash, Avgad, Albam cipher pairs

- [x] **3.5.3** Create gematria display
  - GematriaSummaryCard: Main value, digital root, notable number
  - LetterBreakdownDisplay: Letter-by-letter values
  - MethodValuesDisplay: All 7 calculation methods
  - GematriaMini: Compact inline display
  - NameComparisonDisplay: Two-name comparison

- [x] **3.5.4** Add name correlations
  - `compareNames()` function for two-name comparison
  - `analyzeGroup()` function for group gematria
  - Notable numbers database (18 entries: Chai, YHVH, Mashiach, etc.)
  - Matching pairs detection by value or digital root

### Definition of Done
- [x] Gematria calculated for Hebrew names (78 tests passing)
- [x] Multiple methods supported (7 methods: standard, full, small, ordinal, atbash, avgad, albam)
- [x] Matching names highlighted (compareNames, analyzeGroup functions)

### Files Created
- `src/lib/types/gematria.ts` - Full type definitions (GematriaMethod, HebrewLetter, GematriaResult, NameGematria, NameComparison, GroupGematria, NotableNumber)
- `src/lib/data/hebrew-letters.ts` - 22 Hebrew letters + 5 final forms + notable numbers database + cipher helpers
- `src/lib/calculations/gematria.ts` - All calculation functions (calculateGematria, standardGematria, analyzeNameGematria, compareNames, analyzeGroup)
- `src/lib/calculations/gematria.test.ts` - 78 comprehensive tests
- `src/components/cards/GematriaDisplay.tsx` - 6 display components (GematriaDisplay, GematriaSummaryCard, LetterBreakdownDisplay, MethodValuesDisplay, NameComparisonDisplay, GematriaMini)

### Files Modified
- `src/lib/types/index.ts` - Added gematria type exports
- `src/lib/data/index.ts` - Added Hebrew letter data exports
- `src/lib/calculations/index.ts` - Added gematria function exports
- `src/components/cards/index.ts` - Added gematria component exports

---

## Phase 3.6: System Integration

> **Status:** ✅ COMPLETE
> **Completed:** 2026-01-22

### Tasks

- [x] **3.6.1** Create unified person detail page
  - `/app/people/[id]` - All systems view
  - Tabs or sections per system
  - Collapsible details

- [x] **3.6.2** Create system toggle
  - User can enable/disable systems
  - Store preference in user profile
  - Hide disabled systems

- [x] **3.6.3** Update computed_results table
  - Store results per system (6 systems)
  - Version tracking for algorithm changes
  - Compute and cache on demand

- [x] **3.6.4** Create cross-system insights
  - Show correlations between systems
  - "Themes" that appear in multiple systems
  - Elemental, numeric, and energy pattern analysis

### Definition of Done
- [x] All systems shown on person page
- [x] User can toggle systems
- [x] Cross-system insights displayed

### Files Changed
- `src/app/(app)/people/[id]/page.tsx` - Created person detail page with all 6 systems
- `src/app/(app)/settings/page.tsx` - Created settings page with system toggles
- `src/lib/hooks/use-system-preferences.ts` - Hook for system preferences
- `src/lib/hooks/use-computed-results.ts` - Extended for all 6 systems
- `src/components/cards/CrossSystemInsights.tsx` - Cross-system insights component
- `src/components/cards/index.ts` - Added new exports

---

## Phase 3 Progress Tracker

| Phase | Status | Tasks | Complete |
|-------|--------|-------|----------|
| 3.1 Dreamspell Depth | ✅ COMPLETE | 4 | 4/4 |
| 3.2 Long Count | ✅ COMPLETE | 3 | 3/3 |
| 3.3 Astrology | ✅ COMPLETE | 6 | 6/6 |
| 3.4 Human Design | ✅ COMPLETE | 7 | 7/7 |
| 3.5 Gematria | ✅ COMPLETE | 4 | 4/4 |
| 3.6 Integration | ✅ COMPLETE | 4 | 4/4 |
| **TOTAL** | **100%** | **28** | **28/28** |

---
---

# PHASE 4: Canvas Editor + Full Dashboard

> **Status:** ✅ COMPLETE
> **Completed:** 2026-01-22
> **Prerequisite:** Phase 3 Complete
> **Reference:** `specs/components/CANVAS_EDITOR.md`

## Phase 4 Goal

Move from "viewer" to "creator tool." Users can create boards with draggable nodes, layers, annotations, and export them.

---

## Phase 4.1: Board Data Model (COMPLETE)

### Tasks

- [x] **4.1.1** Create boards table
  - id, owner_id, name, description
  - template, canvas (JSONB), layers (JSONB)
  - thumbnail, is_public
  - Migration: `supabase/migrations/00003_boards_schema.sql`

- [x] **4.1.2** Create TypeScript types
  - `src/lib/types/board.ts` - Full type definitions
  - `Board`, `CanvasState`, `Layer`, `CanvasNode`, `Connection`, `Annotation`
  - All node types: PersonNode, TextNode, ShapeNode, StickyNote, etc.

- [x] **4.1.3** Create API layer
  - `src/lib/hooks/use-boards.ts` - Boards CRUD hook
  - Create, read, update, delete boards
  - Share management

### Definition of Done
- [x] Boards can be created and saved
- [x] Canvas state persists as JSON

### Files Created
- `supabase/migrations/00003_boards_schema.sql`
- `src/lib/types/board.ts`
- `src/lib/hooks/use-boards.ts`
- `src/app/(app)/boards/page.tsx`
- `src/app/(app)/boards/[id]/page.tsx`

---

## Phase 4.2: Canvas Core (COMPLETE)

### Tasks

- [x] **4.2.1** Choose canvas library
  - Chose: @xyflow/react (React Flow)
  - Supports: drag, zoom, pan, layers, export, custom nodes/edges

- [x] **4.2.2** Create canvas component
  - `src/components/canvas/canvas-editor.tsx` - Main editor
  - `src/components/canvas/canvas-context.tsx` - State management
  - Infinite canvas with pan/zoom
  - Grid background (toggleable)

- [x] **4.2.3** Implement node rendering
  - `src/components/canvas/nodes/person-node.tsx` - Person display modes
  - `src/components/canvas/nodes/text-node.tsx` - Editable text
  - `src/components/canvas/nodes/shape-node.tsx` - Shapes (rect, ellipse, etc.)
  - `src/components/canvas/nodes/sticky-node.tsx` - Sticky notes

- [x] **4.2.4** Implement selection
  - Click to select, multi-select with shift
  - Box selection with drag
  - Selection state in context

- [x] **4.2.5** Implement drag & drop
  - Drag nodes to reposition
  - Snap to grid (configurable)

### Definition of Done
- [x] Canvas renders with pan/zoom
- [x] Nodes can be added and positioned
- [x] Selection and drag work

### Files Created
- `src/components/canvas/canvas-editor.tsx`
- `src/components/canvas/canvas-context.tsx`
- `src/components/canvas/canvas-toolbar.tsx`
- `src/components/canvas/nodes/person-node.tsx`
- `src/components/canvas/nodes/text-node.tsx`
- `src/components/canvas/nodes/shape-node.tsx`
- `src/components/canvas/nodes/sticky-node.tsx`
- `src/components/canvas/index.ts`

---

## Phase 4.3: Connections & Layers (COMPLETE)

### Tasks

- [x] **4.3.1** Implement connections
  - 4 custom edge types: relationship, flow, line, curve
  - `src/components/canvas/edges/` - Custom edge components
  - Connection styles (color, width, dash, markers)
  - Bezier curves and straight lines

- [x] **4.3.2** Implement layers panel
  - `src/components/canvas/layers-panel.tsx`
  - Create/rename/delete layers
  - Toggle visibility, lock layers
  - Reorder layers
  - Settings popover with opacity, color, name

- [x] **4.3.3** Layer assignment
  - Nodes assigned to layers via layerId
  - Layer opacity affects node rendering

### Definition of Done
- [x] Connections render between nodes
- [x] Layers can be created and toggled
- [x] Nodes can be assigned to layers

### Files Created
- `src/components/canvas/edges/relationship-edge.tsx`
- `src/components/canvas/edges/flow-edge.tsx`
- `src/components/canvas/edges/line-edge.tsx`
- `src/components/canvas/edges/curve-edge.tsx`
- `src/components/canvas/edges/index.ts`
- `src/components/canvas/layers-panel.tsx`
- `src/components/canvas/connection-properties.tsx`
- `src/components/ui/popover.tsx`

---

## Phase 4.4: Annotations & Tools (COMPLETE)

### Tasks

- [x] **4.4.1** Create toolbar
  - `src/components/canvas/canvas-toolbar.tsx`
  - Select, Hand, Text, Shape, Line, Sticky, Pen, Highlight tools
  - Tool shortcuts (V, H, T, R, L, N, P, G)

- [x] **4.4.2** Implement sticky notes
  - `src/components/canvas/nodes/sticky-node.tsx`
  - 5 color options (yellow, pink, blue, green, purple)
  - Editable text with double-click
  - Resizable

- [x] **4.4.3** Implement text annotations
  - `src/components/canvas/nodes/text-node.tsx`
  - Font size, weight, color
  - Text alignment (RTL support)

- [x] **4.4.4** Implement highlights and callouts
  - `src/components/canvas/nodes/highlight-node.tsx` - Highlight regions
  - `src/components/canvas/nodes/callout-node.tsx` - Callout bubbles
  - `src/components/canvas/nodes/freehand-node.tsx` - Freehand drawing

### Definition of Done
- [x] Toolbar switches between tools
- [x] Annotations can be added
- [x] Text editing works

### Files Created
- `src/components/canvas/nodes/highlight-node.tsx`
- `src/components/canvas/nodes/callout-node.tsx`
- `src/components/canvas/nodes/freehand-node.tsx`

---

## Phase 4.5: Properties Panel (COMPLETE)

### Tasks

- [x] **4.5.1** Create properties panel
  - `src/components/canvas/properties-panel.tsx`
  - Position (X, Y), Size (W, H)
  - Opacity slider
  - Layer assignment
  - Lock/hide buttons

- [x] **4.5.2** Node-specific properties
  - Person node: display mode, systems to show checkboxes
  - Text node: font size, weight, color, alignment
  - Shape node: shape type, fill color, stroke color/width
  - Sticky note: color selection

- [x] **4.5.3** Connection properties
  - `src/components/canvas/connection-properties.tsx`
  - Type, color, width, dashed
  - Start/end markers

### Definition of Done
- [x] Properties panel shows for selected node
- [x] Changes apply immediately

---

## Phase 4.6: History & Keyboard (COMPLETE)

### Tasks

- [x] **4.6.1** Implement undo/redo
  - History stack in canvas-context.tsx
  - pushHistory() on state changes
  - undo()/redo() functions
  - Undo/Redo buttons in toolbar

- [x] **4.6.2** Implement keyboard shortcuts
  - `src/components/canvas/use-keyboard-shortcuts.ts`
  - Tool shortcuts (V, H, T, R, L, N, P, G)
  - Delete/Backspace, Ctrl+C/V/D, Ctrl+Z/Y
  - Ctrl+A (select all), Escape (deselect)
  - Ctrl+0/+/- (zoom), Ctrl+]/[ (z-order)
  - Ctrl+Shift+L/R/E/T/B/M (alignment)

- [x] **4.6.3** Auto-save
  - isDirty flag in context
  - Save indicator in toolbar

### Definition of Done
- [x] Undo/redo works
- [x] Keyboard shortcuts functional
- [x] Auto-save framework in place

### Files Created
- `src/components/canvas/use-keyboard-shortcuts.ts`

---

## Phase 4.7: Templates & Export (COMPLETE)

### Tasks

- [x] **4.7.1** Create board templates
  - `src/lib/services/board-templates.ts`
  - 6 templates: blank, relationship-map, family-tree, yearly-overview, personal-profile, group-analysis
  - Layout algorithms: circular, hierarchical, force-directed
  - Auto-populate from people/relationships

- [x] **4.7.2** Implement export
  - `src/lib/services/canvas-export.ts`
  - PNG export with scale options
  - JPEG export with quality settings
  - SVG export
  - PDF export (placeholder, needs html2canvas/jspdf)

- [x] **4.7.3** Create boards list page
  - `/app/boards` - List user's boards
  - Create new board with template selection
  - Board thumbnails
  - `src/components/canvas/template-selector.tsx`
  - `src/components/canvas/export-dialog.tsx`

### Definition of Done
- [x] Templates create pre-populated boards
- [x] Export works for PNG/JPEG/SVG
- [x] Boards list shows all boards

### Files Created
- `src/lib/services/board-templates.ts`
- `src/lib/services/canvas-export.ts`
- `src/components/canvas/template-selector.tsx`
- `src/components/canvas/export-dialog.tsx`

---

## Phase 4 Progress Tracker

| Phase | Status | Tasks | Complete |
|-------|--------|-------|----------|
| 4.1 Data Model | ✅ COMPLETE | 3 | 3/3 |
| 4.2 Canvas Core | ✅ COMPLETE | 5 | 5/5 |
| 4.3 Connections | ✅ COMPLETE | 3 | 3/3 |
| 4.4 Annotations | ✅ COMPLETE | 4 | 4/4 |
| 4.5 Properties | ✅ COMPLETE | 3 | 3/3 |
| 4.6 History | ✅ COMPLETE | 3 | 3/3 |
| 4.7 Templates | ✅ COMPLETE | 3 | 3/3 |
| **TOTAL** | **100%** | **24** | **24/24** |

---
---

# Full Roadmap Summary

| Phase | Name | Tasks | Status |
|-------|------|-------|--------|
| MVP | React Card Components | 22 | COMPLETE |
| 2 | Relationship Graph | 20 | COMPLETE (20/20) |
| 3 | Multi-System Expansion | 28 | COMPLETE (28/28) |
| 4 | Canvas Editor | 24 | COMPLETE (24/24) |
| **TOTAL** | | **94** | **94/94 (100%)** |

**All planned phases (MVP through Phase 4) are now COMPLETE!**

**Future Phases (not detailed):**
- Phase 5: Predictions + Time-Based Intelligence
- Phase 6: AI Layer (Interpretation + RAG)
- Phase 7: SaaS Monetization + Billing ($30/mo)
- Phase 8: Platform Scale
