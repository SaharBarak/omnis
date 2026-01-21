# Omnis Phase 1 Implementation Plan

> **Status:** IN PROGRESS - Core features complete, testing pending
> **Last Updated:** 2026-01-21
> **Goal:** Transform MVP into usable product with OAuth, persistence, and People Directory

---

## Executive Summary

Phase 1 migrates the vanilla TypeScript MVP to Next.js 14 + Supabase, adding:
- OAuth authentication (Google + Email Magic Link)
- User profiles with birth data
- People directory (CRUD, tags, search)
- Saved computed results
- Basic dashboard shell with RTL support

### Progress Overview

| Category | Status | Details |
|----------|--------|---------|
| Next.js 14 Setup | COMPLETE | TypeScript, Tailwind, shadcn/ui |
| Calculation Logic | COMPLETE | Migrated from MVP (dreamspell, tzolkin, oracle, julian) |
| Supabase Config | COMPLETE | Client, server, middleware configured |
| Database Schema | COMPLETE | profiles, people, tags, computed_results with RLS |
| Authentication | COMPLETE | Google OAuth + Email Magic Link + Onboarding |
| People Directory | COMPLETE | CRUD, tags, search, filters |
| Dashboard Shell | COMPLETE | RTL, Hebrew fonts, sidebar navigation |
| Computed Results | PENDING | Storage and retrieval hooks |
| End-to-End Testing | PENDING | Requires Supabase project setup |

**Build Status:** Passing (npm run build succeeds)

---

## Completed Tasks

### 1. Next.js 14 Project Setup
- Created Next.js 14 app with TypeScript
- Configured Tailwind CSS
- Installed shadcn/ui components (button, input, card, form, dialog, dropdown-menu, avatar, badge, separator, tabs, sheet)
- Added Hebrew fonts (Heebo, Assistant)
- Set up RTL support in root layout

### 2. MVP Calculation Logic Migration
- Copied `src/lib/calculations/` (dreamspell, tzolkin, oracle, julian)
- Copied `src/lib/data/` (seals, tones, tzolkin-signs, mantras)
- Copied `src/lib/types/` and `src/core/types.ts`
- Updated imports to remove `.ts` extensions

### 3. Supabase Configuration
- Created client utilities (`src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`)
- Defined database types (`src/lib/supabase/database.types.ts`)
- Created Next.js middleware for auth protection (`middleware.ts`)
- Created environment template (`.env.local.example`)

### 4. Database Schema
- Created migration file (`supabase/migrations/00001_initial_schema.sql`)
- Tables: profiles, people, tags, person_tags, computed_results
- Indexes for search and filtering
- Full-text search on people names
- Row Level Security (RLS) policies for all tables
- Auto-update triggers for timestamps
- System tags pre-populated (family, partner, friend, colleague, child, parent)

### 5. Authentication
- Login page with Google OAuth button
- Email Magic Link form with Hebrew UI
- Auth callback handler (`/auth/callback`)
- Onboarding flow (3 steps: name, birth date, Hebrew name)
- Auth hook (`useAuth`) with session management
- Protected route middleware

### 6. People Directory
- List view with search and tag filters
- Add/Edit person dialog forms
- Delete confirmation
- Tag badges with colors
- Dreamspell Kin calculation display
- `usePeople` hook for CRUD operations

### 7. Dashboard Shell
- RTL layout with Hebrew fonts
- Responsive sidebar navigation (desktop + mobile sheet)
- User menu with avatar and dropdown
- Dashboard page with feature cards
- Profile page with symbolic data display

---

## Pending Tasks

### Task: Computed Results Storage
**Priority:** P1
**Status:** PENDING
**Estimated:** 30 minutes

**Implementation needed:**
1. Create `src/lib/hooks/use-computed-results.ts`
2. Auto-compute on person creation/update
3. Display in people cards and profile

### Task: End-to-End Testing
**Priority:** P1
**Status:** PENDING (Requires Supabase project)

**Prerequisites:**
1. Create Supabase project at https://supabase.com
2. Copy project URL and anon key to `.env.local`
3. Run migration SQL in Supabase SQL Editor
4. Enable Google OAuth in Supabase dashboard
5. Enable Email authentication

**Verification checklist:**
- [ ] `npm run dev` starts without errors
- [ ] Login page shows Google OAuth + email form
- [ ] Auth callback creates profile
- [ ] Onboarding flow completes
- [ ] Dashboard loads for authenticated users
- [ ] People CRUD works
- [ ] Profile shows symbolic data
- [ ] Sign out works

---

## File Structure (Phase 1)

```
src/
├── app/
│   ├── (app)/                    # Protected routes
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── page.tsx              # Dashboard home
│   │   ├── people/page.tsx       # People directory
│   │   └── profile/page.tsx      # User profile
│   ├── auth/callback/route.ts    # OAuth callback handler
│   ├── login/page.tsx            # Login page
│   ├── onboarding/page.tsx       # Onboarding flow
│   ├── layout.tsx                # Root layout (RTL, fonts)
│   └── page.tsx                  # Landing page
├── components/ui/                # shadcn/ui components
├── lib/
│   ├── calculations/             # MVP calculation logic
│   ├── data/                     # MVP data files
│   ├── hooks/
│   │   ├── use-auth.ts           # Auth hook
│   │   └── use-people.ts         # People CRUD hook
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── server.ts             # Server Supabase client
│   │   ├── middleware.ts         # Session refresh
│   │   └── database.types.ts     # TypeScript types
│   └── utils.ts                  # shadcn/ui utilities
├── core/types.ts                 # Branded types
middleware.ts                     # Next.js middleware
supabase/migrations/
└── 00001_initial_schema.sql      # Database schema
```

---

## Environment Setup

### Required Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Supabase Dashboard Configuration

1. **Google OAuth:** Authentication > Providers > Google
2. **Email Authentication:** Authentication > Providers > Email (enable OTP)
3. **Database:** SQL Editor > Run migration file

---

## Commands

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run test          # Run calculation tests
npm run typecheck     # TypeScript type checking
```

---

## Notes

- Build requires placeholder Supabase credentials (`.env.local`)
- MVP calculation tests still work (66 tests in src-mvp)
- Hebrew translations for seals/tones not yet migrated (P2)

---

## Out of Scope (Future Phases)

- Phase 2: Relationship graph
- Phase 3: Multi-system expansion
- Phase 4: Canvas editor
- Phase 5: Predictions
- Phase 6: AI layer
