# Omnis Implementation Plan

> **Status:** PHASES 0-6 COMPLETE — READY FOR PRODUCTION
> **Last Updated:** 2026-01-30
> **Goal:** Full-featured symbolic systems platform with 6 calculation systems

---

## Executive Summary

The Omnis platform is a complete symbolic systems web application featuring:
- **6 calculation systems:** Dreamspell, Tzolkin, Long Count, Human Design, Astrology, Gematria
- **User management:** OAuth authentication (Google, Apple, Email Magic Link), profiles, onboarding
- **People directory:** CRUD operations, tags, search, computed results caching
- **Relationships & Groups:** Graph visualization, compatibility analysis, group dynamics
- **Canvas editor:** Drag-and-drop boards, templates, PNG/SVG export
- **Predictions:** Daily/weekly/monthly forecasts, timelines, notifications
- **AI interpretations:** Claude-powered insights per person, relationship, group

### Current State

| Category | Status | Notes |
|----------|--------|-------|
| **MVP Functionality** | COMPLETE | All 16 cards render correctly |
| **Build Status** | PASSING | Production build succeeds |
| **TypeScript** | CLEAN | No type errors |
| **Tests** | 484 PASSING | All calculation tests pass |

---

## P0: Critical Blockers - RESOLVED

### P0.1: Auth Callback Route Conflict ✓ FIXED
**Solution Applied:** Deleted `page.tsx`, kept only `route.ts` (server-side redirect handles all cases).

### P0.2: TypeScript Strict Mode Violations ✓ FIXED
**Solution Applied:** Added `CookieOptions` type import and `CookieToSet` type alias to `route.ts`.

---

## P1: Important - RESOLVED

### P1.1: Settings Page Placeholder ✓ FIXED
**Solution Applied:** Implemented Display Settings with language (Hebrew/English) and timezone selection using Radix Select component.

### P1.2: Documentation Accuracy ✓ FIXED
**Solution Applied:** Test count corrected to 484 tests across 15 test files.

---

## P2: Post-MVP Enhancements

### P2.1: Test Coverage Expansion
Current: 484 tests covering calculation engines only.

**Missing test coverage:**
- Services (8 files): `compatibility.ts`, `group-analysis.ts`, `canvas-export.ts`, etc.
- Hooks (9 files): `use-people.ts`, `use-boards.ts`, `use-auth.ts`, etc.
- Components (16+ files): `PersonCard.tsx`, `OracleMap.tsx`, etc.

### P2.2: Specification Cleanup
3 spec files marked TODO (intentionally deferred post-MVP):
- `/specs/DESIGN_SYSTEM.md` - Future design system details
- `/specs/LANDING_PAGE.md` - Future landing page enhancements
- `/specs/AUTHENTIC_DATA.md` - Future authentic mantra sourcing

### P2.3: PDF Export Enhancement
Current: Falls back to PNG for export.
Future: Implement `html2canvas` + `jspdf` for direct PDF download.

### P2.4: Authentic Mantras
- Source additional authentic mantras from Dreamspell Kit
- Translate mantras to Hebrew
- Create expanded `mantras-full.ts` with complete data

---

## Completed Phases

| Phase | Name | Status |
|-------|------|--------|
| 0 (MVP) | A5 Card Components | COMPLETE |
| 1 | Core Web App (Accounts + Persistence) | COMPLETE |
| 2 | Relationship Graph + Groups | COMPLETE |
| 3 | Multi-System Expansion | COMPLETE |
| 4 | Canvas Editor + Dashboard | COMPLETE |
| 5 | Predictions + Time Intelligence | COMPLETE |
| 6 | AI Layer | COMPLETE |
| DS | Design System & UX | COMPLETE |
| LP | Landing Page | COMPLETE |
| AD | Authentic Data | COMPLETE |
| UI | English-First Translation | COMPLETE |

---

## Future Phases (Not Started)

| Phase | Name | Description |
|-------|------|-------------|
| 7 | SaaS Monetization | Billing at $30/mo |
| 8 | Platform Scale | Enterprise features |

---

## Commands

```bash
npm run dev           # Start dev server
npm run build         # Production build (PASSING)
npm run test          # Run tests (484 tests)
npm run typecheck     # TypeScript check (CLEAN)
```

---

## Definition of Done

### Core Requirements (ALL MET)
- [x] Cards page renders at `/app/cards`
- [x] Page displays one A5 card per person (16 cards total)
- [x] Navigation link exists in sidebar

### Per-Card Requirements (ALL MET)
- [x] Name displayed (Hebrew, bold, centered)
- [x] Dreamspell section with oracle map and mantra
- [x] Tzolkin section with day sign and tone
- [x] Trilingual display (Yucatec - English - Hebrew)

### Technical Requirements
- [x] All 40 icons load from local SVG files
- [x] RTL layout (Hebrew primary)
- [x] No runtime errors
- [x] TypeScript clean (strict mode)
- [x] Print CSS produces proper A5 layout
- [x] 484 tests passing
- [x] Production build succeeds

---

## Resolution Priority - ALL COMPLETE

1. ~~**Fix P0.1** (route conflict)~~ ✓ DONE
2. ~~**Fix P0.2** (TypeScript types)~~ ✓ DONE
3. ~~**Verify build**~~ ✓ DONE - `npm run build` and `npm run typecheck` both pass
4. **Deploy** - MVP is now deployable

---

## References

- `/specs/MVP_SCOPE.md` - MVP requirements
- `/specs/CARD_LAYOUT.md` - A5 card visual spec
- `/specs/DREAMSPELL_SPEC.md` - Calculation details + Hebrew translations
- `/specs/TZOLKIN_SPEC.md` - Tzolkin system details
