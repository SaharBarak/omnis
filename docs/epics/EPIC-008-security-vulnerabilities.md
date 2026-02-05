# EPIC-008: NPM Security Vulnerability Fixes

**Status:** Proposed
**Created:** 2026-02-05
**Author:** Arc (Product Engineer)
**Phase:** Pre-Launch (Critical)
**Priority:** CRITICAL

---

## Problem Statement

`npm audit` reports **5 high-severity vulnerabilities** in production dependencies:

1. **jspdf** - PDF generation library with known security issues
2. **Next.js** - Core framework needs update (likely 14.x → 15.x)
3. **glob** - File pattern matching with prototype pollution risk

These vulnerabilities:
- Expose users to potential attacks
- Block enterprise/compliance customers
- Are visible to anyone running `npm audit`
- Could be exploited in AI/export features

This is a **blocker for production launch**.

## Proposed Solution

### Immediate Actions
1. Run `npm audit` to get full vulnerability report
2. Update Next.js to latest stable (15.x)
3. Update or replace jspdf with secure alternative
4. Update glob and related dependencies
5. Re-audit until 0 high/critical vulnerabilities

### Dependency Strategy
- Prefer `npm audit fix` for compatible updates
- Manual updates for breaking changes
- Replace deprecated packages with maintained alternatives
- Pin versions to prevent regression

### Testing
- Full regression test after updates
- Verify PDF export still works
- Verify all routes function correctly
- Check bundle size impact

## Affected Components

| Component | Changes |
|-----------|---------|
| `package.json` | Update - Dependency versions |
| `package-lock.json` | Update - Lock file refresh |
| PDF export feature | Verify - May need code changes if jspdf API changed |
| All pages | Verify - Next.js upgrade compatibility |

## Success Criteria

- [ ] `npm audit` returns 0 high/critical vulnerabilities
- [ ] Next.js updated to latest stable version
- [ ] jspdf updated or replaced with secure alternative
- [ ] glob and transitive dependencies updated
- [ ] All existing features work after updates
- [ ] PDF export functionality verified
- [ ] Build succeeds with no errors
- [ ] No new TypeScript errors introduced

## Tasks (Post-Approval)

1. Run `npm audit --json` to document current state
2. Create branch for security updates
3. Run `npm audit fix` for auto-fixable issues
4. Manually update Next.js (follow migration guide)
5. Update/replace jspdf
6. Update glob dependencies
7. Run full test suite
8. Manual QA of critical paths
9. Document any breaking changes addressed
10. Merge and deploy

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking changes in Next.js | Medium | Follow migration guide, test thoroughly |
| PDF export breaks | Low | Test exports before/after |
| Build failures | Medium | Fix incrementally, not all at once |
| New vulnerabilities appear | Low | Set up Dependabot for ongoing monitoring |

## Estimated Effort

- **Analysis:** 1 hour
- **Updates:** 2-4 hours
- **Testing:** 2-4 hours
- **Total:** 1 day

## References

- `npm audit` output
- Next.js migration guide: https://nextjs.org/docs/upgrading
- jspdf alternatives: pdf-lib, pdfmake
