# English-First UI Translation Specification

> **Status:** IN PROGRESS
> **Created:** 2026-01-25
> **Goal:** Make English the primary display language while preserving Hebrew as secondary

---

## Overview

The Omnis application currently displays Hebrew as the primary language in many display components. This spec defines the work needed to make English the primary language while keeping Hebrew as a secondary/supplementary display.

### Principle

```
BEFORE: עיצוב אנושי (Human Design)
AFTER:  Human Design (עיצוב אנושי)
```

- English text should appear FIRST (larger, primary position)
- Hebrew text should appear SECOND (smaller, muted, secondary position)
- Remove `dir="rtl"` from components that don't need it
- Keep Hebrew names/content preserved where culturally appropriate

---

## Scope

### Already Completed (Page-Level)

These pages have been translated to English-first:

| Page | File | Status |
|------|------|--------|
| People List | `src/app/app/people/page.tsx` | DONE |
| Person Detail | `src/app/app/people/[id]/page.tsx` | DONE |
| Relationships | `src/app/app/relationships/page.tsx` | DONE |
| Groups | `src/app/app/groups/page.tsx` | DONE |
| Boards | `src/app/app/boards/page.tsx` | DONE |
| Graph | `src/app/app/graph/page.tsx` | DONE |
| Dashboard | `src/app/app/page.tsx` | DONE |
| Predictions | `src/app/app/predictions/page.tsx` | DONE |

### Needs Translation (Display Components)

These card/display components need English-first translation:

| Component | File | Priority |
|-----------|------|----------|
| DreamspellSection | `src/components/cards/DreamspellSection.tsx` | P1 |
| TzolkinSection | `src/components/cards/TzolkinSection.tsx` | P1 |
| HumanDesignDisplay | `src/components/cards/HumanDesignDisplay.tsx` | P1 |
| AstrologyDisplay | `src/components/cards/AstrologyDisplay.tsx` | P1 |
| GematriaDisplay | `src/components/cards/GematriaDisplay.tsx` | P1 |
| LongCountDisplay | `src/components/cards/LongCountDisplay.tsx` | P2 |
| MayanTimelineDisplay | `src/components/cards/MayanTimelineDisplay.tsx` | P2 |
| WavespellDisplay | `src/components/cards/WavespellDisplay.tsx` | P2 |
| YearlyDisplay | `src/components/cards/YearlyDisplay.tsx` | P2 |
| CrossSystemInsights | `src/components/cards/CrossSystemInsights.tsx` | P2 |
| OracleMap | `src/components/cards/OracleMap.tsx` | P3 |
| MantraDisplay | `src/components/cards/MantraDisplay.tsx` | P3 |
| CastleDisplay | `src/components/cards/CastleDisplay.tsx` | P3 |

---

## Translation Patterns

### Pattern 1: Swapping Primary/Secondary Order

```tsx
// BEFORE
<div className="text-3xl font-bold">{item.nameHebrew}</div>
<div className="text-muted-foreground">{item.name}</div>

// AFTER
<div className="text-3xl font-bold">{item.name}</div>
<div className="text-muted-foreground">{item.nameHebrew}</div>
```

### Pattern 2: Bilingual Labels

```tsx
// BEFORE
<h4>סמכות פנימית / Inner Authority</h4>

// AFTER
<h4>Inner Authority</h4>
// Or if Hebrew is needed:
<h4>Inner Authority <span className="text-muted-foreground text-sm">(סמכות פנימית)</span></h4>
```

### Pattern 3: Inline Values

```tsx
// BEFORE
<span className="font-semibold">{value.hebrewLabel}</span>
<span className="text-sm text-muted-foreground">({value.englishLabel})</span>

// AFTER
<span className="font-semibold">{value.englishLabel}</span>
<span className="text-sm text-muted-foreground">({value.hebrewLabel})</span>
```

### Pattern 4: Remove RTL Direction

```tsx
// BEFORE
<div dir="rtl" className="...">

// AFTER
<div className="...">
```

### Pattern 5: Static Labels

```tsx
// BEFORE
<Label>שם הקבוצה *</Label>
<Button>ביטול</Button>

// AFTER
<Label>Group Name *</Label>
<Button>Cancel</Button>
```

