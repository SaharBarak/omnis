## Specialized Agents

### Design Agent

Creates UI/UX designs for Pleiad — a symbolic mapping platform with Hebrew RTL interface.

**Design Tokens (MUST USE):**
```css
:root {
  /* Colors - Clean, spiritual, accessible */
  --color-primary: #2563EB;
  --color-secondary: #10B981;
  --color-accent: #8B5CF6;
  --bg-card: #FFFFFF;
  --bg-page: #F9FAFB;
  --text-primary: #1F2937;
  --text-secondary: #6B7280;
  --border: #E5E7EB;

  /* Typography - Hebrew-optimized */
  --font-head: "Heebo", system-ui, sans-serif;
  --font-body: "Assistant", system-ui, sans-serif;

  /* Scale: Minor Third (1.2x) */
  --text-xs:   0.694rem;
  --text-sm:   0.833rem;
  --text-base: 1rem;
  --text-lg:   1.2rem;
  --text-xl:   1.44rem;
  --text-2xl:  1.728rem;
  --text-3xl:  2.074rem;

  /* Spacing */
  --space-1:  0.25rem;
  --space-2:  0.5rem;
  --space-3:  0.75rem;
  --space-4:  1rem;
  --space-6:  1.5rem;
  --space-8:  2rem;

  /* Card */
  --card-width: 148mm;
  --card-height: 210mm;
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
}
```

**RTL Layout Rules:**
- All layouts RTL by default (`dir="rtl"`)
- Logical properties: `margin-inline-start` not `margin-left`
- Text alignment: right
- Icons: Mirror where directionally meaningful

---

### Frontend Agent

Implements Pleiad in **vanilla TypeScript** with Web Components. No frameworks. Zero dependencies where possible.

**Philosophy:**
- Native browser APIs over libraries
- Web Components (Custom Elements v1)
- ES Modules (native import/export)
- CSS Custom Properties
- Pure functions, immutable data
- Composition over inheritance

**Tech Stack:**
- TypeScript 5.x (strict mode)
- Web Components (Custom Elements)
- Native DOM APIs
- CSS Custom Properties + CSS Modules
- Vite (build only, minimal config)

**Architecture:**
```
src/
├── index.html                    # Entry point
├── main.ts                       # Bootstrap
├── styles/
│   ├── tokens.css                # Design tokens
│   ├── reset.css                 # Minimal reset
│   └── utilities.css             # Utility classes
│
├── core/
│   ├── element.ts                # Base custom element
│   ├── state.ts                  # Reactive signals
│   ├── render.ts                 # Efficient DOM rendering
│   └── types.ts                  # Shared types
│
├── lib/
│   ├── calculations/
│   │   ├── dreamspell.ts         # Date → Kin (pure)
│   │   ├── tzolkin.ts            # Date → Tzolkin (pure)
│   │   ├── oracle.ts             # Kin → Oracle (pure)
│   │   └── julian.ts             # Julian day helpers
│   ├── data/
│   │   ├── seals.ts              # 20 seals lookup
│   │   ├── tones.ts              # 13 tones lookup
│   │   ├── mantras.ts            # 260 mantras
│   │   └── oracle-rules.ts       # Oracle relationships
│   └── utils/
│       ├── date.ts               # Date utilities
│       ├── dom.ts                # DOM helpers
│       └── format.ts             # Formatting
│
├── components/
│   ├── person-card.ts            # <person-card>
│   ├── oracle-map.ts             # <oracle-map>
│   ├── seal-icon.ts              # <seal-icon>
│   ├── mantra-display.ts         # <mantra-display>
│   └── tzolkin-sign.ts           # <tzolkin-sign>
│
└── public/
    └── icons/
        ├── seals/                # 20 SVGs
        └── tones/                # 13 SVGs
```

**Base Element Pattern:**
```typescript
export abstract class BaseElement extends HTMLElement {
  protected root: ShadowRoot

  constructor() {
    super()
    this.root = this.attachShadow({ mode: 'open' })
  }

  protected css(styles: string): CSSStyleSheet {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(styles)
    return sheet
  }

  protected html(template: string): void {
    this.root.innerHTML = template
  }

  protected $<T extends Element>(selector: string): T | null {
    return this.root.querySelector<T>(selector)
  }

  protected $$<T extends Element>(selector: string): NodeListOf<T> {
    return this.root.querySelectorAll<T>(selector)
  }

  protected emit<T>(name: string, detail?: T): void {
    this.dispatchEvent(new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true
    }))
  }
}
```

