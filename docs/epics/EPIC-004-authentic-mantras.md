# EPIC-004: Authentic Mantras Integration

**Status:** Proposed
**Created:** 2026-02-05
**Author:** Arc (Product Engineer)
**Phase:** P2.6 (Post-MVP Enhancement)
**Priority:** Medium

---

## Problem Statement

The current Dreamspell implementation uses **template mantras** - programmatically generated affirmations based on seal/tone patterns. While functional, these lack the authentic spiritual depth of José Argüelles' original 260 mantras from the Dreamspell Kit.

Per AUTHENTIC_DATA.md, the MVP uses a formula-based approach:
```
"I [action] in order to [quality]"
"[verb]ing [noun]"
"I seal the [category] of [element]"
"With the [toneType] tone of [tone]"
"I am guided by [guideDescription]"
```

The authentic mantras have unique poetic language for each of the 260 kin, which would significantly enhance the spiritual authenticity and user experience.

## Proposed Solution

Source, validate, and integrate the authentic 260 Dreamspell mantras:

### Phase 1: Sourcing
1. Locate authentic Dreamspell Kit mantras (English originals)
2. Verify authenticity against published sources
3. Document source attribution

### Phase 2: Hebrew Translation
1. Professional translation of all 260 mantras
2. Cultural/spiritual adaptation review
3. Validation by Hebrew-speaking Dreamspell practitioners

### Phase 3: Integration
1. Create expanded `mantras-full.ts` with all 260 entries
2. Update MantraDisplay component to use authentic mantras
3. Maintain template fallback for missing entries
4. Add mantra source attribution in UI

### Data Structure
```typescript
interface AuthenticMantra {
  kin: number;           // 1-260
  english: string;       // Original English
  hebrew: string;        // Hebrew translation
  source: string;        // "Dreamspell Kit 1992"
  verified: boolean;     // Authenticated against source
}
```

## Affected Components

| Component | Changes |
|-----------|---------|
| `src/lib/data/mantras-full.ts` | New - Complete 260 mantra dataset |
| `src/lib/data/mantras.ts` | Update - Import from mantras-full, fallback logic |
| `src/components/cards/MantraDisplay.tsx` | Update - Display source, handle missing |
| `src/lib/calculations/dreamspell.ts` | Update - getMantra() to prefer authentic |
| Tests | Update - Add tests for all 260 mantras |

## Success Criteria

- [ ] All 260 authentic English mantras sourced and documented
- [ ] Source attribution verified (Dreamspell Kit, Argüelles)
- [ ] All 260 mantras translated to Hebrew
- [ ] Hebrew translations reviewed by practitioner
- [ ] `mantras-full.ts` contains complete dataset
- [ ] MantraDisplay shows authentic mantra with attribution
- [ ] Template fallback still works if authentic missing
- [ ] Unit tests verify all 260 kin have mantras
- [ ] No regression in existing card rendering

## Tasks (Post-Approval)

1. Research and locate authentic Dreamspell mantra sources
2. Digitize/extract all 260 mantras (if not already digital)
3. Create `mantras-full.ts` with English entries
4. Validate against multiple sources for accuracy
5. Commission/create Hebrew translations
6. Review translations with Dreamspell practitioners
7. Add Hebrew entries to data file
8. Update MantraDisplay component
9. Add source attribution display
10. Update calculation functions
11. Write comprehensive tests
12. Document data sourcing in AUTHENTIC_DATA.md

## Dependencies

- Access to authentic Dreamspell Kit or verified digital source
- Hebrew translator familiar with spiritual/mystical terminology
- Practitioner reviewer for Hebrew validation

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Copyright concerns | Research CC/fair use, cite source, consider reaching out to Law of Time |
| Translation quality | Use specialist translator, practitioner review |
| Source authenticity | Cross-reference multiple editions, community verification |

## Content Preview

Example authentic mantra (Kin 1: Red Magnetic Dragon):
```
"I unify in order to nurture
Attracting being
I seal the input of birth
With the magnetic tone of purpose
I am guided by my own power doubled"
```

vs. Template version:
```
"I [attract] in order to [nurture]
[unifying] [being]
I seal the [input] of [birth]
With the [magnetic] tone of [purpose]
I am guided by my own power doubled"
```

The authentic version has subtle but meaningful differences in word choice and flow.

## Estimated Effort

- **Research/Sourcing:** 1-2 weeks
- **Translation:** 2-3 weeks
- **Integration:** 1 week
- **Total:** 4-6 weeks

## References

- `/specs/AUTHENTIC_DATA.md` - Mantra sourcing requirements
- `/specs/DREAMSPELL_SPEC.md` - System specification
- Law of Time (lawoftime.org) - Official Dreamspell resources
