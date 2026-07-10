# Pleiad Epics

This directory contains feature epic specifications for post-MVP development.

## Epic Status Values

| Status | Meaning |
|--------|---------|
| **Proposed** | Draft, pending review and approval |
| **Approved** | Ready for implementation |
| **In Progress** | Active development |
| **Complete** | Implemented and verified |
| **Deferred** | On hold, may revisit later |

## Current Epics

| Epic | Title | Phase | Priority | Status | Issue |
|------|-------|-------|----------|--------|-------|
| [EPIC-001](./EPIC-001-saas-billing.md) | SaaS Billing Integration | 7 | High | Proposed | |
| [EPIC-002](./EPIC-002-external-readings.md) | External Readings Aggregation | 5.5 | Medium-High | Proposed | |
| [EPIC-003](./EPIC-003-team-workspaces.md) | Team Workspaces | 8 | Medium | Proposed | |
| [EPIC-004](./EPIC-004-authentic-mantras.md) | Authentic Mantras Integration | P2.6 | Medium | Proposed | |
| [EPIC-005](./EPIC-005-design-system-elevation.md) | Design System Elevation | P3.2 | Low-Medium | Proposed | |
| [EPIC-006](./EPIC-006-landing-page-animations.md) | Landing Page Animations | P3.4 | Low | Proposed | |
| [EPIC-007](./EPIC-007-public-api.md) | Public API | 8 | Low | Proposed | |
| [EPIC-008](./EPIC-008-security-vulnerabilities.md) | NPM Security Vulnerability Fixes | Pre-Launch | **CRITICAL** | Proposed | [#8](https://github.com/SaharBarak/Pleiad/issues/8) |
| [EPIC-009](./EPIC-009-developer-documentation.md) | Developer Documentation | Pre-Launch | **CRITICAL** | Proposed | [#9](https://github.com/SaharBarak/Pleiad/issues/9) |
| [EPIC-010](./EPIC-010-cicd-pipeline.md) | CI/CD Pipeline | Pre-Launch | High | Proposed | [#10](https://github.com/SaharBarak/Pleiad/issues/10) |
| [EPIC-011](./EPIC-011-api-hardening.md) | API Hardening (Rate Limiting + Validation) | Pre-Launch | High | Proposed | [#11](https://github.com/SaharBarak/Pleiad/issues/11) |
| [EPIC-012](./EPIC-012-error-monitoring.md) | Error Monitoring (Sentry) | Pre-Launch | Medium | Proposed | [#12](https://github.com/SaharBarak/Pleiad/issues/12) |

## Recommended Implementation Order

### Tier 0: Pre-Launch Critical (MUST DO BEFORE LAUNCH)
1. **EPIC-008: Security Vulnerabilities** - 5 high vulns blocking launch
2. **EPIC-009: Developer Documentation** - README + .env.example
3. **EPIC-010: CI/CD Pipeline** - GitHub Actions for PR checks
4. **EPIC-011: API Hardening** - Rate limiting + Zod validation
5. **EPIC-012: Error Monitoring** - Sentry integration

### Tier 1: Revenue-Critical
6. **EPIC-001: SaaS Billing** - Enables monetization, blocks nothing else

### Tier 2: Growth & Engagement
7. **EPIC-002: External Readings** - Drives daily engagement and SEO
8. **EPIC-004: Authentic Mantras** - Enhances core content quality

### Tier 3: Platform Expansion
9. **EPIC-003: Team Workspaces** - Requires billing (Practitioner tier)
10. **EPIC-007: Public API** - Requires billing (Practitioner tier)

### Tier 4: Polish
11. **EPIC-005: Design System** - Elevates overall UX
12. **EPIC-006: Landing Animations** - Improves conversion

## Creating New Epics

Use the template:

```markdown
# EPIC-XXX: [Title]

**Status:** Proposed
**Created:** YYYY-MM-DD
**Author:** [Name]

---

## Problem Statement
[Why this feature matters]

## Proposed Solution
[What to build]

## Affected Components
[Files/modules impacted]

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Tasks (Post-Approval)
1. Task 1
2. Task 2
```

## Related Documentation

- `/specs/FEATURE_ROADMAP.md` - Feature phases
- `/specs/architecture/` - System architecture specs
- `/IMPLEMENTATION_PLAN.md` - Current implementation status
- `/.beads/issues.jsonl` - Issue tracking (bead format)
