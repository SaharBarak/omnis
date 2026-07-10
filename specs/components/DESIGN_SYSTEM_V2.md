# Pleiad Design System V2

## Overview

Replace the current dark-only cosmic theme with a comfortable, readable design system featuring 3 modes:
1. **Light** - Warm cream/ivory (default)
2. **Colorful** - Vibrant, playful
3. **Dark** - Deep, cosmic

Focus on typography, readability, and eye comfort for reading spiritual content.

---

## 1. Color Modes

### Light Mode (Default)
```css
--background: #FFFBF5;        /* Warm cream */
--background-secondary: #FFF8F0;
--foreground: #1A1A1A;        /* Soft black */
--foreground-muted: #666666;
--accent: #8B5CF6;            /* Soft purple */
--accent-hover: #7C3AED;
--border: #E8E4DF;
--card: #FFFFFF;
--card-hover: #FFFAF5;
```

### Colorful Mode
```css
--background: #FEF7FF;        /* Soft lavender white */
--background-secondary: #F5F0FF;
--foreground: #2D2040;        /* Deep purple-black */
--foreground-muted: #6B5B7A;
--accent: #EC4899;            /* Pink */
--accent-secondary: #8B5CF6;  /* Purple */
--accent-tertiary: #06B6D4;   /* Cyan */
--border: #E9D5FF;
--card: #FFFFFF;
--card-hover: #FDF4FF;
```

### Dark Mode
```css
--background: #0F0D15;        /* Deep space */
--background-secondary: #1A1625;
--foreground: #F5F5F5;
--foreground-muted: #A0A0A0;
--accent: #D4AF37;            /* Gold */
--accent-hover: #E5C158;
--border: #2D2640;
--card: #1A1625;
--card-hover: #252035;
```

---

## 2. Typography

### Font Stack
```css
--font-heading: 'Plus Jakarta Sans', system-ui, sans-serif;
--font-body: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Scale (Mobile-First)
```css
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
--text-5xl: 3rem;       /* 48px */
```

### Line Heights
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

### Reading Optimization
- Body text: 16-18px, line-height 1.6-1.75
- Max line width: 65-75 characters
- Paragraph spacing: 1.5em
- Letter spacing: 0.01em for body text

---

## 3. Spacing System

```css
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

## 4. Border Radius

```css
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-2xl: 1.5rem;    /* 24px */
--radius-full: 9999px;
```

---

## 5. Shadows

### Light Mode
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.05);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.08);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
```

### Dark Mode
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.6);
```

---

## 6. Practice-Specific Accent Colors

Each spiritual practice gets a consistent accent color across all modes:

| Practice | Color | Hex |
|----------|-------|-----|
| Tarot | Deep Purple | #7C3AED |
| Astrology | Royal Blue | #3B82F6 |
| Numerology | Emerald | #10B981 |
| I-Ching | Amber | #F59E0B |
| Runes | Stone Gray | #6B7280 |
| Kabbalah | Gold | #D4AF37 |
| Human Design | Coral | #F97316 |
| Dreamspell | Magenta | #EC4899 |

---

## 7. Component Styles

### Cards (Reading Cards, Profile Cards)
```css
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  transition: all 0.2s ease;
}

.card:hover {
  background: var(--card-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

### Buttons
```css
.btn-primary {
  background: var(--accent);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: 500;
}

.btn-secondary {
  background: transparent;
  color: var(--foreground);
  border: 1px solid var(--border);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
}
```

### Navigation
```css
.nav {
  background: var(--background);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(8px);
  padding: var(--space-4) var(--space-6);
}
```

---

## 8. Theme Switcher Component

### Location
- Settings page (full control)
- Navbar quick toggle (icon button)
- System preference detection on first visit

### States
```typescript
type Theme = 'light' | 'colorful' | 'dark' | 'system';
```

### Icons
- Light: Sun icon
- Colorful: Sparkles/Rainbow icon
- Dark: Moon icon
- System: Monitor icon

### Persistence
- Store in localStorage: `omnis-theme`
- Sync to user profile if authenticated

---

## 9. Accessibility Requirements

### Contrast Ratios (WCAG AA)
- Normal text: minimum 4.5:1
- Large text (18px+): minimum 3:1
- UI components: minimum 3:1

### Focus States
```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. Reading Experience Optimizations

