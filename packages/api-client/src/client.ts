import type {
  AiInterpretRequest,
  AiInterpretation,
  BillingActionResult,
  Board,
  ComputedResult,
  GroupWithMembers,
  Group,
  KnowledgeSearchResult,
  NotificationSettings,
  PaidPlanTier,
  PeopleList,
  Person,
  PersonRelationshipEdge,
  Profile,
  PublicShare,
  Relationship,
  RelationshipWithPeople,
  SharedView,
  Subscription,
} from './types'
import type {
  ComputedResultUpsertInput,
  GroupCreateInput,
  GroupPatchInput,
  PersonCreateInput,
  PersonPatchInput,
  ProfileUpdateInput,
  RelationshipCreateInput,
  RelationshipPatchInput,
  ShareCreateInput,
} from './schemas'

/**
 * Platform-agnostic Pleiad API client — pure fetch, JSON only, no framework
 * dependency. Server truth: route handlers under src/app/api/** and the
 * contracts in specs/mobile/DATA_MODEL.md §2.
 *
 * Auth: when `getAccessToken` resolves to a token, requests carry
 * `Authorization: Bearer <token>` (AUTH-M1). Public endpoints (share by
 * token, knowledge search) never attach it.
 */

export interface PleiadClientOptions {
  /** Origin of the API, e.g. https://pleiad.io — trailing slash tolerated. */
  baseUrl: string
  /** Resolves the current access token, or null when signed out. */
  getAccessToken?: () => Promise<string | null>
  /** Fetch implementation override (tests, React Native polyfills). */
  fetchFn?: typeof fetch
  /**
   * Invoked once when a request comes back 401 — the trigger for a token
   * refresh / sign-out flow. Re-armed by the next successful request, so a
   * burst of failures notifies a single time.
   */
  onUnauthorized?: () => void | Promise<void>
}

/**
 * Uniform error contract (DATA_MODEL §2): 400 `{error:'Invalid input',
 * details}` · 401 `{error}` · 403 `{error, code:'limit_exceeded'}` · 404 ·
 * 409 · 410 · 429 · 500. Every non-2xx response is normalized to this class.
 */
export class PleiadApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: unknown

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message)
    this.name = 'PleiadApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  /** 403 with code 'limit_exceeded' — route to the paywall, not a toast. */
  get isLimitExceeded(): boolean {
    return this.status === 403 && this.code === 'limit_exceeded'
  }
}

type Query = Record<string, string | number | boolean | undefined>

interface RequestOptions {
  method?: string
  body?: unknown
  query?: Query
  /** Public endpoints skip the token lookup entirely. */
  auth?: boolean
}

interface ErrorBody {
  error?: unknown
  code?: unknown
  details?: unknown
  [key: string]: unknown
}

function buildUrl(baseUrl: string, path: string, query?: Query): string {
  let url = baseUrl.replace(/\/+$/, '') + path
  if (query) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params.set(key, String(value))
    }
    const qs = params.toString()
    if (qs) url += `?${qs}`
  }
  return url
}

function toApiError(status: number, statusText: string, body: ErrorBody | null): PleiadApiError {
  const message =
    body && typeof body.error === 'string' && body.error.length > 0
      ? body.error
      : statusText || `Request failed with status ${status}`
  const code = body && typeof body.code === 'string' ? body.code : undefined
  // details carries the zod issues on 400; other structured payloads (e.g.
  // the public share's { requiresPassword: true }) surface as the body rest.
  let details = body?.details
  if (details === undefined && body) {
    const { error: _error, code: _code, details: _details, ...rest } = body
    if (Object.keys(rest).length > 0) details = rest
  }
  return new PleiadApiError(status, message, code, details)
}

