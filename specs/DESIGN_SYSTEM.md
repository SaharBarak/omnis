# Omnis Design System Specification

> **Status:** TODO
> **Created:** 2026-01-25
> **Priority:** CRITICAL
> **Goal:** Establish a cohesive, modern design system with clear visual hierarchy

---

## Current Problems

### 1. Missing Critical Data Input
- **Birth Time** - Database has `birth_time` column but NO UI to input it
- **Birth Place** - Database has `birth_place` JSON column but NO UI to input it
- Human Design and Astrology calculations are incomplete without this data

### 2. No Design System
- Inconsistent spacing (random gaps)
- No typography scale
- No color system beyond defaults
- No component hierarchy
- Generic shadcn defaults everywhere

### 3. No Visual Hierarchy
- All elements have same visual weight
- No focal points
- No clear information architecture
- Dashboard is empty/useless

### 4. Outdated Aesthetic
- Looks like generic admin template
- No brand identity
- No personality for a "symbolic mapping" app
- Should feel mystical/insightful, not corporate

---

## Design Principles

### 1. Mystical but Clean
- Dark mode primary (cosmic feel)
- Subtle gradients and glows
- Sacred geometry undertones
- Not cluttered or "new age tacky"

### 2. Information Dense but Readable
- Clear hierarchy: Primary > Secondary > Tertiary
- Whitespace as a design element
- Progressive disclosure

### 3. Data-Driven Dashboard
- Show TODAY's energies prominently
- Personal highlights
- Quick actions

---

## Color System

### Semantic Colors

```css
/* Primary Palette - Cosmic */
--primary: hsl(270, 50%, 50%);      /* Deep purple */
--primary-foreground: hsl(0, 0%, 100%);

/* Accent - Gold/Amber (mystical highlight) */
--accent: hsl(38, 92%, 50%);         /* Gold */
--accent-foreground: hsl(0, 0%, 0%);

/* Background - Dark mode */
--background: hsl(240, 10%, 4%);     /* Near black */
--foreground: hsl(0, 0%, 95%);

/* Card surfaces */
--card: hsl(240, 10%, 8%);           /* Slightly lighter */
--card-foreground: hsl(0, 0%, 95%);

/* Muted */
--muted: hsl(240, 5%, 15%);
--muted-foreground: hsl(240, 5%, 60%);

/* Borders */
--border: hsl(240, 5%, 20%);
```

### System Colors (Dreamspell)

```css
--seal-red: hsl(0, 72%, 51%);
--seal-white: hsl(0, 0%, 95%);
--seal-blue: hsl(217, 91%, 60%);
--seal-yellow: hsl(45, 93%, 58%);
```

### Human Design Colors

```css
--hd-defined: hsl(270, 50%, 50%);    /* Purple for defined */
--hd-undefined: hsl(240, 5%, 25%);   /* Gray for open */
--hd-personality: hsl(0, 0%, 10%);   /* Black */
--hd-design: hsl(0, 72%, 51%);       /* Red */
```

### Astrology Colors

```css
--fire: hsl(15, 90%, 55%);           /* Aries, Leo, Sag */
--earth: hsl(120, 30%, 40%);         /* Taurus, Virgo, Cap */
--air: hsl(200, 80%, 60%);           /* Gemini, Libra, Aqua */
--water: hsl(230, 60%, 50%);         /* Cancer, Scorpio, Pisces */
```

---

## Typography Scale

```css
/* Font families */
--font-display: 'Cinzel', serif;     /* Headings - elegant/mystical */
--font-body: 'Inter', sans-serif;    /* Body text */
--font-mono: 'JetBrains Mono', monospace;  /* Numbers/data */

/* Scale (based on 1.25 ratio) */
--text-xs: 0.64rem;     /* 10px */
--text-sm: 0.8rem;      /* 13px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.25rem;     /* 20px */
--text-xl: 1.563rem;    /* 25px */
--text-2xl: 1.953rem;   /* 31px */
--text-3xl: 2.441rem;   /* 39px */
--text-4xl: 3.052rem;   /* 49px */

/* Line heights */
--leading-tight: 1.2;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Letter spacing */
--tracking-tight: -0.02em;
--tracking-normal: 0;
--tracking-wide: 0.05em;
```

---

## Spacing Scale

