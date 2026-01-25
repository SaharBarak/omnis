# Omnis MVP Implementation Plan

> **Status:** COMPLETE - All Phases Implemented
> **Last Updated:** 2026-01-25
> **Goal:** Full-featured symbolic systems platform with 6 calculation systems

---

## Executive Summary

The Omnis platform provides **16 printable A5 person cards** displaying:
- Person name (Hebrew)
- Dreamspell section: mantra + oracle map (5 icons in cross pattern)
- Tzolkin section: seal + tone + trilingual name

### Current State Overview

| Category | Status | Notes |
|----------|--------|-------|
| **Calculation Logic** | COMPLETE | 418 tests passing (all systems) |
| **Icon Assets** | COMPLETE | 40 SVGs (20 Dreamspell + 20 Tzolkin) |
| **Core Types** | COMPLETE | Branded types Kin, SealNumber, ToneNumber, JulianDay |
| **Phase 1-4** | COMPLETE | Infrastructure, Relationships, Multi-System, Canvas |
| **Design System** | COMPLETE | Birth data input, dashboard redesign, cosmic palette |
| **Landing Page** | COMPLETE | Public routes, email infrastructure, SEO |
| **Authentic Data** | COMPLETE | Dreamspell mantras, wavespells, castles |
| **English-First UI** | COMPLETE | All display components translated |

---

## COMPLETED PHASES SUMMARY

### MVP: React Card Components (COMPLETE)
- 7 React card components in `src/components/cards/`
- Cards page route at `/app/cards`
- Print CSS for A5 layout
- Navigation with Hebrew labels

### Phase 2: Relationship Graph + Group Analysis (COMPLETE)
- Relationship data model with database tables
- CRUD UI for relationships and groups
- Network graph visualization with react-force-graph-2d
- Group analysis with compatibility calculations
- Share functionality with public links

### Phase 3: Multi-System Expansion (COMPLETE)
- Dreamspell full depth (wavespells, castles, yearly cycles)
- Mayan Long Count with Haab and Calendar Round
- Astrology natal charts with circular-natal-horoscope-js
- Human Design bodygraph calculations
- Gematria with 7 calculation methods
- Cross-system insights and integration

### Phase 4: Canvas Editor + Full Dashboard (COMPLETE)
- Board data model with @xyflow/react
- Canvas with drag, zoom, pan, layers
- Custom node types (person, text, shape, sticky, etc.)
- Connections with 4 edge types
- Properties panel and keyboard shortcuts
- Templates and PNG/JPEG/SVG export

### Phase DS: Design System & UX (COMPLETE)
- Birth time/place input components
- Cosmic dark palette with gold accents
- Dashboard with Today's Kin display
- Typography scale with Cinzel font

