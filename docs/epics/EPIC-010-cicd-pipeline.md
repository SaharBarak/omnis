# EPIC-010: CI/CD Pipeline

**Status:** Proposed
**Created:** 2026-02-05
**Author:** Arc (Product Engineer)
**Phase:** Pre-Launch (High Priority)
**Priority:** HIGH

---

## Problem Statement

Omnis has **no CI/CD pipeline** for code quality:

1. **No automated tests on PR** - Broken code can merge
2. **No lint checks** - Code style inconsistencies creep in
3. **No type checking** - TypeScript errors slip through
4. **No build verification** - PRs might break production build
5. **Only PM workflow exists** - GitHub Actions for project management only

Without CI/CD:
- Bugs reach production undetected
- Code review burden increases
- Refactoring is risky
- Multiple developers can't work safely in parallel

## Proposed Solution

### GitHub Actions Workflows

#### 1. PR Checks (`.github/workflows/ci.yml`)
Runs on every pull request:
- **Lint**: `npm run lint`
- **Type Check**: `npm run type-check` (tsc --noEmit)
- **Unit Tests**: `npm test` (when tests exist)
- **Build**: `npm run build`

#### 2. Main Branch Protection
- Require CI to pass before merge
- Require 1 review (optional for solo dev)
- No direct pushes to main

#### 3. Deployment Preview (Future)
- Vercel preview deployments (likely already configured)
- Add comment with preview URL to PR

### Workflow Structure

```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run type-check

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
```

## Affected Components

| Component | Changes |
|-----------|---------|
| `.github/workflows/ci.yml` | New - Main CI workflow |
| `package.json` | Update - Add `type-check` script |
| GitHub Settings | Update - Branch protection rules |

## Success Criteria

- [ ] CI workflow runs on every PR
- [ ] Lint errors block merge
- [ ] TypeScript errors block merge
- [ ] Build failures block merge
- [ ] Tests run (even if minimal)
- [ ] CI completes in <5 minutes
- [ ] Branch protection enabled on main
- [ ] Status checks visible on PRs
- [ ] Caching speeds up repeat runs

## Tasks (Post-Approval)

1. Create `.github/workflows/ci.yml`
2. Add `type-check` script to package.json
3. Test workflow on a sample PR
4. Configure branch protection rules
5. Add npm caching to speed up CI
6. Create test placeholder if no tests exist
7. Add CI status badge to README
8. Document CI in contributing guide

## Workflow Details

### Caching Strategy
```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### Environment Secrets
For build to succeed, add to GitHub Secrets:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Other `NEXT_PUBLIC_*` variables

### Future Enhancements
- [ ] E2E tests with Playwright
- [ ] Code coverage reports
- [ ] Bundle size tracking
- [ ] Lighthouse performance checks
- [ ] Dependency vulnerability scanning
- [ ] Auto-merge Dependabot PRs (patch only)

## Estimated Effort

- **Setup:** 1-2 hours
- **Testing:** 1 hour
- **Branch Protection:** 30 minutes
- **Total:** 3-4 hours

## References

- GitHub Actions: https://docs.github.com/en/actions
- Next.js CI example: https://nextjs.org/docs/pages/building-your-application/testing
