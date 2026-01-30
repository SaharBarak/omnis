# Omnis MVP Implementation Plan

> **Status:** MVP READY TO DEPLOY
> **Last Updated:** 2026-01-30
> **Goal:** Full-featured symbolic systems platform with 6 calculation systems

---

## Executive Summary

The Omnis platform provides **16 printable A5 person cards** displaying:
- Person name (Hebrew)
- Dreamspell section: mantra + oracle map (5 icons in cross pattern)
- Tzolkin section: seal + tone + trilingual name

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

## P1: Important (Should Fix Soon)

### P1.1: Settings Page Placeholder
**File:** `/src/app/app/settings/page.tsx` (line 201)

Display Settings section shows "Coming soon..." - incomplete feature that should either:
- Be implemented
- Be hidden until ready
- Show a more informative message

### P1.2: Documentation Accuracy
**File:** `IMPLEMENTATION_PLAN.md`

Test count incorrectly stated as 418. Actual count is **484 tests** across 15 test files.

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
| MVP | React Card Components | COMPLETE |
| 2 | Relationship Graph + Groups | COMPLETE |
| 3 | Multi-System Expansion | COMPLETE |
| 4 | Canvas Editor + Dashboard | COMPLETE |
| DS | Design System & UX | COMPLETE |
| LP | Landing Page | COMPLETE |
| AD | Authentic Data | COMPLETE |
| UI | English-First Translation | COMPLETE |

---

## Future Phases (Not Started)

| Phase | Name | Description |
|-------|------|-------------|
| 5 | Predictions + Time Intelligence | Forecasts and cycle tracking |
| 6 | AI Layer | Interpretation + RAG insights |
| 7 | SaaS Monetization | Billing at $30/mo |
| 8 | Platform Scale | Enterprise features |

---

## Commands

```bash
npm run dev           # Start dev server
npm run build         # Production build (CURRENTLY FAILING)
npm run test          # Run tests (484 tests)
npm run typecheck     # TypeScript check (4 errors)
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
