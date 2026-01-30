# Omnis Design System Specification

> **Status:** PARTIAL (basic implementation complete, advanced features pending)
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
- **Glassmorphism** for depth without heaviness

### 2. Information Dense but Readable
- Clear hierarchy: Primary > Secondary > Tertiary
- Whitespace as a design element
- Progressive disclosure
- **Breathing room** between sections

### 3. Data-Driven Dashboard
- Show TODAY's energies prominently
- Personal highlights
- Quick actions
- **Real-time feel** with subtle animations

### 4. Delight Through Motion
- Smooth transitions (200-400ms)
- Meaningful micro-interactions
- Loading states that feel alive
- Never jarring or distracting

---

## Color System

### Core Palette

```css
:root {
  /* ═══════════════════════════════════════════════════════════════
     PRIMARY - Deep Violet (Mystical, Wise)
     ═══════════════════════════════════════════════════════════════ */
  --primary-50: #f5f3ff;
  --primary-100: #ede9fe;
  --primary-200: #ddd6fe;
  --primary-300: #c4b5fd;
  --primary-400: #a78bfa;
  --primary-500: #8b5cf6;   /* Main */
  --primary-600: #7c3aed;
  --primary-700: #6d28d9;
  --primary-800: #5b21b6;
  --primary-900: #4c1d95;
  --primary-950: #2e1065;

  /* ═══════════════════════════════════════════════════════════════
     ACCENT - Gold (Sacred, Illumination)
     ═══════════════════════════════════════════════════════════════ */
  --accent-50: #fffbeb;
  --accent-100: #fef3c7;
  --accent-200: #fde68a;
  --accent-300: #fcd34d;
  --accent-400: #fbbf24;   /* Main */
  --accent-500: #f59e0b;
  --accent-600: #d97706;
  --accent-700: #b45309;
  --accent-800: #92400e;
  --accent-900: #78350f;

  /* ═══════════════════════════════════════════════════════════════
     BACKGROUND - Deep Space
     ═══════════════════════════════════════════════════════════════ */
  --bg-base: #030014;      /* Deepest - page background */
  --bg-raised: #0a0a1a;    /* Cards, dialogs */
  --bg-elevated: #12122a;  /* Hover states, dropdowns */
  --bg-overlay: #1a1a3a;   /* Active states */

  /* ═══════════════════════════════════════════════════════════════
     TEXT
     ═══════════════════════════════════════════════════════════════ */
  --text-primary: #f8fafc;     /* Headings, important */
  --text-secondary: #cbd5e1;   /* Body text */
  --text-muted: #64748b;       /* Captions, hints */
  --text-disabled: #475569;    /* Disabled states */

  /* ═══════════════════════════════════════════════════════════════
     BORDERS & DIVIDERS
     ═══════════════════════════════════════════════════════════════ */
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.1);
  --border-strong: rgba(255, 255, 255, 0.15);
  --border-focus: rgba(139, 92, 246, 0.5);

  /* ═══════════════════════════════════════════════════════════════
     GLASSMORPHISM
     ═══════════════════════════════════════════════════════════════ */
  --glass-bg: rgba(10, 10, 26, 0.7);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: 12px;
}
```

### Semantic CSS Variables (shadcn compatible)

