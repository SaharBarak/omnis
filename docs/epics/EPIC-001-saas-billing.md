# EPIC-001: SaaS Billing Integration

**Status:** Proposed
**Created:** 2026-02-05
**Author:** Arc (Product Engineer)
**Phase:** 7 (SaaS Monetization)
**Priority:** High

---

## Problem Statement

Omnis MVP is complete with all 6 calculation systems working, but there's no revenue model. Users get unlimited access to everything for free. The detailed BILLING.md spec exists but hasn't been implemented. Without billing:

- No sustainable business model
- No ability to fund hosting/AI costs
- No differentiation between casual users and power users/practitioners
- No incentive for users to upgrade or convert

The spec defines three tiers (Free/$0, Complete/$9, Practitioner/$29) with meaningful feature gates designed to convert free users while providing genuine value at each tier.

## Proposed Solution

Implement Stripe-based subscription billing with the three-tier model defined in `/specs/architecture/BILLING.md`:

### Free Tier ($0)
- 1 profile (self only)
- Dreamspell system only
- No exports, AI, boards, timeline, or relationships

### Complete Tier ($9/mo)
- 10 profiles
- All 6 systems
- 30 AI interpretations/month
- 5 boards, basic sharing

### Practitioner Tier ($29/mo)
- Unlimited profiles, AI, boards
- Group analysis
- API access
- Advanced analytics

### Key Components
1. **Stripe Integration**: Checkout, webhooks, customer portal
2. **Feature Gates**: Middleware checking subscription status
3. **Usage Tracking**: AI tokens, profiles, boards per user
4. **Upgrade Flows**: Contextual CTAs when hitting limits
5. **Billing UI**: Settings page with plan management

## Affected Components

| Component | Changes |
|-----------|---------|
| `src/lib/services/billing.ts` | New - Stripe API integration |
| `src/lib/services/usage.ts` | New - Usage tracking & limits |
| `src/app/api/billing/` | New - Webhook handlers, checkout sessions |
| `src/app/app/settings/billing/` | New - Subscription management UI |
| `src/components/billing/` | New - PlanSelector, UsageDisplay, UpgradeCTA |
| `src/middleware.ts` | Update - Feature gate checks |
| Database | New tables: subscriptions, usage_logs |

## Success Criteria

- [ ] Users can subscribe to Complete/Practitioner plans via Stripe Checkout
- [ ] Feature gates block access based on subscription tier
- [ ] Usage tracking enforces AI/profile/board limits
- [ ] Webhook handles subscription lifecycle (create, update, cancel)
- [ ] Billing settings page shows current plan and usage
- [ ] Upgrade CTAs appear contextually when hitting limits
- [ ] Stripe Customer Portal accessible for self-service
- [ ] Free trial flow (7 days of Complete tier)
- [ ] ILS/USD currency support

## Tasks (Post-Approval)

1. Set up Stripe account and configure products/prices
2. Create database migrations for subscriptions table
3. Implement Stripe service (`lib/services/billing.ts`)
4. Create webhook endpoint (`api/billing/webhook/route.ts`)
5. Implement checkout session API (`api/billing/checkout/route.ts`)
6. Build usage tracking service
7. Add feature gate middleware
8. Create billing settings UI
9. Build upgrade CTA components
10. Implement free trial logic
11. Add Stripe Customer Portal redirect
12. Write integration tests
13. Load test webhook reliability

## Dependencies

- Stripe account and API keys
- Environment variables: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_IDS`

## Estimated Effort

- **Development:** 3-4 weeks
- **Testing:** 1 week
- **Total:** 4-5 weeks

## References

- `/specs/architecture/BILLING.md` - Full billing specification
- Stripe Docs: https://stripe.com/docs