**Reactive Signals (Zero Dependencies):**
```typescript
type Listener<T> = (value: T) => void

export function signal<T>(initial: T) {
  let value = initial
  const listeners = new Set<Listener<T>>()

  return {
    get: () => value,
    set: (next: T) => {
      if (!Object.is(next, value)) {
        value = next
        listeners.forEach(fn => fn(value))
      }
    },
    subscribe: (fn: Listener<T>) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    }
  }
}

export function computed<T>(
  deps: Array<{ subscribe: (fn: () => void) => () => void }>,
  fn: () => T
) {
  const result = signal(fn())
  const unsubscribes = deps.map(dep => dep.subscribe(() => result.set(fn())))
  return { ...result, dispose: () => unsubscribes.forEach(u => u()) }
}
```

**Efficient DOM Rendering:**
```typescript
export function h(
  tag: string,
  attrs: Record<string, string | number | boolean> = {},
  ...children: (Node | string)[]
): HTMLElement {
  const el = document.createElement(tag)

  for (const [key, value] of Object.entries(attrs)) {
    if (typeof value === 'boolean') {
      value && el.setAttribute(key, '')
    } else {
      el.setAttribute(key, String(value))
    }
  }

  el.append(...children.map(c =>
    typeof c === 'string' ? document.createTextNode(c) : c
  ))

  return el
}

export function svg(
  tag: string,
  attrs: Record<string, string | number> = {},
  ...children: (SVGElement | string)[]
): SVGElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag)
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, String(value))
  }
  children.forEach(c => {
    if (typeof c === 'string') {
      el.textContent = c
    } else {
      el.appendChild(c)
    }
  })
  return el
}
```

**Code Rules:**
1. No runtime dependencies (zero node_modules in production)
2. Pure functions for all calculations
3. Immutable data structures
4. Explicit types, no `any`
5. Single Responsibility Principle
6. Composition over inheritance
7. Early returns, no deep nesting
8. Const by default, let only when mutating
9. No comments — self-documenting names
10. RTL-first styling with logical properties

---

### Performance & Optimization Agent

**Hyper-Optimization Principles:**
- **Zero allocations in hot paths** — reuse objects, avoid spread operators in loops
- **Lookup tables over computation** — precompute everything possible
- **Batch DOM operations** — use DocumentFragment, minimize reflows
- **Lazy evaluation** — compute only when needed
- **Object pooling** — reuse instances for frequently created objects

**High Throughput Patterns:**
```typescript
// BAD: Creates new object every call
function getSeal(id: number) {
  return { id, name: SEAL_NAMES[id] }
}

// GOOD: Return from pre-built lookup
const SEALS = Object.freeze(
  Array.from({ length: 20 }, (_, i) =>
    Object.freeze({ id: i + 1, name: SEAL_NAMES[i] })
  )
)
function getSeal(id: number) {
  return SEALS[id - 1]
}
```

**DOM Performance:**
```typescript
// BAD: Multiple reflows
items.forEach(item => container.appendChild(createCard(item)))

// GOOD: Single reflow with fragment
const fragment = document.createDocumentFragment()
items.forEach(item => fragment.appendChild(createCard(item)))
container.appendChild(fragment)
```

**Efficient Iteration:**
```typescript
// BAD: Creates intermediate arrays
const result = data.filter(x => x.active).map(x => x.value)

// GOOD: Single pass with reduce or for-of
const result: number[] = []
for (const x of data) {
  if (x.active) result.push(x.value)
}
```

**Memoization Pattern:**
```typescript
function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>()
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    if (!cache.has(key)) cache.set(key, fn(...args))
    return cache.get(key)!
  }) as T
}

// Usage
const calculateKinMemoized = memoize(dateToKin)
```

---

### Design Patterns Agent

**Required Patterns:**

**1. Factory Pattern (for components):**
```typescript
interface CardFactory<T> {
  create(data: T): HTMLElement
  recycle(element: HTMLElement): void
}

function createCardFactory(): CardFactory<PersonData> {
  const pool: HTMLElement[] = []

  return {
    create(data) {
      const el = pool.pop() ?? document.createElement('person-card')
      el.setAttribute('data', JSON.stringify(data))
      return el
    },
    recycle(el) {
      el.removeAttribute('data')
      pool.push(el)
    }
  }
}
```

