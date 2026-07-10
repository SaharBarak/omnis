# Pleiad Mobile — Design Language

Status: LOCKED for mobile v1 · Source: `src/lib/design/landing-tokens.ts`,
`src/lib/design/system-flavors.ts`, `src/app/app/dashboard.css`,
`docs/redesign/DESIGN_LANGUAGE.md`, `docs/redesign/MOTION_SPEC.md`.

The mobile app wears the exact brand the web redesign locked in. Nothing
here is a new design decision — it is the web design language transcribed
into React Native primitives, plus mobile-only patterns (gestures, haptics,
tab bar, sheets) that the web has no equivalent for.

Design dials (taste baseline): DESIGN_VARIANCE 8 · MOTION_INTENSITY 6 ·
VISUAL_DENSITY 4. Asymmetric compositions, fluid perpetual micro-motion,
airy daily-app spacing.

---

## 1. Color

### 1.1 Chrome (app-wide, non-negotiable)

| Token | Hex | Use |
|---|---|---|
| `ground` | `#0B0D16` | Root background of every screen. Murals are painted to fade into it — never neutralize. |
| `surface` | `#0D101A` | Cards, sheets, list rows |
| `surface2` | `#12151F` | Popovers, elevated sheets, inputs |
| `brand` | `#7D5BC9` | Primary actions, active tab, links, focus |
| `brandSoft` | `#A78FDF` | Secondary accents, icons, graph edges |
| `brandBright` | `#EFEAFA` | Stat numerals, split-flap digits, star dots |

Derived (from dashboard.css, converted):

| Token | Value | Use |
|---|---|---|
| `border` | `rgba(228,232,245,0.07)` | 1px refraction border on all panels |
| `borderHover` | `rgba(228,232,245,0.12)` | pressed/focused panel border |
| `cardFill` | `rgba(13,16,26,0.82)` | panel fill over cosmic ground |
| `muted` | `#8B90A8` (≈ hsl 233 12% 60%) | secondary text fallback when opacity steps don't fit |
| `destructive` | `#D64545` | delete, errors |

### 1.2 Text emphasis — exactly four steps

`rgba(255,255,255, 0.90 / 0.70 / 0.50 / 0.35)`. No fifth step, no ad-hoc
grays. Primary copy 0.90, body 0.70, secondary 0.50, ghost/disabled 0.35.

### 1.3 System flavors (five skins, one grammar)

Flavor appears ONLY in accents, borders, motifs, banner art. Layout,
spacing, and behavior identical across systems.

| System | Display name | `accent` | `accentSoft` |
|---|---|---|---|
| astrology | Astrology | `#C9A227` | `#E7D08A` |
| dreamspell | Dreamspell | `#A87BD1` | `#CDB2E8` |
| tzolkin | Tzolkin | `#2E6E5E` | `#7FB5A6` |
| humanDesign | Human Design | `#7FD4C1` | `#B9E8DD` |
| gematria | Kabbalah | `#D4AF37` | `#EFD98B` |
| integration | Integration | `#C9A227` | `#E7D08A` |

Dreamspell seal colors (vivid, untouched): red `#C0392B`-family
(`hsl(4 72% 48%)`), white `hsl(0 0% 96%)`, blue `hsl(215 65% 45%)`,
yellow `hsl(45 90% 48%)`.

### 1.4 Forbidden

