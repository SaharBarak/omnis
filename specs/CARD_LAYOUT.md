# A5 Card Layout Specification

> **Status:** COMPLETE
> **Phase:** 0 (MVP)
> **Implemented:** PersonCard, OracleMap, MantraDisplay, DreamspellSection, TzolkinSection

## Dimensions

- **Size:** A5 (148mm x 210mm) or equivalent screen ratio (1:1.414)
- **Orientation:** Portrait
- **Direction:** LTR (English)

---

## Visual Structure

```
+------------------------------------------+
|                                          |
|              [NAME - Large]              |
|                  Lior                    |
|                                          |
+------------------------------------------+
|                                          |
|        According to the Dreamspell       |
|                                          |
|              +-----------+               |
|              |   Guide   |               |
|              |     R     |               |
|              +-----------+               |
|                    |                     |
|  +-----------+ +-----------+ +-----------+
|  | Antipode  | |    KIN    | |  Analog   |
|  |     Y     |<|     B     |>|     G     |
|  +-----------+ +-----------+ +-----------+
|                    |                     |
|              +-----------+               |
|              |  Occult   |               |
|              |     P     |               |
|              +-----------+               |
|                                          |
|  "I unify in order to dream..."          |
|                                          |
+------------------------------------------+
|                                          |
|         According to the Tzolkin         |
|                                          |
|         +---------------------+          |
|         |                     |          |
|         |       Moon  7       |          |
|         |                     |          |
|         |    Muluc - Moon     |          |
|         |                     |          |
|         +---------------------+          |
|                                          |
+------------------------------------------+
```

---

## Sections

### 1. Header (Top ~15%)
- Person's name in large text
- Centered
- Font: Bold, ~32px equivalent

### 2. Dreamspell Section (~55%)
- Section title
- Oracle map in cross pattern:
  - Central icon: ~64px
  - Oracle icons: ~48px each
  - Connection lines/arrows optional
- Mantra text below map:
  - English text

### 3. Tzolkin Section (~30%)
- Section title
- Sign icon: ~64px
- Tone number: displayed next to icon
- Name stack:
  - Mayan (e.g., "Muluc")
  - English (e.g., "Moon")

---

## Typography

| Element | Size | Weight | Alignment |
|---------|------|--------|-----------|
| Name | 32px | Bold | Center |
| Section title | 14px | Medium | Center |
| Mantra | 16px | Regular | Center |
| Sign name | 18px | Medium | Center |

---

## Colors (MVP - Simple)

- Background: White (#FFFFFF)
- Text: Dark gray (#1F2937)
- Section dividers: Light gray (#E5E7EB)
- Icons: Full color as designed

---

## Component Hierarchy (Web Components)

```html
<person-card name="Lior" birth-date="1966-09-23">
  <!-- Shadow DOM renders: -->
  <div class="card">
    <header class="card-header">
      <h1>Lior</h1>
    </header>

    <section class="dreamspell-section">
      <h2>According to the Dreamspell</h2>
      <oracle-map kin="123">
        <seal-icon slot="guide" seal="5"></seal-icon>
        <seal-icon slot="antipode" seal="15"></seal-icon>
        <seal-icon slot="kin" seal="5"></seal-icon>
        <seal-icon slot="analog" seal="10"></seal-icon>
        <seal-icon slot="occult" seal="16"></seal-icon>
      </oracle-map>
      <mantra-display kin="123"></mantra-display>
    </section>

    <section class="tzolkin-section">
      <h2>According to the Tzolkin</h2>
      <tzolkin-sign seal="9" tone="7"></tzolkin-sign>
    </section>
  </div>
</person-card>
```

---

## Responsive Behavior

For MVP:
- Fixed A5 proportions
- Scale to fit viewport
- No mobile-specific layouts yet

---

## CSS (Vanilla with Custom Properties)

```css
person-card {
  display: block;
  width: var(--card-width, 148mm);
  height: var(--card-height, 210mm);
  background: var(--bg-card);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  border-radius: var(--radius-lg);
  overflow: hidden;
  direction: ltr;
}

.card-header {
  padding-block: var(--space-6);
  text-align: center;
  border-block-end: 1px solid var(--border);
}

.person-name {
  font-family: var(--font-head);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.section-title {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
  text-align: center;
  padding-block: var(--space-2);
}

oracle-map {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: var(--space-2);
  place-items: center;
  /* Guide: row 1, col 2 | Antipode: row 2, col 1 | Kin: row 2, col 2 | Analog: row 2, col 3 | Occult: row 3, col 2 */
}

mantra-display {
  display: block;
  text-align: center;
  padding-inline: var(--space-4);
  padding-block: var(--space-2);
}

.mantra-text {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-primary);
}
```

---
