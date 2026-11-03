import { MutationObserver, QueryClient } from '@tanstack/query-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cacheMutation, type CacheMutation } from './cache-mutation'
import { dropRow, patchRow, swap, upsertRow } from './list-ops'

interface Row {
  readonly id: string
  readonly name: string
}

type Rows = readonly Row[]

const KEY = ['rows'] as const
const seed: Rows = [
  { id: 'a', name: 'Ada' },
  { id: 'b', name: 'Bo' },
]

/** A request the test answers by hand. */
function pending<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

let client: QueryClient

const setup = (data: Rows | null = seed) => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  if (data !== null) client.setQueryData(KEY, data, { updatedAt: 1_000 })
  vi.spyOn(client, 'invalidateQueries')
  return client
}

const run = <TData, TVariables, TResult>(declaration: CacheMutation<TData, TVariables, TResult>, variables: TVariables) =>
  new MutationObserver(client, cacheMutation(declaration)).mutate(variables)

const names = () => client.getQueryData<Rows>(KEY)?.map((r) => r.name)

afterEach(() => client.clear())

describe('cacheMutation', () => {
  it('shows the guess before the server answers, without making it look fresh', async () => {
    setup()
    const request = pending<Row>()
    const done = run<Rows, string, Row>({ key: KEY, request: () => request.promise, optimistic: (name) => patchRow<Row>('a', { name }) }, 'Ana')
    await tick()
    expect(names()).toEqual(['Ana', 'Bo'])
    expect(client.getQueryState(KEY)?.dataUpdatedAt).toBe(1_000)
    request.resolve({ id: 'a', name: 'Ana' })
    await expect(done).resolves.toEqual({ id: 'a', name: 'Ana' })
  })

  it('undoes the guess when the request fails, and rejects', async () => {
    setup()
    const done = run<Rows, string, void>({ key: KEY, request: () => Promise.reject(new Error('nope')), optimistic: (id) => dropRow<Row>(id) }, 'a')
    await expect(done).rejects.toThrow('nope')
    expect(names()).toEqual(['Ada', 'Bo'])
  })

  it('undoes only its own guess when another mutation is still running', async () => {
    setup()
    const slow = pending<void>()
    const failing = pending<Row>()
    const drop = run<Rows, string, void>({ key: KEY, request: () => slow.promise, optimistic: (id) => dropRow<Row>(id) }, 'b')
    const rename = run<Rows, string, Row>({ key: KEY, request: () => failing.promise, optimistic: (name) => patchRow<Row>('a', { name }) }, 'Ana')
    await tick()
    expect(names()).toEqual(['Ana'])
    failing.reject(new Error('nope'))
    await expect(rename).rejects.toThrow('nope')
    expect(names()).toEqual(['Ada'])
    slow.resolve()
    await drop
  })

  it('settles the server row into a loaded list and leaves an unloaded one alone', async () => {
    setup()
    await run<Rows, void, Row>({ key: KEY, request: async () => ({ id: 'c', name: 'Cy' }), settle: (row) => upsertRow(row) }, undefined)
    expect(names()).toEqual(['Ada', 'Bo', 'Cy'])

    setup(null)
    await run<Rows, void, Row>({ key: KEY, request: async () => ({ id: 'c', name: 'Cy' }), settle: (row) => upsertRow(row) }, undefined)
    expect(client.getQueryData(KEY)).toBeUndefined()
  })

  it('replaces the whole value with the answer even before it loaded', async () => {
    setup(null)
    await run<Rows, void, Rows>({ key: KEY, request: async () => [{ id: 'z', name: 'Zed' }], replace: (rows) => rows }, undefined)
    expect(names()).toEqual(['Zed'])
  })

  it('resolves on the answer without waiting for the refetch', async () => {
    setup()
    client.setQueryDefaults(KEY, { queryFn: () => new Promise<Rows>(() => {}) })
    client.getQueryCache().build(client, { queryKey: KEY })
    await expect(run<Rows, void, string>({ key: KEY, request: async () => 'ok' }, undefined)).resolves.toBe('ok')
  })

  it('refetches the key and the also keys once, after the last mutation under the key', async () => {
    setup()
    const first = pending<void>()
    const declaration = { key: KEY, request: () => first.promise, also: [['other']] }
    const a = run<Rows, void, void>(declaration, undefined)
    const b = run<Rows, void, void>({ key: KEY, request: async () => undefined }, undefined)
    await b
    expect(client.invalidateQueries).not.toHaveBeenCalled()
    first.resolve()
    await a
    expect(vi.mocked(client.invalidateQueries).mock.calls.map(([filters]) => filters?.queryKey)).toEqual([KEY, ['other']])
  })

  it('applies serial guesses at once but sends the requests in order', async () => {
    setup()
    const sent: string[] = []
    const first = pending<void>()
    const save = (name: string, wait?: Promise<void>) =>
      run<Rows, string, void>(
        {
          key: KEY,
          serial: true,
          request: async (n) => {
            sent.push(n)
            await wait
          },
          optimistic: (n) => swap<Rows>([{ id: 'a', name: n }]),
        },
        name,
      )
    const one = save('one', first.promise)
    const two = save('two')
    await tick()
    expect(names()).toEqual(['two'])
    expect(sent).toEqual(['one'])
    first.resolve()
    await Promise.all([one, two])
    expect(sent).toEqual(['one', 'two'])
  })

  it('lets a later serial guess stand over an earlier whole-value answer', async () => {
    setup()
    const first = pending<Rows>()
    const second = pending<Rows>()
    const save = (name: string, answer: Promise<Rows>) =>
      run<Rows, string, Rows>(
        { key: KEY, serial: true, request: () => answer, optimistic: (n) => swap<Rows>([{ id: 'a', name: n }]), replace: (saved) => saved },
        name,
      )
    const one = save('one', first.promise)
    const two = save('two', second.promise)
    await tick()
    first.resolve([{ id: 'a', name: 'one' }])
    await one
    expect(names()).toEqual(['two'])
    second.resolve([{ id: 'a', name: 'two' }])
    await two
    expect(names()).toEqual(['two'])
  })
})