```css
/* Based on 4px unit */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

---

## Component Hierarchy

### Cards

```
┌─────────────────────────────────────────────────────────┐
│ FEATURED CARD (Hero)                                     │
│ - Full-width or prominent placement                      │
│ - Gradient background                                    │
│ - Large typography                                       │
│ - Primary action visible                                 │
│ - Used for: Today's Kin, Current energies               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐
│ STANDARD CARD       │  │ STANDARD CARD       │
│ - Solid background  │  │                     │
│ - Clear header      │  │                     │
│ - Medium padding    │  │                     │
│ - Used for: Lists   │  │                     │
└─────────────────────┘  └─────────────────────┘

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ COMPACT  │ │ COMPACT  │ │ COMPACT  │ │ COMPACT  │
│ Stats    │ │ Quick    │ │ Actions  │ │ Badges   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Visual Hierarchy Levels

| Level | Use Case | Typography | Background |
|-------|----------|------------|------------|
| Hero | Today's info, main CTA | text-3xl/4xl bold | Gradient |
| Primary | Section headers | text-xl bold | Card |
| Secondary | Item titles | text-lg medium | Card |
| Tertiary | Labels, metadata | text-sm regular | Transparent |
| Caption | Help text, timestamps | text-xs muted | None |

---

## Page Layouts

### Dashboard (Redesigned)

