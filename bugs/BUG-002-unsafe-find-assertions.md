# BUG-002: Unsafe Non-null Assertions on .find() Calls

**Severity:** 🟡 Medium  
**Component:** Multiple Components  
**Status:** Open  
**Found:** 2026-02-05  
**Reporter:** QA Agent  

---

## Summary

Multiple files use TypeScript non-null assertions (`!`) on `.find()` results without validation. While currently safe due to data integrity, these could cause runtime crashes if data is corrupted or calculation produces invalid values.

## Affected Files

### Public Pages (Higher Risk)
- `src/app/calculate/page.tsx:26,58,59`
- `src/app/today/page.tsx:31,43,44`
- `src/app/compatibility/page.tsx:202,203,207,208`

### Components
- `src/components/landing/demo.tsx:37,38`

## Example

```typescript
// Current (unsafe)
const seal = SEALS.find(s => s.number === sealNumber)!

// Better (with validation)
const seal = SEALS.find(s => s.number === sealNumber)
if (!seal) throw new Error(`Invalid seal number: ${sealNumber}`)
```

## Risk Analysis

**Current Risk:** Low - The calculation functions (`kinToSeal`, `kinToTone`) return branded types constrained to valid ranges (1-20 for seals, 1-13 for tones), so invalid values are unlikely.

**Potential Risk:** If:
- Calculation logic has a bug
- Data arrays are modified incorrectly
- Invalid input slips through

The app would crash with "Cannot read properties of undefined" instead of a meaningful error message.

## Recommendation

1. Create helper functions that throw descriptive errors:
```typescript
function getSeal(number: SealNumber): Seal {
  const seal = SEALS.find(s => s.number === number)
  if (!seal) throw new Error(`Seal not found: ${number}`)
  return seal
}
```

2. Use existing `getSeal()` and `getTone()` helpers from `lib/data` which already handle this.

## Priority

Low priority for fix since runtime risk is minimal with current architecture. Consider as technical debt cleanup.