### Content Container
```css
.reading-content {
  max-width: 680px;          /* Optimal reading width */
  margin: 0 auto;
  padding: var(--space-6);
  font-size: var(--text-lg);  /* 18px for readability */
  line-height: var(--leading-relaxed);
  color: var(--foreground);
}
```

### Headings in Content
```css
.reading-content h2 {
  font-size: var(--text-2xl);
  font-weight: 600;
  margin-top: var(--space-10);
  margin-bottom: var(--space-4);
  color: var(--foreground);
}
```

### Blockquotes (for mantras/affirmations)
```css
.reading-content blockquote {
  border-left: 3px solid var(--accent);
  padding-left: var(--space-6);
  font-style: italic;
  color: var(--foreground-muted);
  margin: var(--space-8) 0;
}
```

---

## 11. Implementation Files

### Tailwind Config Update
```javascript
// tailwind.config.ts
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        accent: 'hsl(var(--accent))',
        // ... etc
      },
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

### CSS Variables File
```css
/* /src/app/globals.css */

:root,
[data-theme="light"] {
  --background: 40 33% 98%;
  --foreground: 0 0% 10%;
  /* ... light mode vars */
}

[data-theme="colorful"] {
  --background: 300 50% 99%;
  --foreground: 270 30% 20%;
  /* ... colorful mode vars */
}

[data-theme="dark"] {
  --background: 260 25% 7%;
  --foreground: 0 0% 96%;
  /* ... dark mode vars */
}
```

### Theme Provider
```typescript
// /src/components/providers/ThemeProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'colorful' | 'dark' | 'system';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const stored = localStorage.getItem('omnis-theme') as Theme;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', resolveTheme(theme));
    localStorage.setItem('omnis-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### Theme Toggle Component
```typescript
// /src/components/ui/ThemeToggle.tsx
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'colorful', icon: Sparkles, label: 'Colorful' },
    { value: 'dark', icon: Moon, label: 'Dark' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          {theme === 'light' && <Sun />}
          {theme === 'colorful' && <Sparkles />}
          {theme === 'dark' && <Moon />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {options.map(opt => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => setTheme(opt.value)}
          >
            <opt.icon className="mr-2 h-4 w-4" />
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## 12. Files to Modify/Create

```
Modify:
├── tailwind.config.ts (add new colors, fonts)
├── src/app/globals.css (CSS variables for 3 themes)
├── src/app/layout.tsx (wrap with ThemeProvider)
├── src/components/landing/Navigation.tsx (add theme toggle)

Create:
├── src/components/providers/ThemeProvider.tsx
├── src/components/ui/ThemeToggle.tsx
├── src/hooks/useTheme.ts
```

---

## 13. Migration Strategy

### Phase 1: Foundation
- [ ] Update tailwind.config.ts with new design tokens
- [ ] Create CSS variables in globals.css
- [ ] Add fonts (Plus Jakarta Sans, Inter)

### Phase 2: Theme System
- [ ] Create ThemeProvider
- [ ] Add ThemeToggle component
- [ ] Update layout.tsx

### Phase 3: Component Updates
- [ ] Update Card component
- [ ] Update Button variants
- [ ] Update Navigation
- [ ] Update all page backgrounds

### Phase 4: Content Optimization
- [ ] Add reading-content styles
- [ ] Update typography scale
- [ ] Test contrast ratios

---

## 14. Verification

- [ ] All 3 themes render correctly
- [ ] Theme persists on refresh
- [ ] System preference detection works
- [ ] Contrast ratios pass WCAG AA
- [ ] Reading content is comfortable at all modes
- [ ] No flash of wrong theme on load
- [ ] Toggle is accessible via keyboard
