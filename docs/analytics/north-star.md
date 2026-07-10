# Pleiad — North Star Metric

> Per the "product analytics" reel (#9 in `docs/playbooks/ship-your-app.md`):
> pick one metric that captures **delivered value** and steer by it. For a living
> map of the people who shape your life, value = the map growing *and being used*
> relationally — not raw signups.

## North Star: Weekly Active Mappers (WAM)

**Definition:** the number of users who, in a rolling 7-day window, took a core
map action — **added a person** (`person_created`) **or created/opened a group
reading** (the lead "fused group dynamics" feature).

**Why this one:**
- It sits on the product's actual value (the map filling in + being read),
  not a vanity proxy like registrations.
- It's a leading indicator of both **retention** (people come back to map more)
  and **revenue** (mappers convert; the paywall gates depth/group features).
- It rewards the *lead* feature (group/fused readings), keeping the roadmap
  honest to the map-first thesis.

## Input metrics (the drivers to move WAM)

| Driver | Definition | Instrumented? |
|---|---|---|
| Activation rate | signup → first `person_created` | ✅ funnel |
| Map depth | avg people per active user | derive from `person_created` |
| Group-reading rate | % of mappers who create/open a group | ⚠️ add `group_created` event |
| Virality | `share_created` per active user | ✅ funnel |
| Retention | WAM week N / week N-1 | derive |

## Activation funnel (already instrumented)

`landing_cta_clicked → calculate_completed → signup_started →
onboarding_completed → person_created → share_created`

All six are typed in `src/lib/analytics/posthog.ts` (`FunnelEvent`) and fire at
their call sites. Build the funnel in PostHog (Insights → Funnel) once the prod
`NEXT_PUBLIC_POSTHOG_KEY` is set, in that order, to see drop-off.

## Counter-metric (guardrail)

Don't optimize signups at the expense of activation. A signup that never maps a
person is not value — watch WAM / signups, not signups alone.

## Recommended next instrumentation

Add a `group_created` (and optionally `group_reading_viewed`) event to
`FunnelEvent` and the group-creation flow, so the lead feature is measurable in
WAM directly rather than inferred.
