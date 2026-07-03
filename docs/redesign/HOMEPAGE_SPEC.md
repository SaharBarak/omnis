# Omnis Homepage — Copy, Composition & Structure

Derived from MAIN_PURPOSE.md (the map is the lead) and DESIGN_LANGUAGE.md
(Railway-grade long-canvas composition, cosmic pilgrimage, folklore zones).

## The structural idea

Railway assigns each scroll zone a *product capability*. We do the same —
and each capability zone wears the folklore skin of the system that best
embodies it. Five features × five flavors, one page:

| # | Zone (capability) | Folklore flavor | Why this pairing |
|---|---|---|---|
| 1 | Chart yourself | **Astrology** — star atlas | the natal chart is the archetypal "reading" |
| 2 | Your people, remembered | **Tzolkin** — codex/stone | codices were humanity's first records; persistence = record-keeping |
| 3 | The map | **Dreamspell** — galactic web | kin, oracles, wavespells = a web of connections |
| 4 | Group dynamics | **Human Design** — circuits | channels/electromagnetics literally model energy *between* people |
| 5 | Give a map | **Kabbalah** — letters/scrolls | sending letters; words as gifts of creation |

One continuous mural: cosmos at top descending zone-by-zone into parchment;
thread of light + traveler glyph ride the whole way down.

---

## Full page structure + copy deck

### 0. Nav
Logo · Product ▾ · Knowledge (→ /learn) · Pricing · — · Sign in · **Start your map**

### 1. Hero (mural top: cosmic sky)
- Eyebrow (mono, small): `FIVE WISDOM SYSTEMS · ONE LIVING MAP`
- H1 (serif display):
  **See the hidden dynamics of your people**
- Sub: Omnis reads everyone in your life through Astrology, Dreamspell,
  Tzolkin, Human Design, and Kabbalah — then maps the connections between
  them. Enter a birthday once. Keep the insight forever.
- CTA primary: **Start your map →** (→ signup; anon fallback /calculate)
- CTA secondary: **Explore the knowledge** (→ /learn)
- Floating UI (Railway-canvas equivalent): **the live relationship graph** —
  6–8 person nodes, five-colored connection lines pulsing, one node opens a
  five-system mini reading. Real component, demo data.

### 2. Proof strip (mural: horizon)
Replaces Railway's logo wall. A quiet band of five system sigils
(star wheel · seal · glyph · bodygraph · aleph) with the line:
*Five traditions, thousands of years old. One interface.*

### 3. Zone 1 — Chart yourself 〔Astrology / star atlas〕
- Pill: `Begin with you`
- H2 (serif): **One birth. Five readings.**
- Prose: Your natal chart, galactic signature, day sign, bodygraph, and
  name numerology — computed together, on one screen. What took five
  websites now takes one birthday.
- Embed: PersonDetailView tabs cycling live (Astrology wheel → seal → glyph
  → bodygraph → gematria).
- Triad: Precise engines (real ephemeris, real Long Count math) · Layered or
  side-by-side · AI interpretation grounded in the knowledge base
- Lineage row: *As kept in tradition:* Uranographia atlases · ephemerides ·
  the Ra Uru Hu synthesis → "Learn astrology →" (/learn/astrology)

### 4. Zone 2 — Your people, remembered 〔Tzolkin / codex〕
- Pill: `Never ask twice`
- H2: **Enter a birthday once. It's yours forever.**
- Prose: Everyone you chart joins your private codex — birth time, place,
  name, all readings. Ten years from now, one tap re-opens the full picture.
  No more texting friends for their birth time. Again.
- Embed: people library UI — search, tags, instant re-open of a saved person.
- Triad: Private by default (owner-scoped, always) · Reusable in any map or
  group · Synced across devices
- Lineage: *The Maya kept day-counts on bark paper for centuries. Yours are
  safer.* → "Learn the Tzolkin →"

### 5. Zone 3 — The map 〔Dreamspell / galactic web〕  ← CENTERPIECE
- Pill: `The living map`
- H2: **Your people, connected**
- Prose: Every person becomes a node. Omnis draws the lines — synastry,
  kin resonance, type mechanics, name harmonics — and scores each bond
  across all five systems. Watch the geometry of your life appear.