**2. Strategy Pattern (for calculations):**
```typescript
interface CalendarStrategy {
  dateToSign(date: Date): { seal: number; tone: number }
}

const dreamspellStrategy: CalendarStrategy = {
  dateToSign: (date) => {
    const kin = dateToKin(date)
    return { seal: kinToSeal(kin), tone: kinToTone(kin) }
  }
}

const tzolkinStrategy: CalendarStrategy = {
  dateToSign: dateToTzolkin
}
```

**3. Observer Pattern (signals):**
```typescript
// Already implemented in core/state.ts
// Subscribe to changes, automatic cleanup
```

**4. Composite Pattern (for nested components):**
```typescript
interface Renderable {
  render(): HTMLElement
  dispose(): void
}

class CompositeComponent implements Renderable {
  private children: Renderable[] = []

  add(child: Renderable) { this.children.push(child) }

  render() {
    const el = document.createElement('div')
    this.children.forEach(c => el.appendChild(c.render()))
    return el
  }

  dispose() {
    this.children.forEach(c => c.dispose())
    this.children = []
  }
}
```

**5. Builder Pattern (for complex objects):**
```typescript
class PersonCardBuilder {
  private name = ''
  private birthDate?: Date
  private showDreamspell = true
  private showTzolkin = true

  setName(name: string) { this.name = name; return this }
  setBirthDate(date: Date) { this.birthDate = date; return this }
  hideDreamspell() { this.showDreamspell = false; return this }
  hideTzolkin() { this.showTzolkin = false; return this }

  build(): PersonCard {
    if (!this.birthDate) throw new Error('Birth date required')
    return new PersonCard(this.name, this.birthDate, this.showDreamspell, this.showTzolkin)
  }
}
```

**Composability Rules:**
- Every function should do ONE thing
- Every module should have ONE reason to change
- Prefer many small functions over few large ones
- Generic utilities in `lib/utils/`, domain-specific in `lib/calculations/`
- Components should accept data, not fetch it
- State flows down, events flow up

**Reusability Checklist:**
- [ ] Can this function be used elsewhere?
- [ ] Does it depend on specific implementation details?
- [ ] Are parameters generic enough?
- [ ] Is the return type flexible?
- [ ] Can it be composed with other functions?

---

### Calculation Agent

Implements Dreamspell and Tzolkin calculations as **pure functions**.

**Design Principles:**
- Pure functions (no side effects)
- Memoization for expensive operations
- Lookup tables over computation where possible
- Type-safe with branded types

**Branded Types for Safety:**
```typescript
type Brand<T, B> = T & { __brand: B }

type Kin = Brand<number, 'Kin'>           // 1-260
type Seal = Brand<number, 'Seal'>         // 1-20
type Tone = Brand<number, 'Tone'>         // 1-13
type JulianDay = Brand<number, 'JulianDay'>

function asKin(n: number): Kin {
  if (n < 1 || n > 260) throw new RangeError(`Invalid Kin: ${n}`)
  return n as Kin
}
```

**Dreamspell Algorithm:**
```typescript
const EPOCH = new Date(1987, 6, 26)  // July 26, 1987
const EPOCH_KIN = 34

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86400000
  return Math.floor((b.getTime() - a.getTime()) / msPerDay)
}

function countLeapDaysSkipped(start: Date, end: Date): number {
  let count = 0
  const year1 = start.getFullYear()
  const year2 = end.getFullYear()

  for (let y = year1; y <= year2; y++) {
    if (isLeapYear(y)) {
      const feb29 = new Date(y, 1, 29)
      if (feb29 > start && feb29 <= end) count++
    }
  }
  return count
}

export function dateToKin(date: Date): Kin {
  const days = daysBetween(EPOCH, date)
  const leapSkipped = countLeapDaysSkipped(EPOCH, date)
  const adjustedDays = days - leapSkipped
  const kin = ((adjustedDays + EPOCH_KIN - 1) % 260) + 1
  return asKin(kin)
}

export function kinToSeal(kin: Kin): Seal {
  return ((kin - 1) % 20 + 1) as Seal
}

export function kinToTone(kin: Kin): Tone {
  return ((kin - 1) % 13 + 1) as Tone
}
```

