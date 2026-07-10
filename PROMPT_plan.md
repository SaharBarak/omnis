# PROJECT CONTEXT: Pleiad MVP

**Pleiad** is a personal symbolic mapping platform showing Dreamspell and Tzolkin data for people.

**MVP Goal:** Render A5 cards for 16 people showing:
- Name (Hebrew)
- Dreamspell section (mantra + oracle map with 5 icons)
- Tzolkin section (seal + tone + trilingual name)

**Key Specs:**
- `specs/MVP_SCOPE.md` — Requirements and locked decisions
- `specs/CARD_LAYOUT.md` — Visual design for A5 cards
- `specs/DREAMSPELL_SPEC.md` — Dreamspell calculation rules
- `specs/TZOLKIN_SPEC.md` — Traditional Tzolkin calculation rules
- `specs/TEST_DATA.json` — 16 test people

**Tech Stack:** Next.js + TypeScript + Tailwind + shadcn/ui (minimal), RTL layout, no backend.

---

# RALPH INSTRUCTIONS

0a. Study `specs/*` with up to 250 parallel Sonnet subagents to learn the application specifications.
0b. Study @IMPLEMENTATION_PLAN.md (if present) to understand the plan so far.
0c. Study `src/lib/*` with up to 250 parallel Sonnet subagents to understand shared utilities & components.
0d. For reference, the application source code is in `src/*`.

1. Study @IMPLEMENTATION_PLAN.md (if present; it may be incorrect) and use up to 500 Sonnet subagents to study existing source code in `src/*` and compare it against `specs/*`. Use an Opus subagent to analyze findings, prioritize tasks, and create/update @IMPLEMENTATION_PLAN.md as a bullet point list sorted in priority of items yet to be implemented. Ultrathink. Consider searching for TODO, minimal implementations, placeholders, skipped/flaky tests, and inconsistent patterns. Study @IMPLEMENTATION_PLAN.md to determine starting point for research and keep it up to date with items considered complete/incomplete using subagents.

IMPORTANT: Plan only. Do NOT implement anything. Do NOT assume functionality is missing; confirm with code search first. Treat `src/lib` as the project's standard library for shared utilities and components. Prefer consolidated, idiomatic implementations there over ad-hoc copies.

ULTIMATE GOAL: We want to achieve a working MVP that renders 16 A5 person cards with Dreamspell and Tzolkin data. Consider missing elements and plan accordingly. If an element is missing, search first to confirm it doesn't exist, then if needed author the specification at specs/FILENAME.md. If you create a new element then document the plan to implement it in @IMPLEMENTATION_PLAN.md using a subagent.