- Embed: full-width force graph — the biggest UI moment on the page.
  Nodes glow with seal colors; hovering an edge shows its five-system score.
- Triad: Compatibility across five systems · See clusters and bridges ·
  Every connection explainable — tap an edge, read why
- Lineage: *In the Dreamspell, no kin stands alone — every sign has its
  guide, its antipode, its occult ally.* → "Learn the Dreamspell →"

### 6. Zone 4 — Group dynamics 〔Human Design / circuitry〕
- Pill: `Circles, decoded`
- H2: **Why your family feels different from your team**
- Prose: Select any circle — family, band, startup, chosen family — and
  read its dynamic through one system at a time, or all five fused. Omnis
  shows each group's nature: where energy flows, where it jams, who holds
  the center.
- Embed: group analysis view — layer toggles (per-system) + "fuse all" mode.
- Triad: Layered analysis (one lens at a time) · Five-system fusion ·
  Electromagnetic pairs, missing centers, group kin
- Lineage: *Human Design maps the circuitry between bodies — the channels
  that only exist when two people stand together.* → "Learn Human Design →"

### 7. Zone 5 — Give a map 〔Kabbalah / letters & scrolls〕
- Pill: `Made to be given`
- H2: **Make someone's map. Send it like a letter.**
- Prose: Build a map for your mother's family or your best friend's new
  team, and send it — a living link, beautiful on any device. Invite
  collaborators into your own maps to explore together.
- Embed: share dialog + public share page preview (the /share/[token] view).
- Triad: Shareable living links · Collaborators, read-only or working ·
  A reading is the oldest gift
- Lineage: *In Kabbalah the letters themselves create — to send a word is
  to send a world.* → "Learn Gematria →"

### 8. Knowledge band (bridging section, all five flavors braided)
- H2 (center, serif): **Backed by a real body of knowledge**
- Prose: Every number on the map traces back to sources — five curated,
  searchable guides, each written in the voice of its tradition.
- Embed: knowledge search bar (live vector search) + five flavored doc
  portals.
- CTA: **Enter the library →** (/learn)

### 9. Social proof
- H2: **Trusted by readers and their circles**
- 3 testimonial cards (grid-paper texture) + marquee of short quotes.

### 10. Set piece — the Today board (split-flap)
- H2: **Today, across the systems** — sub: live now, for everyone at once.
- Split-flap board (CSS 3D): `KIN 113 · MOON WAXING GIBBOUS · SUN 12° CANCER
  · GATE 52.4 · 17 TAMMUZ` (real data, flips on load; today endpoint).
- Footer line of board: *(and counting — the calendars never stop)*

### 11. Pricing
- H2: **Start free. Grow your map when it grows on you.**
- Three cards: Free (you + a few people) · Complete $9 (unlimited people,
  full readings, AI) · Practitioner $29 (collaboration, client maps,
  exports). Quiet dark ground, gold accent on recommended.

### 12. FAQ (existing content, restyled)

### 13. Portal CTA (mural bottom: parchment ground, doorway)
- Doorway card glowing with dawn light:
- H2 (serif): **Your map is waiting**
- Sub: Begin with your own birthday. The rest of your world follows.
- Button (pill, gold): **Open the map**

### 14. Footer
Columns: Product / Knowledge / Company / Legal + featured cards.
Bottom line (mono, live): `TODAY: KIN 113 · 17 TAMMUZ 5786 — the calendars
are counting`

---

## Copy voice rules

- Serif headlines: short, declarative, human. No mysticism-kitsch
  ("unlock your destiny" ist verboten), no SaaS-speak ("supercharge").
- The product does the magic; copy stays calm and concrete
  (Railway's trick: "Ship software peacefully").
- Persistence copy is allowed to be funny-dry ("No more texting friends for
  their birth time. Again.") — it's the most relatable pain.
- Every zone ends by feeding the knowledge base (trust loop).

## What leaves the current homepage

- Generic "features" grid, "how it works" steps, stock-y system cards —
  replaced by capability zones with embedded real UI.
- Static hero-bg — replaced by mural + live graph canvas.
- Testimonials/pricing/FAQ survive, restyled.
