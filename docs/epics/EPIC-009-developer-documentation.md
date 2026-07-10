# EPIC-009: Developer Documentation

**Status:** Proposed
**Created:** 2026-02-05
**Author:** Arc (Product Engineer)
**Phase:** Pre-Launch (Critical)
**Priority:** CRITICAL

---

## Problem Statement

Pleiad has **no README.md** and **no .env.example** file. This means:

1. **New developers cannot set up the project** - No instructions exist
2. **Required environment variables are undocumented** - Developers must reverse-engineer from code
3. **Onboarding takes hours instead of minutes** - Trial and error instead of clear steps
4. **Contributors will give up** - Standard open-source expectation unmet
5. **Security risk** - Developers might commit real secrets without knowing what's required

### Missing Environment Variables (found in codebase)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `RESEND_API_KEY`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_*` variables

## Proposed Solution

### 1. README.md
Create comprehensive README with:
- Project description and purpose
- Tech stack overview
- Prerequisites (Node version, etc.)
- Quick start guide (5 minutes to running)
- Environment setup instructions
- Available scripts (`npm run dev`, `test`, `build`, etc.)
- Project structure overview
- Contributing guidelines link
- License information

### 2. .env.example
Create template with:
- All required environment variables
- Placeholder values (not real secrets)
- Comments explaining each variable
- Grouped by service (Supabase, AI, Email, etc.)

### 3. docs/SETUP.md (detailed)
Extended setup guide with:
- Supabase project creation
- Database migrations
- API key generation for each service
- Local development tips
- Troubleshooting common issues

## Affected Components

| Component | Changes |
|-----------|---------|
| `README.md` | New - Project documentation |
| `.env.example` | New - Environment template |
| `docs/SETUP.md` | New - Detailed setup guide |
| `.gitignore` | Verify - Ensure .env is ignored |

## Success Criteria

- [ ] README.md exists with clear quick start
- [ ] New developer can set up project in <15 minutes
- [ ] .env.example lists ALL required variables
- [ ] Each env var has explanation comment
- [ ] Supabase setup documented
- [ ] All npm scripts documented
- [ ] Project structure explained
- [ ] Prerequisites clearly stated (Node 18+, etc.)
- [ ] Contributing section present
- [ ] License specified

## Tasks (Post-Approval)

1. Audit codebase for all environment variables used
2. Create .env.example with all variables + comments
3. Write README.md quick start section
4. Document tech stack and project purpose
5. List all available npm scripts
6. Create project structure overview
7. Write docs/SETUP.md with detailed instructions
8. Add Supabase setup guide
9. Add troubleshooting section
10. Test setup from scratch on clean machine
11. Add badges (build status, license, etc.)

## .env.example Preview

```bash
# ===========================================
# Pleiad Environment Variables
# Copy this file to .env.local and fill in values
# ===========================================

# --- Supabase ---
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# --- Authentication ---
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# --- AI (Anthropic Claude) ---
ANTHROPIC_API_KEY=sk-ant-...

# --- Email (Resend) ---
RESEND_API_KEY=re_...

# --- Cron Jobs ---
CRON_SECRET=random-secret-for-cron-auth

# --- Optional: Analytics ---
# NEXT_PUBLIC_POSTHOG_KEY=
# NEXT_PUBLIC_POSTHOG_HOST=
```

## README.md Preview

```markdown
# Pleiad 🌟

Symbolic calculation platform combining 6 ancient wisdom systems.

## Quick Start

1. Clone the repo
2. Copy `.env.example` to `.env.local`
3. Fill in your API keys (see Setup Guide)
4. Run `npm install && npm run dev`
5. Open http://localhost:3000

## Tech Stack

- Next.js 15 (App Router)
- Supabase (Auth + Database)
- TypeScript
- Tailwind CSS + shadcn/ui
- Claude AI (interpretations)
```

## Estimated Effort

- **Audit:** 1 hour
- **Writing:** 3-4 hours
- **Testing:** 1 hour
- **Total:** 4-6 hours

## References

- Best README practices: https://readme.so
- Twelve-Factor App (config): https://12factor.net/config