No pure black `#000000`. No neon/outer glows. No purple button-glow
animations. No gradient text on large headings. Max one accent per surface
(the active system's flavor OR brand, never both fighting). Saturation of
any new tint < 80%.

---

## 2. Typography

Fonts bundled via `expo-font` (all on Google Fonts, self-host the ttf/otf):

| Role | Face | Weights |
|---|---|---|
| Display | **Space Grotesk** | 500, 600, 700 |
| Body/UI | **Barlow** | 400, 500, 600 |
| Mono (numerals, labels, data) | **IBM Plex Mono** | 400, 500 |

Space Grotesk has NO italics — never fake-slant. Weight carries hierarchy.

### 2.1 Type ramp (mobile-tuned from web TYPE)

| Step | Spec | Use |
|---|---|---|
| `hero` | Space Grotesk 600 · 34pt · lineHeight 36 · letterSpacing −1 | one per screen max (onboarding, empty map) |
| `zone` | Space Grotesk 600 · 28pt · lh 30 · ls −0.5 | screen titles |
| `section` | Space Grotesk 600 · 22pt · lh 26 · ls −0.4 | section heads |
| `card` | Space Grotesk 500 · 18pt · lh 24 | card titles, person names |
| `body` | Barlow 400 · 16pt · lh 24 | prose |
| `bodySm` | Barlow 400 · 14pt · lh 20 | secondary prose |
| `eyebrow` | IBM Plex Mono 500 · 11pt · uppercase · ls +2.2 | micro-labels, pills |
| `stat` | IBM Plex Mono 500 · 28–34pt · tabular-nums · ls −0.5 · color `brandBright` | kin numbers, scores, split-flap digits |
| `statLabel` | IBM Plex Mono 400 · 11pt · uppercase · ls +2 · white/50 | stat captions |

All numerals everywhere = IBM Plex Mono tabular. Dates, kin, scores, gate
numbers, gematria values — never proportional figures.

---

## 3. Surfaces & shape

- **Panel**: fill `cardFill`, radius **16**, 1px `border`, inner top
  highlight (RN: 1px top hairline `rgba(255,255,255,0.04)` — the liquid-glass
  refraction edge).
- **Feature panel / sheet**: radius **20**.
- **Hero inset panel** (Railway pattern): radius **32** (`rounded-[2rem]`),
  mural clipped inside.
- **Pills**: radius full. Small tags/badges only.
- **Primary button**: radius **12**, `brand` fill, white text, height 52,
  pressed → scale 0.98 + fill darken 6%. Never text-on-ground over brand,
  never glow.
- **Secondary button**: radius 12, transparent fill, 1px `border`, white/70.
- **Cards used sparingly** — group with spacing and 1px hairline dividers
  (`border`) where elevation isn't meaningful. No 3-equal-card rows.
- Shadows: flat philosophy. iOS: y2 blur8 black 0.25 max on floating
  elements (FAB, sheet). Android: elevation ≤ 4. No colored shadows.

### 3.1 Cosmic ground layer

Every authed screen renders over a fixed background stack (one shared
component, `CosmicGround`, mounted once behind the navigator):

1. `ground` solid
2. `hero-sky.webp` painted at top, fading to ground
3. Two radial brand glows (top-right `#7D5BC9` @ 7%, bottom-left `#A78FDF` @ 4.5%)
4. 5–7 static star dots `#EFEAFA` @ 9–16% alpha

Static image render (pre-compose to one webp per density if perf demands).
Never re-renders, never scrolls.

---

## 4. Iconography & brand

- **BrandMark (asterism)**: port `src/components/brand-mark.tsx` SVG
  verbatim to `react-native-svg`. Core `#7D5BC9` r3.4, stars
  `#EFEAFA`/`#A78FDF`, lines `#A78FDF` @ 0.55 · 0.9w. `mono` prop for
  single-color contexts. Used: splash, login, nav header, about.
- Icons: **Phosphor** (`phosphor-react-native`), weight `regular`
  (1.5-equivalent stroke), 22–24pt in tab bar, 20pt inline. One weight
  app-wide. NO emojis anywhere — glyph assets or Phosphor only.
- System glyphs (seals, tones, tzolkin nawales, zodiac, HD gates, Hebrew
  letters) reuse existing SVG/webp assets from `public/images/*` and
  `public/icons/*` — bundle into the app.

---

## 5. Motion (Reanimated 3 + Skia)

Web lanes translate: framer-motion → **react-native-reanimated**; SVG
pathLength draws → **react-native-skia** or `react-native-svg` +
strokeDashoffset; AmbientVideo → `expo-video` with poster + pause-offscreen.

### 5.1 Physics & timing (locked values)

- Springs: `stiffness 100, damping 20` default. Overshoot spring for badge
  pops only.
- Easings: `smooth (0.4,0,0.2,1)` · `spring (0.34,1.56,0.64,1)` ·
  `bounce (0.68,-0.55,0.265,1.55)` (bounce ≈ never; nothing bounces).
- Durations: fast 120 · normal 200 · slow 300 · slower 500 ms.
- Entrances: blur-in/fade-up 300–500ms, stagger 60–80ms.

### 5.2 Mobile motion inventory

| Moment | Treatment |
|---|---|
| Screen transitions | native stack default + shared-element on person avatar → person detail (Reanimated shared transitions) |
| List mount | staggered fade-up, 60ms cascade, once per focus |
| Person detail system tabs | swipeable pager; flavor accent crossfades 200ms; underline indicator springs |
| Map graph | d3-force layout on JS thread → Skia canvas; nodes settle with spring; edges pulse (2.5s gentle) on selected node |
| Today board | split-flap: per-cell 3D flip (`rotateX`), 15–25ms cascade jitter, mono digits — the ONE theatrical set piece |
| Pull-to-refresh | traveler glyph (comet) draws its spark trail as pull progress; release → spin |
| Score reveals | count-up from 0 (once per mount), tabular mono |
| Bodygraph | channels stroke-draw on enter (Skia path trim) |
| Tzolkin stamps | scale 1.15→1 + opacity ink-spread on reveal |
| Gematria letters | rotate-in, gilded accent |
| Buttons | pressed scale 0.98, 120ms; haptic `impactLight` on primary actions, `notificationSuccess` on saves |
| Tab bar | active icon springs +2pt scale, brand tint fill 200ms |
| Sheets | spring up (damping 20), scrim fade |

Perpetual micro-motion (dial 6): breathing status dot on "today" card (4s),
shimmer on skeletons (2s), slow ambient drift on hero sky (translate ±6pt,
20s) — each isolated in memoized leaf components.

### 5.3 Rules

- Animate ONLY `transform` + `opacity`. Everything on UI thread
  (worklets). No layout-prop animation.
- `prefers-reduced-motion` (AccessibilityInfo.isReduceMotionEnabled): all
  decorative motion off, videos → posters, split-flap → static, functional
  motion (tab indicator, sheet) kept minimal.
- Low Power Mode / Save-Data equivalent: skip ambient video loops.
- One theatrical set piece per screen maximum.

---

## 6. Layout

- Base unit 4. Screen gutter **20**. Section gap **32**. Card padding
  **20** (feature panels 24).
- Asymmetry (variance 8): section headers left-aligned, never centered
  (exception: onboarding ritual steps — the sanctioned centered moments,
  mirroring the web hero exception). Offset content: stat rows 2fr/1fr,
  staggered card columns on wide phones, generous leading whitespace before
  set pieces.
- Lists: no boxed rows — hairline `border` dividers, 16pt vertical padding.
- Full-height layouts: flex, safe-area aware (`react-native-safe-area-context`).
  Respect notch/home-indicator on every screen.
- Dark only in v1. The product IS the night sky; no light theme.

---

## 7. Component states (mandatory full cycle)

Every data surface ships all four:

- **Loading**: skeleton blocks matching final layout (shimmer 2s). Never a
  centered spinner.
- **Empty**: composed empty state — asterism motif, one-line invitation in
  voice ("Your map starts with one birthday."), primary action.
- **Error**: inline, calm, retry action. Forms: error text below field.
- **Success/tactile**: haptic + subtle confirmation (checkmark draw, toast
  bottom sheet style).

Forms: label above input, helper optional, error below, 8pt gap in field
block. Inputs: `surface2` fill, radius 12, 1px border, focus → brand border.

---

## 8. Voice (copy)

Calm, concrete, confident. Complete-thought headlines, never feature
labels. No mysticism kitsch, no SaaS hype, no fantasy-speak. Dry humor only
in persistence copy. Every reading surface offers a path into the knowledge
docs. Numerals and dates in mono.

---

## 9. Asset bundle

From `public/` (compressed for mobile densities):

- `images/redesign/mural/*` — hero sky, five zone bands, portal (onboarding
  backdrops + learn banners)
- `images/redesign/motifs/*` — thread-of-light, traveler glyph, grid-paper
- `images/redesign/docs/*` — learn banners
- `videos/redesign/hero-sky-loop.mp4`, `portal-loop.mp4` (H.264 only on
  mobile, ≤2.5MB, poster stills mandatory)
- System glyph sets: dreamspell seals/tones, tzolkin nawales, astrology,
  human design, gematria letters + Tree of Life
- Fonts: Space Grotesk, Barlow, IBM Plex Mono

App icon + splash: asterism on `ground`, brand core. Splash → login uses
mural sky crossfade.