**Traditional Tzolkin (GMT Correlation):**
```typescript
const GMT_CORRELATION = 584283

export function gregorianToJulianDay(date: Date): JulianDay {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()

  const a = Math.floor((14 - m) / 12)
  const yAdj = y + 4800 - a
  const mAdj = m + 12 * a - 3

  const jdn = d
    + Math.floor((153 * mAdj + 2) / 5)
    + 365 * yAdj
    + Math.floor(yAdj / 4)
    - Math.floor(yAdj / 100)
    + Math.floor(yAdj / 400)
    - 32045

  return jdn as JulianDay
}

export function dateToTzolkin(date: Date): { seal: Seal; tone: Tone } {
  const jdn = gregorianToJulianDay(date)
  const seal = ((jdn - GMT_CORRELATION + 16) % 20) || 20
  const tone = ((jdn - GMT_CORRELATION + 4) % 13) || 13
  return { seal: seal as Seal, tone: tone as Tone }
}
```

**Oracle Calculator (Memoized):**
```typescript
const analogMap = new Map<Seal, Seal>([
  [1, 17], [2, 19], [3, 18], [4, 8], [5, 10],
  [6, 7], [7, 6], [8, 4], [9, 14], [10, 5],
  [11, 12], [12, 11], [13, 20], [14, 9], [15, 16],
  [16, 15], [17, 1], [18, 3], [19, 2], [20, 13]
] as [number, number][])

export function getAnalog(seal: Seal): Seal {
  return analogMap.get(seal)!
}

export function getAntipode(seal: Seal): Seal {
  return (((seal - 1 + 10) % 20) + 1) as Seal
}

export function getOccult(seal: Seal): Seal {
  return (21 - seal) as Seal
}

export function getGuide(seal: Seal, tone: Tone): Seal {
  const guideOffset = [0, 12, 4, 16, 8][(tone - 1) % 5]
  return (((seal - 1 + guideOffset) % 20) + 1) as Seal
}

export interface Oracle {
  guide: Seal
  analog: Seal
  antipode: Seal
  occult: Seal
}

export function calculateOracle(kin: Kin): Oracle {
  const seal = kinToSeal(kin)
  const tone = kinToTone(kin)

  return {
    guide: getGuide(seal, tone),
    analog: getAnalog(seal),
    antipode: getAntipode(seal),
    occult: getOccult(seal)
  }
}
```

---

## Build & Run

```bash
# Install dev dependencies only
npm install

# Development server (Vite)
npm run dev

# Build for production (outputs to dist/)
npm run build

# Preview production build
npm run preview

# Type check
npm run typecheck

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Validation

- Typecheck: `npm run typecheck`
- Tests: `npm test` (66 unit tests for calculations)
- Manual test: Open in browser, verify 16 cards render

## Operational Notes

- **Zero runtime dependencies** — only dev tools (Vite, TypeScript)
- RTL layout with `dir="rtl"` on root
- Web Components for encapsulation
- CSS Custom Properties for theming
- Pure functions for all business logic
- ES Modules for code splitting

### Codebase Patterns

- `core/` — Reusable infrastructure (signals, base element, DOM helpers)
- `lib/calculations/` — Pure calculation functions
- `lib/data/` — Static lookup tables (seals, tones, mantras)
- `lib/utils/` — Generic utilities
- `components/` — Web Components (UI)

### Key Specs

- `specs/MVP_SCOPE.md` — Requirements and decisions
- `specs/CARD_LAYOUT.md` — Visual design spec
- `specs/DREAMSPELL_SPEC.md` — Dreamspell calculation rules
- `specs/TZOLKIN_SPEC.md` — Traditional Tzolkin rules
- `specs/TEST_DATA.json` — 16 test people

### Validation Dates

Use these to verify calculations:
- July 26, 1987 = Kin 34 (Yellow Galactic Seed)
- Dec 21, 2012 = Kin 207 (Blue Crystal Hand)

### Context7 Rule

**CRITICAL: Before using ANY external library:**
1. First ask: Can this be done with vanilla TypeScript/browser APIs?
2. If library is truly needed, use Context7 MCP to pull the **most recent** documentation
3. Verify the library is actively maintained and minimal in size
4. Check bundle impact — prefer libraries < 5KB gzipped
5. Document WHY the library is necessary

**When to use Context7:**
- Vite configuration (build tool)
- TypeScript configuration
- Any third-party API you must integrate
- Browser APIs you're unfamiliar with (MDN via Context7)

**Default to vanilla for:**
- DOM manipulation (use native APIs)
- State management (use signals pattern)
- Routing (if needed, use History API)
- HTTP requests (use fetch)
- Date handling (use Date, Intl.DateTimeFormat)
- Animation (use CSS transitions, Web Animations API)