```
┌─────────────────────────────────────────────────────────┐
│ HEADER: "Good morning, Sahar"     [Settings] [Profile]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  🌟 TODAY'S KIN: Kin 234 - Cosmic Wizard        │    │
│  │                                                  │    │
│  │  [Seal Icon]   "I endure in order to enchant"  │    │
│  │                                                  │    │
│  │  Wavespell: White Wizard  •  Castle: Blue       │    │
│  │  Moon: Overtone Moon (Day 5)                    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │ QUICK STATS     │  │ YOUR PROFILE SNAPSHOT       │  │
│  │ 12 People       │  │                             │  │
│  │ 8 Relationships │  │ You: Kin 45 - Rhythmic     │  │
│  │ 3 Groups        │  │ Serpent                     │  │
│  │ 2 Boards        │  │                             │  │
│  └─────────────────┘  │ Today's Oracle: Analog day  │  │
│                       └─────────────────────────────┘  │
│                                                          │
│  RECENT PEOPLE ─────────────────────── [View All →]     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│  │ Person │ │ Person │ │ Person │ │ Person │           │
│  │ Card   │ │ Card   │ │ Card   │ │ Card   │           │
│  └────────┘ └────────┘ └────────┘ └────────┘           │
│                                                          │
│  UPCOMING EVENTS ──────────────────────────────────────│
│  • Jan 28 - Galactic Birthday: Sarah                    │
│  • Feb 2 - New Wavespell begins                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Person Form (With Birth Time/Place)

```
┌─────────────────────────────────────────────────────────┐
│ ADD NEW PERSON                                    [X]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  BASIC INFORMATION                                       │
│  ──────────────────────────────────────────────────────│
│  Name *                    Hebrew Name                   │
│  [________________]       [________________]             │
│                                                          │
│  BIRTH DATA                                              │
│  ──────────────────────────────────────────────────────│
│  Birth Date *              Birth Time                    │
│  [____/__/____]           [__:__] ○ Unknown             │
│                                                          │
│  Birth Place                                             │
│  [🔍 Search city...                              ]      │
│  ├── Latitude: 32.0853   Longitude: 34.7818            │
│  └── Timezone: Asia/Jerusalem (auto-detected)          │
│                                                          │
│  ℹ️ Birth time is required for Human Design and         │
│     accurate Astrology calculations.                    │
│                                                          │
│  ADDITIONAL                                              │
│  ──────────────────────────────────────────────────────│
│  Tags                                                    │
│  [Family] [Friends] [+Add]                              │
│                                                          │
│  Notes                                                   │
│  [________________________________]                     │
│                                                          │
│                        [Cancel]  [Save Person]          │
└─────────────────────────────────────────────────────────┘
```

---

## Person Detail Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ ← Back to People                                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  SARAH COHEN  שרה כהן                                   │
│  Born: March 15, 1985 at 14:30 • Tel Aviv, Israel      │
│  [Edit] [Share]                                         │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ DREAMSPELL SIGNATURE                             │   │
│  │                                                  │   │
│  │   [🌙]  KIN 169 - Cosmic Moon                  │   │
│  │                                                  │   │
│  │   "I endure in order to purify"                │   │
│  │                                                  │   │
│  │   ┌─────┐                                       │   │
│  │   │Guide│                                       │   │
│  │   └─────┘                                       │   │
│  │ ┌─────┐ ┌─────┐ ┌─────┐                        │   │
│  │ │Anti │ │ KIN │ │Anlog│                        │   │
│  │ └─────┘ └─────┘ └─────┘                        │   │
│  │   ┌─────┐                                       │   │
│  │   │Occlt│                                       │   │
│  │   └─────┘                                       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  [Dreamspell] [Astrology] [Human Design] [Gematria]    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Selected Tab Content                             │   │
│  │                                                  │   │
│  │ ...                                             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Components to Create/Update

### New Components

| Component | Purpose | Priority |
|-----------|---------|----------|
| `HeroCard` | Featured content with gradient | P1 |
| `StatCard` | Compact number display | P1 |
| `BirthTimeInput` | Time picker with "unknown" toggle | P1 |
| `LocationPicker` | City search with lat/lng | P1 |
| `TodayKinDisplay` | Today's Dreamspell info | P1 |
| `ProfileSnapshot` | User's own data summary | P2 |
| `UpcomingEvents` | Galactic birthdays, cycles | P2 |
| `QuickActions` | Common actions grid | P2 |

### Update Existing

| Component | Changes Needed | Priority |
|-----------|----------------|----------|
| PersonForm | Add birth_time, birth_place inputs | P1 |
| Dashboard | Complete redesign | P1 |
| Card | Add variants (hero, compact) | P1 |
| Navigation | Better hierarchy, icons | P2 |
| PersonCard | Show birth time indicator | P2 |

---

## Form Field: Birth Place

### Requirements

1. **Search Input** - Autocomplete city search
2. **Coordinates** - Store lat/lng for calculations
3. **Timezone** - Auto-detect from location
4. **Data Source** - Use free geocoding API:
   - Option A: OpenStreetMap Nominatim (free, no key)
   - Option B: Mapbox (free tier, needs key)

### Data Structure

```typescript
interface BirthPlace {
  city: string
  country: string
  latitude: number
  longitude: number
  timezone: string
}
```

### UI States

1. **Empty** - Show search placeholder
2. **Searching** - Show loading indicator
3. **Results** - Show dropdown with matches
4. **Selected** - Show city name + coordinates
5. **Manual** - Allow manual lat/lng entry if search fails

---

## Form Field: Birth Time

### Requirements

1. **Time Input** - HH:MM format
2. **Unknown Toggle** - Checkbox for "I don't know the time"
3. **Hint Text** - Explain why it matters

### UI States

```
┌─────────────────────────────────────┐
│ Birth Time                          │
│ ┌──────────┐  ☐ Unknown            │
│ │ 14:30    │                        │
│ └──────────┘                        │
│                                     │
│ ℹ️ Required for Human Design &     │
│   accurate Moon/Rising sign.       │
└─────────────────────────────────────┘
```

When "Unknown" is checked:
- Disable time input
- Store `null` in database
- Show warning on displays that need time

---

## Implementation Tasks

### Phase 1: Critical Data (P1)

- [ ] Add BirthTimeInput component
- [ ] Add LocationPicker component
- [ ] Update PersonForm with new fields
- [ ] Update use-people hook to save new fields
- [ ] Update Person type if needed
- [ ] Show birth time warnings on HD/Astrology displays

### Phase 2: Design System Foundation (P1)

- [ ] Update globals.css with new color system
- [ ] Add Cinzel font for display
- [ ] Update tailwind.config with spacing/typography
- [ ] Create HeroCard component
- [ ] Create StatCard component

### Phase 3: Dashboard Redesign (P1)

- [ ] Create TodayKinDisplay component
- [ ] Create ProfileSnapshot component
- [ ] Redesign dashboard layout
- [ ] Add quick stats section
- [ ] Add recent people section

### Phase 4: Visual Polish (P2)

- [ ] Update all card components with hierarchy
- [ ] Add subtle gradients/glows
- [ ] Improve navigation
- [ ] Add loading states with skeletons
- [ ] Dark mode refinements

---

## Definition of Done

- [ ] Birth time and place can be entered for people
- [ ] Dashboard shows meaningful information
- [ ] Consistent typography scale applied
- [ ] Consistent color system applied
- [ ] Clear visual hierarchy on all pages
- [ ] Responsive on mobile
- [ ] Dark mode looks polished

---

## References

- Inspiration: Linear, Notion, Raycast (clean modern SaaS)
- Mystical reference: Co-Star, The Pattern (astrology apps)
- Color theory: Deep purples + gold accents = wisdom/mysticism