### Phase LP: Landing Page (COMPLETE)
- Hero section with starfield background
- Interactive kin calculator demo
- Free value routes (/today, /calculate, /learn/*, /compatibility)
- Email infrastructure with Resend
- Vercel cron for daily kin emails
- SEO and analytics integration

### Phase AD: Authentic Data (COMPLETE)
- 260 authentic Dreamspell affirmations
- 20 wavespells with themes and journeys
- 5 castles with colors and directions

### Polish: English-First UI (COMPLETE)
- All 9 display components translated to English-first pattern

---

## P2: Can Defer (Post-MVP)

### P2.1: Authentic Mantras Enhancement
- Source additional authentic mantras from Dreamspell Kit
- Translate mantras to Hebrew
- Create expanded `mantras-full.ts` with complete data

### P2.2: PDF Export Enhancement
- Full PDF export (current: falls back to PNG)
- Implement html2canvas + jspdf for direct PDF download

---

## Future Phases (not detailed)

| Phase | Name | Description |
|-------|------|-------------|
| 5 | Predictions + Time-Based Intelligence | Forecasts and cycle tracking |
| 6 | AI Layer | Interpretation + RAG for insights |
| 7 | SaaS Monetization | Billing at $30/mo |
| 8 | Platform Scale | Enterprise features |

---

## Commands

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run test          # Run calculation tests (418+ tests)
npm run typecheck     # TypeScript type checking
```

---

## File Structure

```
src/
├── components/
│   ├── cards/                      # Card display components (16 total)
│   │   ├── index.ts                # Barrel exports
│   │   ├── SealIcon.tsx            # SVG wrapper
│   │   ├── OracleMap.tsx           # 5-icon cross pattern
│   │   ├── MantraDisplay.tsx       # Bilingual text
│   │   ├── DreamspellSection.tsx   # Section wrapper
│   │   ├── TzolkinSection.tsx      # Sign + tone display
│   │   ├── PersonCard.tsx          # A5 container
│   │   ├── CardGrid.tsx            # Multi-card layout
│   │   ├── AstrologyDisplay.tsx    # Natal chart display
│   │   ├── HumanDesignDisplay.tsx  # Bodygraph display
│   │   ├── GematriaDisplay.tsx     # Hebrew gematria
│   │   ├── LongCountDisplay.tsx    # Mayan Long Count
│   │   ├── WavespellDisplay.tsx    # Wavespell visualization
│   │   ├── CastleDisplay.tsx       # Castle display
│   │   └── CrossSystemInsights.tsx # Cross-system patterns
│   ├── canvas/                     # Canvas editor components
│   ├── landing/                    # Landing page components
│   └── ui/                         # shadcn/ui components
├── app/
│   ├── globals.css                 # Design system + print CSS
│   ├── page.tsx                    # Landing page
│   ├── (app)/                      # Authenticated routes
│   │   ├── layout.tsx              # App layout with navigation
│   │   ├── page.tsx                # Dashboard
│   │   ├── cards/page.tsx          # A5 card rendering
│   │   ├── people/                 # People CRUD
│   │   ├── relationships/          # Relationships CRUD
│   │   ├── groups/                 # Groups + analysis
│   │   ├── graph/                  # Network visualization
│   │   ├── boards/                 # Canvas editor
│   │   ├── predictions/            # Forecasts
│   │   └── settings/               # System preferences
│   ├── today/                      # Public: Daily Kin
│   ├── calculate/                  # Public: Kin Calculator
│   ├── learn/                      # Public: Educational content
│   ├── compatibility/              # Public: Relationship check
│   ├── terms/                      # Terms of Service
│   └── privacy/                    # Privacy Policy
├── lib/
│   ├── calculations/               # All calculation engines
│   │   ├── dreamspell.ts           # Dreamspell (leap day skip)
│   │   ├── tzolkin.ts              # Traditional Tzolkin
│   │   ├── long-count.ts           # Mayan Long Count
│   │   ├── astrology.ts            # Natal charts
│   │   ├── human-design.ts         # Bodygraph
│   │   ├── gematria.ts             # Hebrew gematria
│   │   ├── wavespell.ts            # Wavespell cycles
│   │   ├── cycles.ts               # Castles, harmonics
│   │   └── yearly.ts               # Galactic birthdays
│   ├── data/                       # Static data tables
│   │   ├── seals.ts                # 20 seals with Hebrew
│   │   ├── tones.ts                # 13 tones with Hebrew
│   │   ├── tzolkin-signs.ts        # 20 signs with Hebrew
│   │   ├── mantras.ts              # Authentic affirmations
│   │   ├── wavespells.ts           # 20 wavespells
│   │   ├── castles.ts              # 5 castles
│   │   ├── zodiac-signs.ts         # 12 zodiac signs
│   │   ├── planets.ts              # Astrological planets
│   │   ├── human-design-gates.ts   # 64 I Ching gates
│   │   └── hebrew-letters.ts       # 27 Hebrew letters
│   ├── hooks/                      # React hooks
│   │   ├── use-auth.ts             # Authentication
│   │   ├── use-people.ts           # People CRUD
│   │   ├── use-relationships.ts    # Relationships
│   │   ├── use-groups.ts           # Groups
│   │   ├── use-boards.ts           # Canvas boards
│   │   └── use-computed-results.ts # Cached calculations
│   ├── services/                   # Business logic
│   │   ├── compatibility.ts        # Relationship compatibility
│   │   ├── group-analysis.ts       # Group dynamics
│   │   ├── board-templates.ts      # Canvas templates
│   │   └── canvas-export.ts        # Export functionality
│   └── types/                      # TypeScript definitions
│       ├── seal.ts, tone.ts        # Dreamspell types
│       ├── astrology.ts            # Astrology types
│       ├── human-design.ts         # Human Design types
│       ├── gematria.ts             # Gematria types
│       ├── relationship.ts         # Relationship types
│       └── board.ts                # Canvas board types

supabase/migrations/
├── 00001_initial_schema.sql        # People, auth
├── 00002_relationships_schema.sql  # Relationships, groups, shares
└── 00003_boards_schema.sql         # Canvas boards
```

---

## Definition of Done

The MVP is **DONE** when:

### Core Requirements (ALL MET)
- [x] Cards page renders at `/app/cards`
- [x] Page displays one A5 card per person (16 cards total)
- [x] Navigation link exists in sidebar

### Per-Card Requirements (ALL MET)
- [x] Name displayed (Hebrew, bold, centered)
- [x] Dreamspell section with oracle map and mantra
- [x] Tzolkin section with day sign and tone
- [x] Trilingual display (Yucatec - English - Hebrew)

### Technical Requirements (ALL MET)
- [x] All 40 icons load from local SVG files
- [x] RTL layout (Hebrew primary)
- [x] No runtime errors
- [x] TypeScript clean (strict mode)
- [x] Print CSS produces proper A5 layout
- [x] 418 tests passing

---

## VERIFICATION RESULTS (2026-01-25)

### Code Quality Metrics

| Metric | Result | Status |
|--------|--------|--------|
| TODO comments | 0 found | Clean |
| FIXME comments | 0 found | Clean |
| Test count | 418 passing | Exceeds plan |
| TypeScript errors | 0 | Clean |

### Route Verification

| Route | Status |
|-------|--------|
| /app (dashboard) | Exists |
| /app/cards | Exists |
| /app/people | Exists |
| /app/relationships | Exists |
| /app/groups | Exists |
| /app/graph | Exists |
| /app/boards | Exists |
| /app/profile | Exists |
| /app/settings | Exists |
| /app/predictions | Exists |
| /today | Exists |
| /calculate | Exists |
| /learn/* | Exists |
| /compatibility | Exists |
| /terms | Exists |
| /privacy | Exists |

---

## References

- `/specs/MVP_SCOPE.md` - MVP requirements
- `/specs/CARD_LAYOUT.md` - A5 card visual spec
- `/specs/DREAMSPELL_SPEC.md` - Calculation details + Hebrew translations
- `/specs/TZOLKIN_SPEC.md` - Tzolkin system details
- `/specs/DESIGN_SYSTEM.md` - Design system specification
- `/specs/I18N_ENGLISH_FIRST.md` - Translation patterns