export function createPleiadClient(options: PleiadClientOptions) {
  const { baseUrl, getAccessToken, onUnauthorized } = options
  const fetchFn = options.fetchFn ?? fetch

  // Re-armed on success so overlapping 401s notify exactly once.
  let unauthorizedNotified = false

  async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, query, auth = true } = opts

    const headers: Record<string, string> = { Accept: 'application/json' }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (auth && getAccessToken) {
      const token = await getAccessToken()
      if (token) headers.Authorization = `Bearer ${token}`
    }

    const response = await fetchFn(buildUrl(baseUrl, path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as ErrorBody | null
      if (response.status === 401 && onUnauthorized && !unauthorizedNotified) {
        unauthorizedNotified = true
        await onUnauthorized()
      }
      throw toApiError(response.status, response.statusText, errorBody)
    }

    unauthorizedNotified = false
    return (await response.json()) as T
  }

  return {
    profile: {
      /** GET /api/profile — bootstrap; creates users+profiles on first call. */
      async get(): Promise<Profile> {
        const { profile } = await request<{ profile: Profile }>('/api/profile')
        return profile
      },
      /** PATCH /api/profile — onboarding completion mirrors the self person. */
      async update(updates: ProfileUpdateInput): Promise<Profile> {
        const { profile } = await request<{ profile: Profile }>('/api/profile', {
          method: 'PATCH',
          body: updates,
        })
        return profile
      },
    },

    people: {
      /** GET /api/people — the user's people plus their tag vocabulary. */
      list(): Promise<PeopleList> {
        return request<PeopleList>('/api/people')
      },
      /** POST /api/people — 403 code 'limit_exceeded' at the plan cap. */
      async create(input: PersonCreateInput): Promise<Person> {
        const { person } = await request<{ person: Person }>('/api/people', {
          method: 'POST',
          body: input,
        })
        return person
      },
      /** PATCH /api/people/[id]. */
      async update(
        id: string,
        input: Omit<PersonPatchInput, 'action'>
      ): Promise<Person> {
        const { person } = await request<{ person: Person }>(`/api/people/${id}`, {
          method: 'PATCH',
          body: input,
        })
        return person
      },
      /** PATCH /api/people/[id] with action 'restore' — clears soft delete. */
      async restore(id: string): Promise<void> {
        await request<{ ok: true }>(`/api/people/${id}`, {
          method: 'PATCH',
          body: { action: 'restore' },
        })
      },
      /** DELETE /api/people/[id] — soft by default, hard with permanent. */
      async delete(id: string, opts?: { permanent?: boolean }): Promise<void> {
        await request<{ ok: true }>(`/api/people/${id}`, {
          method: 'DELETE',
          query: opts?.permanent ? { permanent: 'true' } : undefined,
        })
      },
    },

    computedResults: {
      /** GET /api/computed-results?personId=... */
      async listForPerson(personId: string): Promise<ComputedResult[]> {
        const { results } = await request<{ results: ComputedResult[] }>(
          '/api/computed-results',
          { query: { personId } }
        )
        return results
      },
      /** GET /api/computed-results?personIds=a,b — batch read. */
      async listForPeople(personIds: string[]): Promise<ComputedResult[]> {
        const { results } = await request<{ results: ComputedResult[] }>(
          '/api/computed-results',
          { query: { personIds: personIds.join(',') } }
        )
        return results
      },
      /** POST /api/computed-results — upsert per (person, system, version). */
      async upsert(input: ComputedResultUpsertInput): Promise<ComputedResult> {
        const { result } = await request<{ result: ComputedResult }>(
          '/api/computed-results',
          { method: 'POST', body: input }
        )
        return result
      },
      /** DELETE /api/computed-results?personId=... — invalidate all results. */
      async deleteForPerson(personId: string): Promise<number> {
        const { deletedCount } = await request<{ deletedCount: number }>(
          '/api/computed-results',
          { method: 'DELETE', query: { personId } }
        )
        return deletedCount
      },
    },

    relationships: {
      /** GET /api/relationships — enriched with both people. */
      async list(): Promise<RelationshipWithPeople[]> {
        const { relationships } = await request<{
          relationships: RelationshipWithPeople[]
        }>('/api/relationships')
        return relationships
      },
      /** POST /api/relationships — 409 on a duplicate pair+type. */
      async create(input: RelationshipCreateInput): Promise<Relationship> {
        const { relationship } = await request<{ relationship: Relationship }>(
          '/api/relationships',
          { method: 'POST', body: input }
        )
        return relationship
      },
      /** PATCH /api/relationships/[id]. */
      async update(id: string, input: RelationshipPatchInput): Promise<Relationship> {
        const { relationship } = await request<{ relationship: Relationship }>(
          `/api/relationships/${id}`,
          { method: 'PATCH', body: input }
        )
        return relationship
      },
      /** DELETE /api/relationships/[id]. */
      async delete(id: string): Promise<void> {
        await request<{ ok: true }>(`/api/relationships/${id}`, { method: 'DELETE' })
      },
      /** GET /api/relationships/person/[id] — edges anchored on one person. */
      async forPerson(personId: string): Promise<PersonRelationshipEdge[]> {
        const { relationships } = await request<{
          relationships: PersonRelationshipEdge[]
        }>(`/api/relationships/person/${personId}`)
        return relationships
      },
    },

    groups: {
      /** GET /api/groups. */
      async list(): Promise<Group[]> {
        const { groups } = await request<{ groups: Group[] }>('/api/groups')
        return groups
      },
      /** POST /api/groups. */
      async create(input: GroupCreateInput): Promise<Group> {
        const { group } = await request<{ group: Group }>('/api/groups', {
          method: 'POST',
          body: input,
        })
        return group
      },
      /** GET /api/groups/[id] — group plus its member projections. */
      async get(id: string): Promise<GroupWithMembers> {
        const { group } = await request<{ group: GroupWithMembers }>(
          `/api/groups/${id}`
        )
        return group
      },
      /** PATCH /api/groups/[id]. */
      async update(id: string, input: GroupPatchInput): Promise<Group> {
        const { group } = await request<{ group: Group }>(`/api/groups/${id}`, {
          method: 'PATCH',
          body: input,
        })
        return group
      },
      /** DELETE /api/groups/[id]. */
      async delete(id: string): Promise<void> {
        await request<{ ok: true }>(`/api/groups/${id}`, { method: 'DELETE' })
      },
      /** POST /api/groups/[id]/members with personId — adds one member (409 dup). */
      async addMember(id: string, personId: string): Promise<void> {
        await request<{ ok: true }>(`/api/groups/${id}/members`, {
          method: 'POST',
          body: { personId },
        })
      },
      /** POST /api/groups/[id]/members with personIds — REPLACES the member set. */
      async setMembers(id: string, personIds: string[]): Promise<void> {
        await request<{ ok: true }>(`/api/groups/${id}/members`, {
          method: 'POST',
          body: { personIds },
        })
      },
      /** DELETE /api/groups/[id]/members?personId=... */
      async removeMember(id: string, personId: string): Promise<void> {
        await request<{ ok: true }>(`/api/groups/${id}/members`, {
          method: 'DELETE',
          query: { personId },
        })
      },
    },

    shares: {
      /** GET /api/shares. */
      async list(): Promise<SharedView[]> {
        const { shares } = await request<{ shares: SharedView[] }>('/api/shares')
        return shares
      },
      /** POST /api/shares — token + password hash are server-minted. */
      async create(input: ShareCreateInput): Promise<SharedView> {
        const { share } = await request<{ share: SharedView }>('/api/shares', {
          method: 'POST',
          body: input,
        })
        return share
      },
      /** PATCH /api/shares/[id] — toggle active. */
      async update(id: string, input: { active?: boolean }): Promise<SharedView> {
        const { share } = await request<{ share: SharedView }>(`/api/shares/${id}`, {
          method: 'PATCH',
          body: input,
        })
        return share
      },
      /** DELETE /api/shares/[id]. */
      async delete(id: string): Promise<void> {
        await request<{ ok: true }>(`/api/shares/${id}`, { method: 'DELETE' })
      },
    },

    share: {
      /**
       * GET /api/share/[token] — public, no auth. 404 gone/inactive, 410
       * expired/capped, 401 details `{ requiresPassword: true }`.
       */
      get(token: string): Promise<PublicShare> {
        return request<PublicShare>(`/api/share/${token}`, { auth: false })
      },
      /** POST /api/share/[token] { password } — unlock a protected share. */
      unlock(token: string, password: string): Promise<PublicShare> {
        return request<PublicShare>(`/api/share/${token}`, {
          method: 'POST',
          body: { password },
          auth: false,
        })
      },
    },

    boards: {
      /** GET /api/boards — v1 read-only on mobile. */
      async list(): Promise<Board[]> {
        const { boards } = await request<{ boards: Board[] }>('/api/boards')
        return boards
      },
      /** GET /api/boards/recent?limit=... */
      async recent(limit?: number): Promise<Board[]> {
        const { boards } = await request<{ boards: Board[] }>('/api/boards/recent', {
          query: limit !== undefined ? { limit } : undefined,
        })
        return boards
      },
    },

    ai: {
      /**
       * POST /api/ai/interpret — 10/min/user rate limit (429), 403 quota
       * (code 'limit_exceeded'), 503 when no AI key is configured.
       */
      async interpret(input: AiInterpretRequest): Promise<AiInterpretation> {
        const { data } = await request<{ success: true; data: AiInterpretation }>(
          '/api/ai/interpret',
          { method: 'POST', body: input }
        )
        return data
      },
    },

    knowledge: {
      /** POST /api/knowledge/search — public, 60/min/IP, query 2–200 chars. */
      async search(query: string, limit?: number): Promise<KnowledgeSearchResult[]> {
        const { results } = await request<{ results: KnowledgeSearchResult[] }>(
          '/api/knowledge/search',
          { method: 'POST', body: { query, limit }, auth: false }
        )
        return results
      },
    },

    billing: {
      /** GET /api/billing/subscription — `refresh` forces a Paddle re-sync. */
      getSubscription(opts?: { refresh?: boolean }): Promise<Subscription> {
        return request<Subscription>('/api/billing/subscription', {
          query: opts?.refresh ? { refresh: '1' } : undefined,
        })
      },
      /** DELETE /api/billing/subscription — cancel at period end. */
      cancelSubscription(): Promise<BillingActionResult> {
        return request<BillingActionResult>('/api/billing/subscription', {
          method: 'DELETE',
        })
      },
      /** PATCH /api/billing/subscription — clear a scheduled cancellation. */
      reactivateSubscription(): Promise<BillingActionResult> {
        return request<BillingActionResult>('/api/billing/subscription', {
          method: 'PATCH',
        })
      },
      /** POST /api/billing/checkout — returns a hosted checkout URL to open. */
      checkout(plan: PaidPlanTier): Promise<{ url: string }> {
        return request<{ url: string }>('/api/billing/checkout', {
          method: 'POST',
          body: { plan },
        })
      },
      /** POST /api/billing/portal — Paddle customer portal session URL. */
      portal(): Promise<{ url: string }> {
        return request<{ url: string }>('/api/billing/portal', { method: 'POST' })
      },
    },

    notifications: {
      /** POST /api/notifications/devices — register (or re-home) a push token. */
      async registerDevice(input: {
        expoPushToken: string
        platform: 'ios' | 'android'
      }): Promise<void> {
        await request<{ ok: true }>('/api/notifications/devices', {
          method: 'POST',
          body: input,
        })
      },
      /** DELETE /api/notifications/devices?token=... — sign-out / revoked. */
      async unregisterDevice(expoPushToken: string): Promise<void> {
        await request<{ ok: boolean }>('/api/notifications/devices', {
          method: 'DELETE',
          query: { token: expoPushToken },
        })
      },
      /** GET /api/notifications/settings — defaults when none exist yet. */
      async getSettings(): Promise<NotificationSettings> {
        const { data } = await request<{ success: true; data: NotificationSettings }>(
          '/api/notifications/settings'
        )
        return data
      },
      /** PUT /api/notifications/settings — server sanitizes field by field. */
      async updateSettings(
        settings: Partial<Omit<NotificationSettings, 'userId'>>
      ): Promise<NotificationSettings> {
        const { data } = await request<{ success: true; data: NotificationSettings }>(
          '/api/notifications/settings',
          { method: 'PUT', body: settings }
        )
        return data
      },
    },
  }
}

export type PleiadClient = ReturnType<typeof createPleiadClient>
