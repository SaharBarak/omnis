import { describe, it, expect, vi } from 'vitest'
import { createPleiadClient, PleiadApiError } from './client'

/**
 * The client is exercised against a stubbed fetchFn — no network, no
 * Response polyfill assumptions. Each stub records the calls it receives so
 * URL construction, headers and body serialization can be asserted.
 */

interface RecordedCall {
  url: string
  init: RequestInit
}

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    json: () => Promise.resolve(body),
  } as Response
}

function stubFetch(...responses: Array<ReturnType<typeof jsonResponse>>) {
  const calls: RecordedCall[] = []
  let i = 0
  const fetchFn = ((url: string, init?: RequestInit) => {
    calls.push({ url, init: init ?? {} })
    const response = responses[Math.min(i, responses.length - 1)]
    i += 1
    return Promise.resolve(response)
  }) as unknown as typeof fetch
  return { fetchFn, calls }
}

function headersOf(call: RecordedCall): Record<string, string> {
  return (call.init.headers ?? {}) as Record<string, string>
}

const person = {
  id: '9f1e8a52-4c0d-4c8e-b7a1-2d3f4a5b6c7d',
  owner_id: 'auth0|abc',
  name: 'Noa',
  hebrew_name: null,
  birth_date: '1990-05-17',
  birth_time: null,
  birth_place: null,
  avatar_url: null,
  notes: null,
  is_self: false,
  deleted_at: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

describe('createPleiadClient', () => {
  describe('happy path', () => {
    it('lists people with a bearer token against the joined base URL', async () => {
      const { fetchFn, calls } = stubFetch(
        jsonResponse(200, { people: [{ ...person, tags: [] }], tags: [] })
      )
      const client = createPleiadClient({
        baseUrl: 'https://pleiad.io/',
        getAccessToken: () => Promise.resolve('token-123'),
        fetchFn,
      })

      const data = await client.people.list()

      expect(calls[0].url).toBe('https://pleiad.io/api/people')
      expect(headersOf(calls[0]).Authorization).toBe('Bearer token-123')
      expect(data.people).toHaveLength(1)
      expect(data.people[0].name).toBe('Noa')
    })

    it('creates a person via POST with a JSON body and unwraps the envelope', async () => {
      const { fetchFn, calls } = stubFetch(jsonResponse(201, { person }))
      const client = createPleiadClient({ baseUrl: 'https://pleiad.io', fetchFn })

      const created = await client.people.create({
        person: { name: 'Noa', birth_date: '1990-05-17' },
      })

      expect(calls[0].init.method).toBe('POST')
      expect(headersOf(calls[0])['Content-Type']).toBe('application/json')
      expect(JSON.parse(calls[0].init.body as string)).toEqual({
        person: { name: 'Noa', birth_date: '1990-05-17' },
      })
      expect(created.id).toBe(person.id)
    })

    it('skips the Authorization header when getAccessToken returns null', async () => {
      const { fetchFn, calls } = stubFetch(jsonResponse(200, { profile: null }))
      const client = createPleiadClient({
        baseUrl: 'https://pleiad.io',
        getAccessToken: () => Promise.resolve(null),
        fetchFn,
      })

      await client.profile.get()

      expect(headersOf(calls[0]).Authorization).toBeUndefined()
    })

    it('builds query strings for batch reads and flags', async () => {
      const { fetchFn, calls } = stubFetch(
        jsonResponse(200, { results: [] }),
        jsonResponse(200, { ok: true }),
        jsonResponse(200, { plan: 'free' })
      )
      const client = createPleiadClient({ baseUrl: 'https://pleiad.io', fetchFn })

      await client.computedResults.listForPeople(['a', 'b'])
      await client.people.delete(person.id, { permanent: true })
      await client.billing.getSubscription({ refresh: true })

      expect(calls[0].url).toBe(
        'https://pleiad.io/api/computed-results?personIds=a%2Cb'
      )
      expect(calls[1].url).toBe(
        `https://pleiad.io/api/people/${person.id}?permanent=true`
      )
      expect(calls[2].url).toBe('https://pleiad.io/api/billing/subscription?refresh=1')
    })

    it('never attaches auth to the public share endpoint', async () => {
      const { fetchFn, calls } = stubFetch(
        jsonResponse(200, { share: { share_type: 'group', options: {} } })
      )
      const getAccessToken = vi.fn(() => Promise.resolve('token-123'))
      const client = createPleiadClient({
        baseUrl: 'https://pleiad.io',
        getAccessToken,
        fetchFn,
      })

      const shared = await client.share.get('tok_abc')

      expect(getAccessToken).not.toHaveBeenCalled()
      expect(headersOf(calls[0]).Authorization).toBeUndefined()
      expect(shared.share.share_type).toBe('group')
    })
  })

  describe('401 unauthorized', () => {
    it('notifies onUnauthorized once for a burst of 401s, then re-arms on success', async () => {
      const { fetchFn } = stubFetch(
        jsonResponse(401, { error: 'Unauthorized' }),
        jsonResponse(401, { error: 'Unauthorized' }),
        jsonResponse(200, { profile: null }),
        jsonResponse(401, { error: 'Unauthorized' })
      )
      const onUnauthorized = vi.fn()
      const client = createPleiadClient({
        baseUrl: 'https://pleiad.io',
        fetchFn,
        onUnauthorized,
      })

      await expect(client.profile.get()).rejects.toMatchObject({ status: 401 })
      await expect(client.profile.get()).rejects.toMatchObject({ status: 401 })
      expect(onUnauthorized).toHaveBeenCalledTimes(1)

      await client.profile.get()
      await expect(client.profile.get()).rejects.toMatchObject({ status: 401 })
      expect(onUnauthorized).toHaveBeenCalledTimes(2)
    })

    it('surfaces the public share password gate as 401 details', async () => {
      const { fetchFn } = stubFetch(jsonResponse(401, { requiresPassword: true }))
      const client = createPleiadClient({ baseUrl: 'https://pleiad.io', fetchFn })

      const error = await client.share.get('tok_abc').catch((e: unknown) => e)

      expect(error).toBeInstanceOf(PleiadApiError)
      expect((error as PleiadApiError).status).toBe(401)
      expect((error as PleiadApiError).details).toEqual({ requiresPassword: true })
    })
  })

  describe('error mapping', () => {
    it('maps 403 limit_exceeded to a typed paywall error', async () => {
      const { fetchFn } = stubFetch(
        jsonResponse(403, {
          error: "You've reached your plan's limit of 3 people on Free. Upgrade to add more.",
          code: 'limit_exceeded',
        })
      )
      const client = createPleiadClient({ baseUrl: 'https://pleiad.io', fetchFn })

      const error = await client.people
        .create({ person: { name: 'Noa', birth_date: '1990-05-17' } })
        .catch((e: unknown) => e)

      expect(error).toBeInstanceOf(PleiadApiError)
      const apiError = error as PleiadApiError
      expect(apiError.status).toBe(403)
      expect(apiError.code).toBe('limit_exceeded')
      expect(apiError.isLimitExceeded).toBe(true)
      expect(apiError.message).toMatch(/limit of 3 people/)
    })

    it('maps 429 rate limits', async () => {
      const { fetchFn } = stubFetch(jsonResponse(429, { error: 'Too many requests' }))
      const client = createPleiadClient({ baseUrl: 'https://pleiad.io', fetchFn })

      const error = await client.knowledge.search('tzolkin').catch((e: unknown) => e)

      expect(error).toBeInstanceOf(PleiadApiError)
      expect((error as PleiadApiError).status).toBe(429)
      expect((error as PleiadApiError).isLimitExceeded).toBe(false)
    })

    it('carries zod issues through 400 details', async () => {
      const issues = [{ path: ['person', 'name'], message: 'Required' }]
      const { fetchFn } = stubFetch(
        jsonResponse(400, { error: 'Invalid input', details: issues })
      )
      const client = createPleiadClient({ baseUrl: 'https://pleiad.io', fetchFn })

      const error = await client.groups
        .create({ name: 'Family' })
        .catch((e: unknown) => e)

      expect((error as PleiadApiError).status).toBe(400)
      expect((error as PleiadApiError).message).toBe('Invalid input')
      expect((error as PleiadApiError).details).toEqual(issues)
    })

    it('maps 404, 409 and 410 with the server message', async () => {
      const { fetchFn } = stubFetch(
        jsonResponse(404, { error: 'Not found' }),
        jsonResponse(409, { error: 'Relationship already exists' }),
        jsonResponse(410, { error: 'Link has expired' })
      )
      const client = createPleiadClient({ baseUrl: 'https://pleiad.io', fetchFn })

      await expect(client.groups.get(person.id)).rejects.toMatchObject({
        status: 404,
        message: 'Not found',
      })
      await expect(
        client.relationships.create({
          person1_id: 'a',
          person2_id: 'b',
          type: 'family',
        })
      ).rejects.toMatchObject({ status: 409, message: 'Relationship already exists' })
      await expect(client.share.get('tok_abc')).rejects.toMatchObject({
        status: 410,
        message: 'Link has expired',
      })
    })

    it('survives non-JSON error bodies', async () => {
      const { fetchFn } = stubFetch({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('not json')),
      } as unknown as Response)
      const client = createPleiadClient({ baseUrl: 'https://pleiad.io', fetchFn })

      await expect(client.boards.list()).rejects.toMatchObject({
        status: 500,
        message: 'Internal Server Error',
      })
    })
  })
})
