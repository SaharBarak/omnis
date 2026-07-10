# Next Steps (2026-07-07)

Transcribed from 12 reels (buildwithnico launch-checklist series + 1) and
converted to work items. Source captions in scratchpad reels/; the
actionable content is fully captured here.

## Blocked on domain purchase (pleiad.app decision pending)

1. **Domain launch checklist** — split app domain from marketing domain
   (app.* vs www); TWO extra email subdomains (mail.* transactional,
   notify.* marketing) so the root domain's reputation stays clean even
   if flagged; hello@/support@/noreply@ in Resend; Google Search Console
   indexing + sitemap submit. Execute together with the Pleiad rename
   (Auth0 callbacks, Paddle webhook, canonicals, EMAIL_FROM, secrets).
2. **Resend end-to-end** (task #14) — account + API key + domain verify
   are user steps; code is ready (EMAIL_FROM centralized).

## Not blocked — in progress / queued

3. **PostHog product analytics + funnel** (#17) — env-gated scaffold;
   funnel: landing → calculate → signup → onboarding → first person →
   first share. User creates the PostHog project + key.
4. **Turnstile bot defense** (#18) — newsletter subscribe first; robots
   already handled (llms.txt, AI allowlist, /app noindex).
5. **Founding lifetime deal** (#19) — Paddle one-time price (sandbox),
   plan 'lifetime' = Complete entitlements forever; launch-capital play.
6. **Onboarding get-to-value checklist** (#20) — extend the dashboard
   profile checklist to: first person → relationship → map → share link.
7. **Billing webhook reliability** (#21) — Paddle adaptation of
   t3dotgg/stripe-recommendations: idempotent webhook, don't trust event
   payload ordering (re-fetch subscription from API), re-sync on login.
8. **Marketing skills repo** (#22) — coreyhaines' 42 AI marketing skills;
   pick launch plays, document in docs/marketing/.
9. **shadcn blocks dashboard polish** (#23, optional).

## Already satisfied (no task)

- **Merchant of record** — Paddle IS the MoR (reel 8's warning is about
  raw Stripe).
- **robots.txt** — done in the SEO pass (a1e7b05).

## Standing backlog (earlier sessions)

- Maps roadmap (docs/redesign/MAPS_ROADMAP.md): Resonance Matrix →
  Composite Bodygraph/Penta → Circle Calendar (+moon integration done as
  /app/moon) → Tzolkin Galaxy.
- Add-ons + one-time AI packs (deferred product decision).
- Supabase region migration (user: create eu-central-1 project or
  `npx supabase login`).
- GEMINI_API_KEY (AI interpret 503 until set).
- Paddle checkout E2E on live origin; business verification → live keys.
- Knowledge corpus ingestion (dormant per user).
