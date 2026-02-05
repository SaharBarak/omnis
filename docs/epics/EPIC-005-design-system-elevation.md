# EPIC-005: Design System Elevation

**Status:** Proposed
**Created:** 2026-02-05
**Author:** Arc (Product Engineer)
**Phase:** P3.2 (Future Enhancement)
**Priority:** Low-Medium

---

## Problem Statement

The current Omnis UI is functional but has been described as a "generic admin template" rather than the intended "mystical but clean" aesthetic. Per DESIGN_SYSTEM.md (marked PARTIAL), the basic implementation is complete but advanced features are pending:

- Inconsistent spacing scale
- Typography lacks hierarchy
- Colors are default Tailwind, not branded
- No visual focal points or information architecture
- Missing the "mystical" quality that matches the spiritual content
- Animations/transitions are basic or missing

Users working with symbolic/spiritual systems expect a visual experience that reflects the depth of the content.

## Proposed Solution

Elevate the design system from "functional admin" to "mystical but clean":

### 1. Color System
- Define Omnis brand palette (cosmic/mystical theme)
- System-specific accent colors (Dreamspell purple, Tzolkin earth tones, etc.)
- Light/dark mode refinement
- Semantic color tokens

### 2. Typography Scale
- Define type scale (fluid typography)
- Heading hierarchy with mystical character
- Body text optimization for readability
- Hebrew typography refinement

### 3. Spacing & Layout
- 8px grid system
- Consistent component spacing
- Card/panel rhythm
- Responsive breakpoints refinement

### 4. Visual Language
- Subtle cosmic/celestial motifs
- Glassmorphism for panels
- Gradient accents (aurora/nebula inspired)
- Icon style consistency

### 5. Motion Design
- Page transitions
- Micro-interactions (hover, focus, click)
- Loading states (cosmic/orbital spinners)
- Scroll animations (subtle parallax)

### 6. Component Polish
- Button variants with personality
- Card elevation and shadows
- Form inputs with focus states
- Modal/dialog aesthetics

## Affected Components

| Component | Changes |
|-----------|---------|
| `tailwind.config.ts` | Update - Extended theme with brand colors, spacing |
| `src/app/globals.css` | Update - CSS custom properties, animations |
| `src/lib/styles/tokens.ts` | New - Design token definitions |
| `src/components/ui/*` | Update - All base components |
| `src/components/cards/*` | Update - Card visual polish |
| All pages | Update - Apply new spacing/typography |

## Success Criteria

- [ ] Brand color palette defined with semantic tokens
- [ ] Typography scale implemented with fluid sizing
- [ ] 8px spacing grid consistently applied
- [ ] Light/dark mode both feel polished
- [ ] System-specific color accents (6 systems, 6 accent sets)
- [ ] Loading states feel cosmic/mystical
- [ ] Page transitions smooth and intentional
- [ ] Micro-interactions on interactive elements
- [ ] Cards have depth and hierarchy
- [ ] Mobile experience is polished, not just responsive
- [ ] Accessibility maintained (contrast, focus visible)
- [ ] Style guide documentation updated

## Tasks (Post-Approval)

1. Audit current design inconsistencies
2. Create mood board for "mystical but clean" aesthetic
3. Define color palette and semantic tokens
4. Implement color system in Tailwind config
5. Define and implement typography scale
6. Create spacing system documentation
7. Design cosmic loading/spinner animations
8. Implement micro-interactions library
9. Polish all `ui/` components
10. Update card components with new visual language
11. Add page transitions
12. Create component showcase/storybook
13. Update DESIGN_SYSTEM.md to COMPLETE
14. Accessibility audit

## Design References

### Color Inspiration
- Cosmos/nebula imagery
- Northern lights gradients
- Zodiac wheel colors
- Mayan calendar earth/sky tones

### Typography Inspiration
- Clean modern with subtle mystical hints
- Serif for headings (gravitas)
- Sans-serif for body (readability)
- Hebrew: Modern with traditional echo

### Motion Inspiration
- Orbital movements
- Star field parallax
- Gentle pulsing (breathing)
- Reveal animations

## Estimated Effort

- **Design Exploration:** 1 week
- **Token Definition:** 1 week
- **Implementation:** 3-4 weeks
- **Testing/Polish:** 1 week
- **Total:** 6-7 weeks

## References

- `/specs/DESIGN_SYSTEM.md` - Current spec (PARTIAL)
- `/specs/components/DESIGN_SYSTEM_V2.md` - Enhanced spec