---

## Component-Specific Tasks

### HumanDesignDisplay.tsx

**Current State:** Hebrew-first with `dir="rtl"` on most containers

**Changes Needed:**

1. `MissingBirthTimeMessage` - Swap message order (English first)
2. `BodygraphSummaryCard` - Swap type/strategy/authority/profile order
3. `CenterBadge` - Show English name primary, Hebrew secondary
4. `CenterStateDisplay` - English labels for "Defined"/"Open"
5. `ActivationsDisplay` - English labels for "Personality"/"Design"
6. `ChannelsDisplay` - English channel names primary
7. `HumanDesignMini` - English type name primary

**Labels to Translate:**
- "אסטרטגיה:" → "Strategy:"
- "סמכות פנימית / Inner Authority" → "Inner Authority"
- "פרופיל / Profile" → "Profile"
- "הגדרה / Definition" → "Definition"
- "מרכזים מוגדרים" → "defined centers"
- "ערוצים" → "channels"
- "צלב הגלגול / Incarnation Cross" → "Incarnation Cross"
- "שערים:" → "Gates:"
- "מרכזים / Centers" → "Centers"
- "מוגדר" → "Defined"
- "פתוח" → "Open"
- "אישיות / Personality (מודע)" → "Personality (Conscious)"
- "עיצוב / Design (לא מודע)" → "Design (Unconscious)"
- "נוספים" → "more"
- "אין ערוצים מוגדרים / No defined channels" → "No defined channels"
- "ערוצים מוגדרים" → "Defined Channels"
- "ערוצים נוספים" → "more channels"
- "נדרשת שעת לידה" → "Birth time required"

### AstrologyDisplay.tsx

**Changes Needed:**

1. Chart summary - English zodiac signs primary
2. Planet positions - English planet names primary
3. Aspects - English aspect names primary
4. Balance displays - English element/modality names primary

### GematriaDisplay.tsx

**Changes Needed:**

1. Method names - English primary
2. Letter breakdown - Keep Hebrew letters (content), English labels
3. Notable numbers - English descriptions primary

### DreamspellSection.tsx

**Changes Needed:**

1. Section header - English first
2. Kin name display already shows English first - verify

### TzolkinSection.tsx

**Changes Needed:**

1. Section header - English first
2. Day sign names - English primary

---

## Data Layer Considerations

Many components rely on data that has both English and Hebrew fields:

```typescript
// Example from human-design types
interface TypeDefinition {
  name: string          // "Generator"
  nameHebrew: string    // "גנרטור"
  strategy: string      // "Wait to respond"
  strategyHebrew: string // "המתן לתגובה"
}
```

The components should reference `name` before `nameHebrew`, `strategy` before `strategyHebrew`, etc.

---

## Testing Checklist

After translation, verify:

- [ ] All pages load without errors
- [ ] TypeScript compiles cleanly
- [ ] No broken layouts from removed RTL
- [ ] Hebrew text still displays where needed
- [ ] Date formatting uses English locale (`en-US`)
- [ ] Numbers formatted correctly

---

## Files Summary

### Priority 1 (Core Display Components)

```
src/components/cards/HumanDesignDisplay.tsx
src/components/cards/AstrologyDisplay.tsx
src/components/cards/GematriaDisplay.tsx
src/components/cards/DreamspellSection.tsx
src/components/cards/TzolkinSection.tsx
```

### Priority 2 (Secondary Components)

```
src/components/cards/LongCountDisplay.tsx
src/components/cards/MayanTimelineDisplay.tsx
src/components/cards/WavespellDisplay.tsx
src/components/cards/YearlyDisplay.tsx
src/components/cards/CrossSystemInsights.tsx
```

### Priority 3 (Minor Components)

```
src/components/cards/OracleMap.tsx
src/components/cards/MantraDisplay.tsx
src/components/cards/CastleDisplay.tsx
```

---

## Definition of Done

- [ ] All P1 components translated to English-first
- [ ] All P2 components translated to English-first
- [ ] All P3 components translated to English-first
- [ ] TypeScript compiles without errors
- [ ] Visual review confirms English is primary
- [ ] Hebrew still appears as secondary where appropriate
