# Launch Runbook — #63 Play Store · #64 App Store · #60 Launch

State verified 2026-07-28 via `eas build:list`. This consolidates the store
threads from HANDOFF_2026-07-21_APPSTORE_REVENUECAT_LOGO.md and
HANDOFF_2026-07-23_MERGE_LOGIN_SKIN_STORE_SHOTS.md into one ordered list.
Every remaining blocker is dashboard work behind your credentials/MFA —
automation misfired on Apple's SPA before (documented in the 07-21 handoff),
so these are deliberately manual.

## Verified state

Re-verified 2026-09-03 directly in App Store Connect and Play Console, replacing
the 2026-07-28 table, which was wrong on almost every line — the IAP products all
exist now, and the real blockers moved.

| Piece | State |
|---|---|
| iOS builds | #9, #10, #11 (1.0.0) finished on EAS. **#11 = commit `43e468c`, which predates the Human Design fix `c103651`** — that commit touches `packages/engine` *and* `packages/mobile/src/lib/people/compute.ts`, so every existing build ships the wrong Rave wheel. A build #12 off current HEAD is required before submission. |
| Android build | .aab versionCode 7 finished on EAS (artifact downloadable) |
| ASC record | Created — app `6793060798`, "Pleiad: The Living Map", version 1.0 in Prepare for Submission |
| IAP products | **All 4 exist**, all Prepare for Submission: `pleiad_explorer_monthly`, `pleiad_complete_monthly`, `pleiad_practitioner_monthly` (group `22252675`) and `pleiad_founding_lifetime` (Non-Consumable) |
| Subscription tier order | **Wrong.** Level 1 Explorer → Level 3 Practitioner. Apple reads level 1 as the highest tier, so an Explorer→Practitioner move is classified a downgrade and defers to period end instead of prorating. Must be Practitioner 1, Complete 2, Explorer 3. Drag-reorder in the group's Edit → Edit Level dialog; synthetic drags do not register, so this one is by hand. |
| Money plumbing | **Done.** Paid Apps Agreement Active; Bank Hapoalim BM (ILS, USD royalties) Active; W-8BEN + Certificate of Foreign Status Active; DSA compliance Active for 27 EU countries |
| Apple licence agreement | **Blocking.** "The Apple Developer Program License Agreement has been updated" — the Account Holder must accept before any new submission is possible |
| Pricing | **Set 2026-09-03** — Free (USD 0.00), base US, 175 countries |
| Availability | **Set 2026-09-03** — all 175 countries, Available on App Release |
| Screenshots | **Uploaded 2026-09-03** — 5 at 6.5" (Today, Map, People, Inner Circle, Library). Sources live at `~/Desktop/Pleiad.io/pleiad-shots/` (not `~/Desktop/pleiad-shots/`); they are 1080×2400 Android captures, converted to 1284×2778 by centre-cropping 63px of height then scaling, into `pleiad-shots/ios-6.5/`. Unframed, no headlines. |
| App Privacy | Policy URL set (`https://pleiad.io/privacy`); **data-collection questionnaire never started** |
| Build attached to 1.0 | **None** — see the build row above |
| App Review sign-in | **Empty.** Sign-in is required and passwordless, so review fails without the demo account. `packages/mobile/store.config.js` carries the block; needs `ASC_DEMO_PASSWORD` (from `scripts/create-review-account.mjs`) and `ASC_CONTACT_PHONE` exported, then `npx eas-cli metadata:push` |
| Age rating | Not answered. Deliberately manual — it is a content attestation |
| RevenueCat | Project `369bf568`; `.p8` uploaded; products still not imported |
| Play Console | **Cannot be created yet.** Account `Two Circle Studios` (`8812426242441460658`, personal) exists but Create app is locked: "Complete account verifications to create new apps". Needs, in order — sign in to the Play Console mobile app on a real Android device, identity documents approved by Google, then contact phone verification. Days of latency; iOS is the only near-term revenue path. |
| `STORE_PRODUCT_*` env | Not yet in `.prod.vars` |

## Order of operations

### 1. ASC: create the 4 IAP products — YOU (Aside/dashboard, ~15 min)

First: fix the subscription group localization — automation once set it to
**Arabic**; it must be English (U.S.). Prices as App Store tiers
$4.99 / $8.99 / $28.99 / $78.99. Values from `src/lib/services/billing.ts`:

| Product ID | Type | Duration | Price | Display name | Description |
|---|---|---|---|---|---|
| `pleiad_explorer_monthly` | Auto-renewable, group 22252675 | 1 month | $5 | Explorer | 15 profiles across all 6 systems |
| `pleiad_complete_monthly` | Auto-renewable, group | 1 month | $9 | Complete | 25 profiles, all systems, exports |
| `pleiad_practitioner_monthly` | Auto-renewable, group | 1 month | $29 | Practitioner | Unlimited profiles, groups & API |
| `pleiad_founding_lifetime` | **Non-Consumable** (NOT in the group) | — | $79 | Founding Lifetime | Everything, forever — one-time |

### 2. ASC: push the listing metadata — either of us (CLI)

```
cd packages/mobile && npx eas-cli metadata:push
```

Reads `store.config.json` (title/subtitle/description/keywords/categories/
URLs, en-US). Review the copy first — it's a draft written 2026-07-28.

### 3. RevenueCat wiring — YOU (dashboard, ~10 min)

Import the 4 products (auto-syncs via the `.p8`), attach to entitlements the
code expects (`billing.ts:177`): `explorer`, `complete`, `practitioner`,
`lifetime`. Build one Offering with all four.

### 4. Secrets + redeploy — ME (once products exist)

Already STAGED in gitignored `.prod.vars` (2026-07-22): the four
`STORE_PRODUCT_*` ids, `REVENUECAT_SECRET_KEY` (sk_ v2-format — if the v1
`/v1/subscribers` call 401s on first purchase, switch `revenuecat.ts` to the
v2 `/customers` endpoint), `REVENUECAT_WEBHOOK_SECRET`. At ship time:
`scripts/set-prod-secrets.sh` + `npm run deploy`. RC webhook URL:
`https://pleiad.io/api/billing/webhook`.

### 5. Screenshots — ME (emulator) then YOU (approve)

Capture the missing Circles shot on the `pleiad` AVD (demo people may still
be in the real account — 07-23 handoff §8), then device-frame + headline
all five. Optional: delete the 5 demo people after.

### 6. App Store review — YOU

Apple rule from the 07-21 handoff: **the first subscription group must be
submitted with a new app version** — attach the IAPs to the version
submission, don't submit them separately. Build #9 is already in TestFlight;
create the version in ASC, attach IAPs + screenshots + metadata, submit.
Also still owed before submission: **EU trader status** in ASC.

### 7. Play Console — YOU (record) then ME (everything scriptable after)

Create the app record (Console → Create app → "Pleiad"). After that exists:
upload the v7 .aab (or wire `eas submit -p android` with a service-account
key), and I can draft the data-safety form answers and reuse the ASC listing
copy for the Play listing.

### 8. Launch (#60)

TestFlight external group → soft launch; Play internal testing → production.
Announce per the marketing thread (out of scope here).
