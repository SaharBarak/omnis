# E2E harness (session 2026-07-28/29)

Playwright suite driving the real app on `localhost:3100` with a real
account created through the public signup form.

- `signup.mjs` — signs in (or signs up) `sahar.h.barak+e2e@gmail.com` via
  the /login UI and saves Playwright `state.json`. Password + state live
  OUTSIDE git: `~/Desktop/pleiad-v2-testing/e2e-harness/` (`.e2e-password`,
  `state.json`). Point `here`-relative files there or run from that dir.
- `run-e2e.mjs` — 17 checks (landing, today board, typography audit,
  Dreamspell calendar, bodygraph viewport fit, couple map, boards tier
  gate, Hebrew calendar). Screenshots → `~/Desktop/pleiad-v2-testing/`.

Setup: `npm i playwright @supabase/supabase-js` + `npx playwright install
chromium-headless-shell`, dev server on :3100 (`npx next dev -p 3100`;
:3000 belongs to another project). Do NOT commit `.e2e-password`,
`state.json`, or `results.json`.
