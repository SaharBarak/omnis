# Ship Your App — Indie-SaaS Launch Playbook

> Distilled from 12 Instagram reels (mostly **Nico — @buildwithnico**, one from
> **Mike** running 3 SaaS at ~$200k/mo, one startup-strategy clip). Transcribed
> locally (yt-dlp + faster-whisper) on 2026-07-09. Nothing here is invented —
> each item cites the reel it came from.
>
> Callouts marked **→ Pleiad** map each lesson to our current stack
> (Paddle billing, PostHog analytics, Auth0, Cloudflare Workers, Resend, Next.js).

---

## 1. Domains & DNS

**Split the app domain from the main (marketing) domain.** Point a `CNAME`
record named `app` at wherever the app is hosted, so `app.yourdomain.com` is the
product and `yourdomain.com` is the marketing site. *(Reel 1)*

Why:
- Marketing/design teams can work on the homepage (often in a website builder)
  without ever touching the app codebase. *(Reel 1)*
- Makes hiring a designer to build/design the marketing site much easier. *(Reel 1)*

**Get public pages indexed.** Once the homepage is on the main domain, add a
`sitemap.xml` listing all public pages, then submit it in Google Search Console
so Google indexes them. *(Reel 1)*

→ **Pleiad:** `robots.ts` exists in `src/app`. Confirm a `sitemap.xml`/route
lists public pages (landing, pricing, learn/*, blog) and that it's submitted to
Search Console. Decide the app-vs-marketing split against the new `pleiad.io`
domain during the OmnisX→Pleiad domain migration.

---

## 2. Email Deliverability — the 3-inbox setup

Set up **three** email identities so a spam flag never poisons your main domain.
*(Reels 1 & 4)*

1. **App / automated email** — signups, billing, password resets, anything
   automated. Host on a **subdomain** (e.g. `mail.app.yourdomain.com`). If it
   ever gets flagged for spam, the main domain stays clean. *(Reels 1, 4)*
2. **Main / human inbox** — contact, support, personal. Can live on the main
   domain, but **protect it**: don't send automated mail from it. *(Reel 4)*
3. **Marketing email** — newsletters, campaigns. Also on a **subdomain**, so
   campaigns can't drag down the main domain's reputation. *(Reels 1, 4)*

How:
- Configure each sending subdomain with **SPF, DKIM, and DMARC**. *(Reel 1)*
- Use a provider like **Resend** so mail is authenticated and unlikely to be
  flagged in the first place — Resend itself recommends this split. *(Reels 1, 4)*

→ **Pleiad:** we already send via `src/lib/email/from.ts` (newsletter, daily-kin
cron, unsubscribe). Resend API key is a pending item in the session handoff.
When wiring the new domain, set up the app-mail subdomain + SPF/DKIM/DMARC before
first send. Email addresses currently on `omnis.app` — migrate deliberately
(note `pleiad.app` is owned by someone else, so pick `pleiad.io` addresses).

---

## 3. Bots & Security

Two layers, for two kinds of bots. *(Reel 2)*

1. **Good bots → `robots.txt`** in the app root. Tells crawlers which paths to
   crawl/skip. Stripe, Anthropic, OpenAI all ship one. Don't over-worry if the
   app is mostly behind a login. A text file will **not** stop malicious bots. *(Reel 2)*
2. **Bad bots → Cloudflare Turnstile.** Free, and you don't have to host on
   Cloudflare to use it. Prevents data scraping without making users solve
   endless "find the bus" CAPTCHAs. *(Reel 2)*

→ **Pleiad:** we're already on Cloudflare Workers, so Turnstile is a natural add
on public forms (signup, newsletter, contact) to block scraping/abuse. `robots.ts`
already present.

---

## 4. Payments & Billing

### 4a. The Stripe "split-brain" bug *(Reel 7)*
When a user pays, the payment's source-of-truth state lives **in Stripe**, but
apps try to keep their own DB in sync by listening to and handling a stream of
Stripe webhook messages. This desync is what Theo (t3.gg) calls the **split
brain** — the #1 Stripe mistake. *(Reel 7)*
- Fix reference: search **`t3.gg Stripe Recommendations`** on GitHub, or Theo's
  YouTube video ("I fix Stripe"). *(Reel 7)*

### 4b. Merchant of Record — VAT / sales tax *(Reel 8)*
With international users you're responsible for reporting **VAT and sales tax**
in each user's country. On a basic 2.9% Stripe integration, **you** are the
merchant of record and carry that liability — ignoring it causes serious trouble
later. *(Reel 8)*
- Stripe's own MoR option ("managed payments") handles it but costs **+3.5% on
  top of the 2.9%** transaction fee. *(Reel 8)*
- Alternative: **Polar** — built on Stripe, handles merchant-of-record for you,
  cheaper, easier, and manages tiered subscriptions. *(Reel 8)*

→ **Pleiad:** we use **Paddle**, which is *already* a merchant of record — VAT/sales
tax is handled for us, so 4b is covered by our stack choice. The split-brain
lesson (4a) still applies to **any** provider: our billing webhook
(`src/app/api/billing/webhook`) must treat the provider's state as the single
source of truth (this matches our existing "Paddle state is the only truth" commit).
Keep `omnis_user_id`/`omnis_plan` customData keys stable — they're the sync contract.

### 4c. Lifetime deals — early capital + feedback *(Reel 5)*
Consider launching with a **lifetime deal**: a one-time payment (e.g. $59–$100+)
for permanent access. *(Reel 5)*
- Benefits: early capital to reinvest, and fast user feedback to improve the app. *(Reel 5)*
- Distribution: **AppSumo** has >1M people hunting these deals — ideal for B2B.
  Even without it, LTDs are a good early growth + validation strategy. *(Reel 5)*
- Implementation: use **Polar or Stripe** — add a one-time purchase and attach a
  benefit/entitlement to gate access. *(Reel 5)*

→ **Pleiad:** we already ship a **"Founding Lifetime — $79 once"** offer (existing
billing commit). This reel validates that call. AppSumo is a distribution channel
worth evaluating if we lean B2B / practitioner.

---

## 5. Onboarding & Activation

Add an **onboarding checklist** in-app to shorten **time-to-value** and get users
to the **aha moment** fast — the pattern Stripe, Revolut, and Linear all use. *(Reel 6)*

How:
- No good free shadcn block existed, so Nico built one (offers the code); or
  screenshot a reference and have Claude generate it. *(Reel 6)*
- **Persist checklist state in a database** so progress survives across sessions. *(Reel 6)*

→ **Pleiad:** `src/app/onboarding/page.tsx` exists. Ensure completion state is
persisted (Supabase) per-user, and that the checklist drives toward the core
"map your people" aha moment, not generic setup steps.

---

## 6. Analytics

### 6a. Product analytics + a North Star metric *(Reel 9)*
Vibe-coders forget product analytics; it's the first thing to add. It shows how
users actually interact with the app. Define **one North Star metric** to steer
decisions and optimize toward. *(Reel 9)*
- Example given: a Twitch-alternative tracked **minutes watched** and **minutes
  streamed**. Pick a metric that captures delivered value. *(Reel 9)*

### 6b. Funnel analytics with PostHog *(Reel 11)*
See exactly where users drop off. *(Reel 11)*
1. Create a PostHog project; paste the tracking snippet into the `<head>`
   (supports Framer, Next, etc.). It tracks source, actions, dwell time. *(Reel 11)*
2. Click through your own funnel so PostHog registers the events (open form,
   interact, submit). *(Reel 11)*
3. Build a funnel view from those events — e.g. `pageviewed → cta_clicked →
   form_field_interaction → form_submission`. *(Reel 11)*
- PostHog is free, open-source, and has a built-in AI to query your data. *(Reel 11)*

→ **Pleiad:** PostHog is **already scaffolded** with a six-step signup funnel
(existing commit), env-gated. This reel is our confirmation + a checklist to
verify events fire and a North Star metric is defined (candidate: *people added
to a map* or *first fused group reading*).

---

## 7. UI — dashboards that don't look AI-generated *(Reel 10)*

Build good-looking dashboards in <10 min: *(Reel 10)*
1. Pick a **shadcn dashboard block** you like; copy its prompt into Claude Code. *(Reel 10)*
2. Prompt Claude to adapt the block to your use case. *(Reel 10)*
3. Replace demo data with your real data (Convex used in the reel for speed; any
   DB works). *(Reel 10)*

shadcn = a customizable **foundation for your design system**. *(Reel 10)*

→ **Pleiad:** we already have a design-token system (`landing-tokens.ts`,
`system-flavors.ts`). Use shadcn blocks as scaffolding but reskin to the Pleiad
violet/celestial language — never ship the default look.

---

## 8. Marketing & Distribution

**Distribution beats a perfect app** — a flawless product with no distribution is
not a business. *(Reel 3)*

Tool: **coreyhaines' GitHub repo of 42 AI marketing skills.** *(Reel 3)*
- One **context skill** holds all the facts about your app; the other 41 read
  that context and give tailored advice. *(Reel 3)*
- Most useful two: *(Reel 3)*
  - **`launch`** — launch checklist, step-by-step launch strategy, Product Hunt
    playbook.
  - **`marketing ideas`** — reads your context, recommends next actions from
    >130 proven SaaS marketing ideas.
- Setup: create a folder, open it in Claude Code, use the install prompt (or
  terminal), then `/reload skills` and run `/product-marketing` to start. *(Reel 3)*

→ **Pleiad:** this exact repo is already vendored at
`docs/marketing/playbooks/` (analytics, copywriting, cro, launch, onboarding,
pricing, signup…). Wire the context skill with Pleiad's facts and run
`/product-marketing` before launch.

---

## 9. Startup Strategy — vocabulary, then action *(Reel 12)*

Concepts a founder should know: **TAM/SAM/SOM, beachhead market, network effects,
switching costs, competitive advantage, barriers to entry, market timing,
category creation, vertical vs horizontal SaaS, platform models, marketplaces,
aggregators, red ocean vs blue ocean.** *(Reel 12)*

The point of the clip: knowing the vocabulary is table stakes — **action is the
only thing that makes any of it valuable.** *(Reel 12)*

---

## Consolidated Launch Checklist

Ship-blocking items, grouped. Check against Pleiad before launch.

### Infrastructure
- [ ] Split app domain (`app.pleiad.io` via CNAME) from marketing domain (`pleiad.io`)
- [ ] `sitemap.xml` lists all public pages
- [ ] Submit sitemap to Google Search Console
- [ ] `robots.txt` / `robots.ts` configured (present — verify)
- [ ] Cloudflare Turnstile on public forms (signup, newsletter, contact)

### Email
- [ ] App/automated email on a subdomain
- [ ] Main/human inbox protected; no automated sends from it
- [ ] Marketing email on a subdomain
- [ ] SPF + DKIM + DMARC on every sending subdomain
- [ ] Sending via Resend (API key pending) — verify not flagged
- [ ] Migrate `omnis.app` addresses → `pleiad.io`

### Payments
- [ ] Provider state = single source of truth (avoid split-brain) — verify webhook
- [ ] Merchant-of-record handled (✓ via Paddle)
- [ ] Founding Lifetime deal live (✓ $79 once) — consider AppSumo if B2B
- [ ] Keep `omnis_user_id`/`omnis_plan` customData keys stable

### Activation
- [ ] In-app onboarding checklist driving to the "map your people" aha moment
- [ ] Onboarding state persisted per-user in DB

### Analytics
- [ ] PostHog live (✓ scaffolded) — verify events fire
- [ ] Six-step signup funnel view built in PostHog (✓) — confirm drop-off visibility
- [ ] Define a single North Star metric (candidate: people mapped / first fused reading)

### Growth
- [ ] Wire coreyhaines context skill with Pleiad facts
- [ ] Run `/product-marketing`; execute `launch` skill (PH playbook, checklist)

---

## Tools & Resources referenced

| Tool | Use | Reel |
|---|---|---|
| Resend | Authenticated transactional/marketing email | 1, 4 |
| Cloudflare Turnstile | Free bot/scraping protection | 2 |
| coreyhaines 42 AI marketing skills (GitHub) | AI-assisted marketing (`launch`, `marketing ideas`) | 3 |
| AppSumo | Lifetime-deal distribution (>1M buyers, B2B) | 5 |
| Polar | Merchant-of-record billing on Stripe, tiered subs, LTDs | 5, 8 |
| shadcn (blocks) | Design-system foundation, dashboard blocks | 6, 10 |
| t3.gg Stripe Recommendations (GitHub) / Theo "I fix Stripe" | Fix Stripe split-brain sync | 7 |
| Stripe managed payments | Stripe's own MoR (+3.5%) | 8 |
| PostHog | Product + funnel analytics (free, OSS, AI query) | 9, 11 |
| Convex | Fast DB for dashboards/demos | 10 |
| Google Search Console | Index public pages | 1 |

### Source reels
1. `DaSpPVGsu-o` · 2. `DaQGd3kMiyV` · 3. `DadAs7rO-KV` · 4. `DaAiIwqs34q` ·
5. `DZ44PyhMSVe` · 6. `DZ2R37uM6nT` · 7. `DZxJrsmsjPE` · 8. `DZmz-gGsAqG` ·
9. `DZkKt_5u2aE` · 10. `DZaHDWLs6RG` · 11. `DZFc1axs51T` · 12. `DZVPs-ARxMP`

Full raw transcripts + captions archived in the session scratchpad
(`reels/transcripts.md`, `transcripts.json`).
