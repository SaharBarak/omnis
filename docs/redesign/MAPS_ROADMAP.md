# Maps Roadmap — Proposed Views (2026-07-05)

Research pass: which new "maps" to add on top of the relationship graph.
Grounded in existing engines (most are computed but unvisualized) + a
survey of adjacent products (astro-seek, AstroMatrix, Maia Mechanics,
bodygraph.io, Human Design Hub, Jovian Archive).

Key finding: the five-system pairwise compatibility engine
(src/lib/services/compatibility.ts) and the full HD connection-chart
engine (hd-compatibility.ts — electromagnetic/companionship/dominance/
compromise) are complete and have ZERO visualization. Nobody in the
market has a multi-person compatibility matrix. Per-person depth maps
(NatalChartWheel, BodygraphChart) already exist on person detail.

## Ranked

1. **Resonance Matrix** (S-M) — BUILD FIRST. N×N heatmap of everyone in
   the library, cell = five-system compatibility score; click → per-
   system breakdown. Second view mode on /app/graph (Map ↔ Matrix) +
   embed in group analysis. Engine done: calculateFiveSystemCompatibility
   (today only reachable from the anonymous 2-birthdate page). Needs a
   fan-out API route, cacheable in computed_results. Turns the graph
   from self-reported edges into a computed map. Open market ground.
2. **Composite Bodygraph / Group Penta** (M) — BUILD FIRST. Pair mode:
   two bodygraphs overlaid, channels colored by connection type (the
   "electromagnetic channels" promise in MAIN_PURPOSE, invisible today).
   Group mode (3-5): the Penta — what the group defines that no
   individual has. BodygraphChart + calculateHDCompatibility exist; pair
   mode is wiring + color layer; Penta = small union-of-gates aggregator.
   Drill-down from matrix cells + tab in group analysis.
3. **Circle Calendar** (M) — year-wheel (or 260-day spiral) with every
   person at their birthday + computed events (galactic birthdays/
   returns, tun/katun, calendar-round). Natural home for the queued
   **Moon Map** (natal phase per person as ring, current phase cursor —
   today-board moonPhase needs upgrade to proper lunation calc for natal).
   New /app/calendar. Strongest retention surface. Explorer+ gate.
4. **Tzolkin Galaxy** (M) — interactive 13×20 Tzolkin grid, today's kin
   glowing, people pinned on birth kins, wavespells shaded, castles as
   regions, GAP kins marked; hover → oracle resonances in your circle.
   Zero new math (cycles/wavespell/oracle all built). Iconic, shareable;
   simplified anon version on /learn/tzolkin as funnel asset.
5. **Wavespell Ribbon** (S) — 13-day pulse strip on the dashboard, each
   person's role tone marked, day cursor moving. Cheapest ambient
   "living map" signal; compounds with Circle Calendar.
6. **Synastry Wheel** (M) — classic bi-wheel + aspect grid from
   calculateSynastryCompatibility + a dual-ring NatalChartWheel
   extension. Parity feature (credibility with astrology-literate
   users); also upgrades the public /compatibility funnel page.
7. **Life Spiral** (M) — 52-year cycle spiral per person; visual
   identity for the paid timeline entitlement (replaces the list-based
   PredictionTimeline). getPersonalTimeline/cycle fns all built.
8. **Name Constellation** (S) — group gematria as constellation (nodes
   sized by value, clustered by digital root, notable-number edges).
   Completes "all systems mapped"; lowest thesis weight.

Cut line: biorhythms etc. — belongs to none of the six systems, reads
as gimmick.

## Sequence logic

Matrix shows **who**, Composite shows **why**, Circle Calendar + Moon
Map show **when**. Build 1 → 2 → 3(+moon) → 4; 5-8 opportunistic.
