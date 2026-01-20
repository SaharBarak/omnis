# Omnis Feature Roadmap

## Phase 0 — MVP (Simple A5 Pages)

**Goal:** Generate clean A5 "cards" per person, deterministic, no accounts required (or minimal).

### Features
- Person list input (name + birth date)
- A5 card renderer (screen-first)
- **Dreamspell section:**
  - Kin / primary sign
  - Mantra text
  - "Map" with 4 related symbols (oracle roles) + icons
- **Tzolkin section:**
  - Sign icon
  - Bilingual name (e.g., Imix — Crocodile/Dragon)
- **Asset pipeline:**
  - Complete icon set stored locally (SVG preferred)
  - Deterministic mapping tables (source-of-truth JSON/TS)
- Export (optional MVP+): print CSS / "Save as PDF" friendly layout

---

## Phase 1 — Core Web App (Accounts + Persistence)

**Goal:** Turn cards into a usable product with saved profiles.

### Features
- OAuth login
- **Profile management:**
  - Birth date, optional time + place
- **People directory:**
  - Add/edit/remove people
  - Tags (family / friends / partners)
- **Saved outputs:**
  - Store computed system results per person
  - Version results when algorithms change
- **Basic dashboard shell:**
  - Sidebar (systems)
  - Tabs (contexts)
  - Main canvas container

---

## Phase 2 — Relationship Graph + Group Analysis

**Goal:** "People + connections" becomes the product.

### Features
- **Relationship modeling:**
  - Parents, siblings, partners, kids, close friends
  - Relationship types, weights, notes
- **Network visualization:**
  - Graph view (nodes/edges), zoom/pan
  - Filters (family only, partners, etc.)
- **Group analysis:**
  - Compatibility/harmony overlays (per system)
  - "Cluster" detection (who resonates with whom)
  - Group summaries (household/team/friend-group)
- **Sharing:**
  - Private share links
  - Group invites

---

## Phase 3 — Multi-System Expansion

**Goal:** Unify the full set of systems under one UI/ontology.

### Systems
- **Dreamspell (full depth):**
  - Oracle roles, wavespells, cycles, yearly kin, etc.
- **Tzolkin (full depth):**
  - Tone + seal, daykeepers, cycles
- **Mayan Long Count:**
  - Conversion + timelines + key dates
- **Human Design:**
  - Bodygraph computation (requires time/place accuracy)
  - Charts for related people (parents/partner/kids)
- **Astrology:**
  - Natal chart + houses/aspects
  - Transits ("current sky") overlays
- **Gematria:**
  - Multiple methods, transliterations, alias handling
  - Name-network correlations

---

## Phase 4 — Canvas Editor + "Full Dashboard"

**Goal:** Move from "viewer" to "creator tool."

### Features
- **Full editor dashboard:**
  - Draggable nodes
  - Layer toggles (systems as layers)
  - Saved "boards" / "maps"
  - Annotations, highlights, pinned insights
- **Templates:**
  - "Relationship map"
  - "Family pattern map"
  - "Yearly overview"
- **Export:**
  - PDF export
  - Image export
  - Shareable interactive boards

---

## Phase 5 — Predictions + Time-Based Intelligence

**Goal:** Forecasting becomes a paid retention driver (but must be handled carefully).

### Features
- **Astrology transits & cycles:**
  - Daily/weekly/monthly outlook
- Dreamspell wave forecasts / cycles
- Human Design transits (if supported)
- **Personal timeline:**
  - Key windows
  - "Themes of the week"
- **Notifications:**
  - Opt-in reminders
  - Calendar-like schedule integration (optional)

---

## Phase 6 — AI Layer (Interpretation + RAG)

**Goal:** AI is augmentation, not source of truth.

### Features
- **AI interpretations per system:**
  - Per person
  - Per relationship
  - Per group
- **"Ask Omnis" chat:**
  - Grounded in your computed data
- **RAG:**
  - Curated corpus (your notes + selected sources)
  - Citations/attribution where possible
- **Cost control:**
  - Caching
  - Quotas per plan
  - User-triggered generation
- **Safety/ethics controls:**
  - Disclaimers
  - "No medical/legal certainty" policies
  - Sensitive-content guardrails

---

## Phase 7 — SaaS Monetization + Billing ($30/mo)

**Goal:** Real business.

### Features
- **Billing:**
  - Subscriptions ($30/mo)
  - Trials
  - Cancellation flows
- **Feature gating:**
  - Free: limited people/cards, limited exports
  - Paid: unlimited people, group analysis, AI credits, forecasts, boards
- **Admin:**
  - Usage analytics
  - Abuse prevention
  - Support tools
- **Reliability:**
  - Rate limiting
  - Observability
  - Backups

---

## Phase 8 — Platform Scale

**Goal:** Organizations + communities.

### Features
- Team workspaces (households/teams)
- Role-based access
- Shared boards
- Group reports
- API access (maybe)
- **Marketplace (optional):**
  - Templates
  - Curated interpretations
  - Practitioner workflows (high-risk, adds complexity)
