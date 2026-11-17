/**
 * Analytics identity and environment — the part shared by the browser layer
 * (`posthog.ts`) and the server layer (`server.ts`). No SDK import, so both
 * runtimes and the tests can load it.
 *
 * Spec: docs/analytics/north-star.md.
 */

/** This site's slug in the shared PostHog project. Never changes once events carry it. */
export const SITE = 'pleiad'

export const ANALYTICS_ENVS = ['production', 'preview', 'development'] as const
export type AnalyticsEnv = (typeof ANALYTICS_ENVS)[number]

export const KEY_VAR = 'NEXT_PUBLIC_POSTHOG_KEY'
const DEFAULT_HOST = 'https://us.i.posthog.com'

function asEnv(value: string | undefined): AnalyticsEnv | null {
  return ANALYTICS_ENVS.find((env) => env === value) ?? null
}

/**
 * `env` is decided at build or deploy time, never from the hostname:
 * the explicit variable, else the host platform's, else the build mode.
 */
export function resolveEnv(source: {
  explicit?: string
  platform?: string
  nodeEnv?: string
}): AnalyticsEnv {
  return (
    asEnv(source.explicit) ??
    asEnv(source.platform) ??
    (source.nodeEnv === 'development' ? 'development' : 'production')
  )
}

/** Next inlines each `NEXT_PUBLIC_*` read at build time, so they are spelled out. */
export function analyticsEnv(): AnalyticsEnv {
  return resolveEnv({
    explicit: process.env.NEXT_PUBLIC_POSTHOG_ENV,
    platform: process.env.NEXT_PUBLIC_VERCEL_ENV,
    nodeEnv: process.env.NODE_ENV,
  })
}

export function analyticsKey(): string | null {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY || null
}

export function analyticsHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST || DEFAULT_HOST
}

/** Local builds report only when asked to, so `next dev` stays quiet by default. */
export function isReportingEnv(env: AnalyticsEnv): boolean {
  return env !== 'development' || process.env.NEXT_PUBLIC_POSTHOG_DEV === '1'
}

/** The properties every event carries. Callers cannot pass these keys. */
export type ReservedProperties = { site: typeof SITE; env: AnalyticsEnv }
export type WithoutReserved = { [K in keyof ReservedProperties]?: never }

export function reservedProperties(): ReservedProperties {
  return { site: SITE, env: analyticsEnv() }
}

/** Reserved keys are spread last, so an event's own properties never win. */
export function withReserved<P extends object>(properties?: P): P & ReservedProperties {
  return { ...(properties as P), ...reservedProperties() }
}

/**
 * The one place an identified id is built: `<site>:user:<auth provider id>`.
 * Browser `identify` and every server capture call this, so the two always
 * agree and ids from different sites in the shared project cannot collide.
 */
export function distinctIdFor(userId: string): string {
  return `${SITE}:user:${userId}`
}

export function missingConfigMessage(variable: string): string {
  return `${variable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${variable} is configured`
}