```css
:root {
  --background: 240 50% 3%;
  --foreground: 210 40% 98%;
  --card: 240 30% 6%;
  --card-foreground: 210 40% 98%;
  --popover: 240 30% 8%;
  --popover-foreground: 210 40% 98%;
  --primary: 263 70% 50%;
  --primary-foreground: 210 40% 98%;
  --secondary: 240 10% 15%;
  --secondary-foreground: 210 40% 98%;
  --muted: 240 10% 15%;
  --muted-foreground: 215 20% 55%;
  --accent: 38 92% 50%;
  --accent-foreground: 0 0% 0%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 210 40% 98%;
  --border: 240 10% 15%;
  --input: 240 10% 15%;
  --ring: 263 70% 50%;
  --radius: 0.75rem;
}

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

### System Colors (Dreamspell Four Colors)

```css
:root {
  /* Dreamspell Seal Colors */
  --seal-red: #ef4444;      /* Initiating - East */
  --seal-white: #f8fafc;    /* Refining - North */
  --seal-blue: #3b82f6;     /* Transforming - West */
  --seal-yellow: #eab308;   /* Ripening - South */

  /* Semantic variants for backgrounds */
  --seal-red-bg: rgba(239, 68, 68, 0.15);
  --seal-white-bg: rgba(248, 250, 252, 0.1);
  --seal-blue-bg: rgba(59, 130, 246, 0.15);
  --seal-yellow-bg: rgba(234, 179, 8, 0.15);

  /* Glow effects */
  --seal-red-glow: 0 0 20px rgba(239, 68, 68, 0.4);
  --seal-white-glow: 0 0 20px rgba(248, 250, 252, 0.3);
  --seal-blue-glow: 0 0 20px rgba(59, 130, 246, 0.4);
  --seal-yellow-glow: 0 0 20px rgba(234, 179, 8, 0.4);
}
```

### Human Design Colors

```css
:root {
  /* Center States */
  --hd-defined: #8b5cf6;        /* Purple - Defined/Active */
  --hd-undefined: #1e1e3f;      /* Dark - Open/Receptive */

  /* Activation Colors */
  --hd-personality: #1a1a2e;    /* Black - Conscious */
  --hd-design: #dc2626;         /* Red - Unconscious */

  /* Center-specific colors (when defined) */
  --hd-head: #fbbf24;           /* Yellow - Inspiration */
  --hd-ajna: #22c55e;           /* Green - Conceptualization */
  --hd-throat: #f97316;         /* Orange - Communication */
  --hd-g-center: #eab308;       /* Gold - Identity */
  --hd-heart: #ef4444;          /* Red - Willpower */
  --hd-spleen: #854d0e;         /* Brown - Intuition */
  --hd-sacral: #dc2626;         /* Deep Red - Life Force */
  --hd-solar: #d97706;          /* Amber - Emotions */
  --hd-root: #92400e;           /* Earth - Pressure */
}
```

### Astrology Element Colors

```css
:root {
  /* Four Elements */
  --element-fire: #f97316;      /* Orange-Red - Aries, Leo, Sag */
  --element-earth: #22c55e;     /* Green - Taurus, Virgo, Cap */
  --element-air: #38bdf8;       /* Sky Blue - Gemini, Libra, Aqua */
  --element-water: #6366f1;     /* Indigo - Cancer, Scorpio, Pisces */

  /* Background variants */
  --element-fire-bg: rgba(249, 115, 22, 0.15);
  --element-earth-bg: rgba(34, 197, 94, 0.15);
  --element-air-bg: rgba(56, 189, 248, 0.15);
  --element-water-bg: rgba(99, 102, 241, 0.15);
}
```

### Gradients

```css
:root {
  /* Hero/Feature Gradients */
  --gradient-cosmic: linear-gradient(135deg, #1a1a3a 0%, #0a0a1a 50%, #030014 100%);
  --gradient-aurora: linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #06b6d4 100%);
  --gradient-gold: linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #fcd34d 100%);
  --gradient-mystical: linear-gradient(180deg, rgba(139, 92, 246, 0.2) 0%, transparent 50%);

  /* Card Gradients */
  --gradient-card-hover: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%);
  --gradient-card-active: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);

  /* Border Gradients */
  --gradient-border: linear-gradient(135deg, rgba(139, 92, 246, 0.5) 0%, rgba(59, 130, 246, 0.3) 100%);
}
```

---

## Typography Scale

### Font Stack

```css
:root {
  /* Display - Elegant serif for headings */
  --font-display: 'Cinzel', 'Playfair Display', Georgia, serif;

  /* Body - Clean sans-serif for readability */
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  /* Mono - For numbers, data, kin numbers */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;

  /* Hebrew - Right-to-left support */
  --font-hebrew: 'Heebo', 'Assistant', 'Arial Hebrew', sans-serif;
}
```

### Type Scale (1.25 ratio - Major Third)

```css
:root {
  /* Size scale */
  --text-xs: 0.75rem;     /* 12px - Captions, badges */
  --text-sm: 0.875rem;    /* 14px - Secondary text, labels */
  --text-base: 1rem;      /* 16px - Body text */
  --text-lg: 1.125rem;    /* 18px - Lead paragraphs */
  --text-xl: 1.25rem;     /* 20px - Card titles */
  --text-2xl: 1.5rem;     /* 24px - Section headers */
  --text-3xl: 1.875rem;   /* 30px - Page titles */
  --text-4xl: 2.25rem;    /* 36px - Hero subhead */
  --text-5xl: 3rem;       /* 48px - Hero headline */
  --text-6xl: 3.75rem;    /* 60px - Landing hero */

  /* Line heights */
  --leading-none: 1;
  --leading-tight: 1.2;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;

  /* Letter spacing */
  --tracking-tighter: -0.05em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
  --tracking-widest: 0.1em;

  /* Font weights */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### Typography Classes

```css
/* Display headings - Cinzel */
.heading-hero {
  font-family: var(--font-display);
  font-size: var(--text-6xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-none);
  letter-spacing: var(--tracking-tight);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.heading-1 {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
}

.heading-2 {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  color: var(--text-primary);
}

.heading-3 {
  font-family: var(--font-body);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
  color: var(--text-primary);
}

/* Body text */
.body-large {
  font-family: var(--font-body);
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  color: var(--text-secondary);
}

.body-default {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--text-secondary);
}

.body-small {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--text-muted);
}

/* Special - Kin numbers, data */
.kin-number {
  font-family: var(--font-mono);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  letter-spacing: var(--tracking-wider);
  color: var(--accent-400);
}

/* Hebrew text */
.hebrew-text {
  font-family: var(--font-hebrew);
  direction: rtl;
  color: var(--text-muted);
}
```

---

## Spacing Scale

```css
:root {
  /* Based on 4px unit - matches Tailwind */
  --space-0: 0;
  --space-px: 1px;
  --space-0.5: 0.125rem;  /* 2px */
  --space-1: 0.25rem;     /* 4px */
  --space-1.5: 0.375rem;  /* 6px */
  --space-2: 0.5rem;      /* 8px */
  --space-2.5: 0.625rem;  /* 10px */
  --space-3: 0.75rem;     /* 12px */
  --space-3.5: 0.875rem;  /* 14px */
  --space-4: 1rem;        /* 16px */
  --space-5: 1.25rem;     /* 20px */
  --space-6: 1.5rem;      /* 24px */
  --space-7: 1.75rem;     /* 28px */
  --space-8: 2rem;        /* 32px */
  --space-9: 2.25rem;     /* 36px */
  --space-10: 2.5rem;     /* 40px */
  --space-11: 2.75rem;    /* 44px */
  --space-12: 3rem;       /* 48px */
  --space-14: 3.5rem;     /* 56px */
  --space-16: 4rem;       /* 64px */
  --space-20: 5rem;       /* 80px */
  --space-24: 6rem;       /* 96px */
  --space-28: 7rem;       /* 112px */
  --space-32: 8rem;       /* 128px */
}
```

### Spacing Usage Guidelines

| Context | Spacing |
|---------|---------|
| Icon to text | space-2 (8px) |
| Input padding | space-3 (12px) |
| Card padding | space-4 to space-6 (16-24px) |
| Between form fields | space-4 (16px) |
| Between sections | space-8 to space-12 (32-48px) |
| Page margins (mobile) | space-4 (16px) |
| Page margins (desktop) | space-6 to space-8 (24-32px) |

---

## Shadows & Effects

```css
:root {
  /* ═══════════════════════════════════════════════════════════════
     SHADOWS - Layered depth system
     ═══════════════════════════════════════════════════════════════ */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.4);
  --shadow-xl: 0 16px 32px rgba(0, 0, 0, 0.5);
  --shadow-2xl: 0 24px 48px rgba(0, 0, 0, 0.6);

  /* Colored shadows for glow effects */
  --shadow-primary: 0 8px 24px rgba(139, 92, 246, 0.3);
  --shadow-accent: 0 8px 24px rgba(251, 191, 36, 0.3);
  --shadow-error: 0 8px 24px rgba(239, 68, 68, 0.3);

  /* Inner shadows for depth */
  --shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.2);
  --shadow-inner-glow: inset 0 0 20px rgba(139, 92, 246, 0.1);

  /* ═══════════════════════════════════════════════════════════════
     BLUR EFFECTS
     ═══════════════════════════════════════════════════════════════ */
  --blur-sm: 4px;
  --blur-md: 8px;
  --blur-lg: 12px;
  --blur-xl: 24px;

  /* ═══════════════════════════════════════════════════════════════
     TRANSITIONS
     ═══════════════════════════════════════════════════════════════ */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
  --transition-slower: 500ms ease;

  /* Cubic bezier for bouncy feel */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);

  /* ═══════════════════════════════════════════════════════════════
     BORDER RADIUS
     ═══════════════════════════════════════════════════════════════ */
  --radius-none: 0;
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */
  --radius-2xl: 1.5rem;   /* 24px */
  --radius-full: 9999px;
}
```

### Glassmorphism Component

```css
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
}

.glass-card-hover:hover {
  background: rgba(10, 10, 26, 0.8);
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow: var(--shadow-primary);
}
```

### Glow Effects

```css
/* Subtle ambient glow */
.glow-ambient {
  box-shadow:
    0 0 20px rgba(139, 92, 246, 0.1),
    0 0 40px rgba(139, 92, 246, 0.05);
}

/* Active/focus glow */
.glow-active {
  box-shadow:
    0 0 0 2px rgba(139, 92, 246, 0.3),
    0 0 20px rgba(139, 92, 246, 0.2);
}

/* Pulsing glow animation */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.2); }
  50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.4); }
}

.glow-pulse {
  animation: pulse-glow 3s ease-in-out infinite;
}

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
