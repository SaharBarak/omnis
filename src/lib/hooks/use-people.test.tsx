import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePeople, type Person, type PersonWithTags, type Tag } from './use-people'

const computeAndStore = vi.fn()
const invalidateResults = vi.fn()

vi.mock('./use-computed-results', () => ({
  useComputedResults: () => ({ computeAndStore, invalidateResults }),
}))
vi.mock('@/lib/analytics/posthog', () => ({ track: vi.fn() }))

const tag: Tag = { id: 't1', owner_id: null, name: 'Family', hebrew_name: 'משפחה', color: '#000', is_system: true, sort_order: 0, created_at: '2026-01-01' }

const person = (id: string, name: string): PersonWithTags => ({
  id,
  owner_id: 'u1',
  name,
  hebrew_name: null,
  birth_date: '1990-01-01',
  birth_time: null,
  birth_place: null,
  avatar_url: null,
  notes: null,
  is_self: false,
  personality: null,
  deleted_at: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  tags: [],
})

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** The answer to a request, held until the test lets it go. */
function held() {
  let release!: (response: Response) => void
  const response = new Promise<Response>((resolve) => {
    release = resolve
  })
  return { response, release }
}

let reads = 0
let route: (method: string, url: string, body: unknown) => Promise<Response>

beforeEach(() => {
  reads = 0
  computeAndStore.mockReset().mockReturnValue(new Promise(() => {}))
  invalidateResults.mockReset().mockResolvedValue(undefined)
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      if (method === 'GET' && url === '/api/people') {
        reads += 1
        // The first read loads the list; later background refetches never answer, so nothing waits on them.
        return reads === 1 ? Promise.resolve(json({ people: [person('b', 'Bo'), person('a', 'Ada')], tags: [tag] })) : new Promise(() => {})
      }
      return route(method, url, init?.body ? JSON.parse(String(init.body)) : undefined)
    })
  )
})

afterEach(() => vi.unstubAllGlobals())

const mount = async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
  const hook = renderHook(() => usePeople(), { wrapper })
  await waitFor(() => expect(hook.result.current.loading).toBe(false))
  return hook
}

const names = (people: readonly PersonWithTags[]) => people.map((p) => p.name)

describe('usePeople mutations answer from the cache', () => {
  it('shows people by name', async () => {
    const { result } = await mount()
    expect(names(result.current.people)).toEqual(['Ada', 'Bo'])
  })

  it('removes a person before the server answers and resolves without waiting for a refetch', async () => {
    const answer = held()
    route = () => answer.response
    const { result } = await mount()
    let done!: Promise<void>
    act(() => {
      done = result.current.deletePerson('a')
    })
    await waitFor(() => expect(names(result.current.people)).toEqual(['Bo']))
    answer.release(json({ ok: true }))
    await act(() => done)
    await waitFor(() => expect(names(result.current.people)).toEqual(['Bo']))
  })

  it('puts a person back when the delete fails, and rejects', async () => {
    route = async () => json({ error: 'Not found' }, 404)
    const { result } = await mount()
    await act(async () => {
      await expect(result.current.deletePerson('a')).rejects.toThrow('Not found')
    })
    await waitFor(() => expect(names(result.current.people)).toEqual(['Ada', 'Bo']))
  })

  it('adds the server row with its tags in name order, and does not wait for the readings', async () => {
    const { tags: _tags, ...created }: PersonWithTags = person('c', 'Ben')
    route = async (method, url) => (method === 'POST' && url === '/api/people' ? json({ person: created }, 201) : json({}, 500))
    const { result } = await mount()
    let returned!: Person
    await act(async () => {
      returned = await result.current.addPerson({ name: 'Ben', birth_date: '1990-01-01' }, ['t1'])
    })
    expect(returned.id).toBe('c')
    await waitFor(() => expect(names(result.current.people)).toEqual(['Ada', 'Ben', 'Bo']))
    expect(result.current.people[1].tags).toEqual([tag])
    expect(computeAndStore).toHaveBeenCalledWith('c', { birthDate: '1990-01-01', hebrewName: null })
  })

  it('renames at once and moves the row to its new place', async () => {
    const answer = held()
    route = () => answer.response
    const { result } = await mount()
    let done!: Promise<Person>
    act(() => {
      done = result.current.updatePerson('a', { name: 'Cy' })
    })
    await waitFor(() => expect(names(result.current.people)).toEqual(['Bo', 'Cy']))
    answer.release(json({ person: { ...person('a', 'Cy') } }))
    await act(() => done)
    await waitFor(() => expect(names(result.current.people)).toEqual(['Bo', 'Cy']))
  })
})
