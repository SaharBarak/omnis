# PROJECT CONTEXT: Pleiad Phase 1

**Pleiad** is a personal symbolic mapping platform showing Dreamspell and Tzolkin data for people.

**Phase 1 Goal:** Transform MVP into a usable product with:
- OAuth login (Google, Apple, Email Magic Link)
- User profiles with birth data
- People directory (add/edit/remove people, tags)
- Saved computed results
- Basic dashboard shell

**Key Specs:**
- `specs/FEATURE_ROADMAP.md` — Phase overview
- `specs/components/AUTHENTICATION.md` — Auth spec
- `specs/components/PEOPLE_DIRECTORY.md` — People directory spec
- `specs/architecture/DATABASE.md` — Database schema
- `specs/MVP_SCOPE.md` — Original MVP requirements

**Tech Stack:** Next.js 14 + TypeScript + Tailwind + shadcn/ui + Supabase

**Migration Note:** MVP used vanilla TS + Web Components + Vite. Reuse:
- `src/lib/calculations/` — Pure TypeScript calculation logic
- `src/lib/data/` — Seals, tones, mantras data
- `public/icons/` — SVG icons (20 Dreamspell seals, 20 Tzolkin signs)

---

# RALPH INSTRUCTIONS

0a. Study `specs/*` with up to 500 parallel Sonnet subagents to learn the application specifications.
0b. Study @IMPLEMENTATION_PLAN.md — this is your task list for Phase 1.
0c. For reference, the MVP source code is in `src/*` — reuse calculation logic and data files.

1. Your task is to implement Phase 1 per the specifications using parallel subagents. Follow @IMPLEMENTATION_PLAN.md and complete tasks in order (1.1 → 1.2 → 1.3 → etc). Before making changes, search the codebase using Sonnet subagents. Use up to 500 parallel Sonnet subagents for searches/reads and only 1 Sonnet subagent for build/tests. Use Opus subagents when complex reasoning is needed (debugging, architectural decisions).

2. After implementing functionality, test it thoroughly. For Phase 1:
   - `npm run dev` should start without errors
   - Auth flows should work end-to-end
   - People CRUD should work with RLS
   - Run existing tests: `npm run test`

3. When you discover issues, immediately update @IMPLEMENTATION_PLAN.md with your findings using a subagent. When resolved, update and remove the item.

4. When tasks pass their "Definition of Done", update @IMPLEMENTATION_PLAN.md, then `git add -A` then `git commit` with a message describing the changes. After the commit, `git push`.

5. **IMPORTANT: Set up Supabase first.** Before coding auth:
   - Create a Supabase project at supabase.com
   - Note the project URL and anon key
   - Create `.env.local` with the keys
   - Enable Google OAuth in Supabase dashboard
   - Enable Email Magic Link in Supabase dashboard

6. **IMPORTANT: Keep MVP calculation logic.** The Dreamspell and Tzolkin calculations are correct and tested. Copy them to the new Next.js project structure.

99999. Important: When authoring documentation, capture the why — tests and implementation importance.
999999. Important: Single sources of truth, no migrations/adapters. If tests unrelated to your work fail, resolve them as part of the increment.
9999999. As soon as a phase is complete with no build or test errors, create a git tag (e.g., v1.1.0 for Phase 1.1 complete).
99999999. You may add extra logging if required to debug issues.
999999999. Keep @IMPLEMENTATION_PLAN.md current with learnings using a subagent — future work depends on this to avoid duplicating efforts. Update especially after finishing your turn.
9999999999. When you learn something new about how to run the application, update @AGENTS.md using a subagent but keep it brief.
99999999999. For any bugs you notice, resolve them or document them in @IMPLEMENTATION_PLAN.md using a subagent even if it is unrelated to the current piece of work.
999999999999. Implement functionality completely. Placeholders and stubs waste efforts and time redoing the same work.
9999999999999. When @IMPLEMENTATION_PLAN.md becomes large periodically clean out the items that are completed from the file using a subagent.
99999999999999. If you find inconsistencies in the specs/* then use an Opus 4.5 subagent with 'ultrathink' requested to update the specs.
999999999999999. IMPORTANT: Keep @AGENTS.md operational only — status updates and progress notes belong in `IMPLEMENTATION_PLAN.md`. A bloated AGENTS.md pollutes every future loop's context.
