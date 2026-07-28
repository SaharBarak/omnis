# Launch Runbook — #63 Play Store · #64 App Store · #60 Launch

State verified 2026-07-28 via `eas build:list`. This consolidates the store
threads from HANDOFF_2026-07-21_APPSTORE_REVENUECAT_LOGO.md and
HANDOFF_2026-07-23_MERGE_LOGIN_SKIN_STORE_SHOTS.md into one ordered list.
Every remaining blocker is dashboard work behind your credentials/MFA —
automation misfired on Apple's SPA before (documented in the 07-21 handoff),
so these are deliberately manual.

## Verified state

| Piece | State |
|---|---|
| iOS build | #9 (1.0.0) finished, **submitted to TestFlight** — ASC app 6793060798 |
| Android build | .aab versionCode 7 finished on EAS (artifact downloadable) |
| ASC record | Created; subscription group "Pleiad Subscriptions" `22252675` exists |
| IAP products | **0 of 4 created** — the main open thread |
| RevenueCat | Project `369bf568`; `.p8` uploaded; products not imported (nothing to import yet) |
| Play Console | **App record does not exist** |
| Screenshots | 4 of 5 at `~/Desktop/pleiad-shots/` (`01_today 02_people 03_map 04_person`); Circles pending; framing/headlines pending |
| ASC listing copy | Ready to push: `packages/mobile/store.config.json` (see step 2) |
| `STORE_PRODUCT_*` env | Not yet in `.prod.vars` (blocked on products existing) |

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
