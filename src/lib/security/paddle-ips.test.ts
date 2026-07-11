import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * The module caches the fetched allowlist in module scope. To keep cases
 * independent, each test resets the module registry and imports a fresh copy,
 * so the cache always starts empty.
 */

function mockIpsResponse(cidrs: string[], ok = true) {
  return vi.fn(async () => ({
    ok,
    json: async () => ({ data: { ipv4_cidrs: cidrs } }),
  })) as unknown as typeof fetch
}

async function freshModule() {
  vi.resetModules()
  return import('./paddle-ips')
}

const NOW = 1_000_000

describe('isAllowedPaddleIp', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('allows an address on the fetched allowlist', async () => {
    vi.stubGlobal('fetch', mockIpsResponse(['34.232.58.13/32', '34.195.105.136/32']))
    const { isAllowedPaddleIp } = await freshModule()
    expect(await isAllowedPaddleIp('34.232.58.13', NOW)).toBe(true)
  })

  it('rejects an address not on the allowlist', async () => {
    vi.stubGlobal('fetch', mockIpsResponse(['34.232.58.13/32']))
    const { isAllowedPaddleIp } = await freshModule()
    expect(await isAllowedPaddleIp('10.0.0.1', NOW)).toBe(false)
  })

  it('rejects a null IP when the allowlist is available', async () => {
    vi.stubGlobal('fetch', mockIpsResponse(['34.232.58.13/32']))
    const { isAllowedPaddleIp } = await freshModule()
    expect(await isAllowedPaddleIp(null, NOW)).toBe(false)
  })

  it('fails open (allows) when the fetch errors and no cache exists', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network') }) as unknown as typeof fetch)
    const { isAllowedPaddleIp } = await freshModule()
    expect(await isAllowedPaddleIp('10.0.0.1', NOW)).toBe(true)
  })

  it('fails open when the endpoint returns a non-ok status', async () => {
    vi.stubGlobal('fetch', mockIpsResponse([], false))
    const { isAllowedPaddleIp } = await freshModule()
    expect(await isAllowedPaddleIp(null, NOW)).toBe(true)
  })

  it('fails open when the allowlist is empty', async () => {
    vi.stubGlobal('fetch', mockIpsResponse([]))
    const { isAllowedPaddleIp } = await freshModule()
    expect(await isAllowedPaddleIp('34.232.58.13', NOW)).toBe(true)
  })

  it('serves a stale cached list on a later fetch error (resilience)', async () => {
    const good = mockIpsResponse(['34.232.58.13/32'])
    vi.stubGlobal('fetch', good)
    const { isAllowedPaddleIp } = await freshModule()
    expect(await isAllowedPaddleIp('34.232.58.13', NOW)).toBe(true)
    // TTL expires; next fetch throws → the cached list is reused, not dropped.
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('blip') }) as unknown as typeof fetch)
    const later = NOW + 2 * 60 * 60 * 1000
    expect(await isAllowedPaddleIp('34.232.58.13', later)).toBe(true)
    expect(await isAllowedPaddleIp('10.0.0.1', later)).toBe(false)
  })

  it('caches within the TTL — a second call does not refetch', async () => {
    const fetchFn = mockIpsResponse(['34.232.58.13/32'])
    vi.stubGlobal('fetch', fetchFn)
    const { isAllowedPaddleIp } = await freshModule()
    expect(await isAllowedPaddleIp('34.232.58.13', NOW)).toBe(true)
    expect(await isAllowedPaddleIp('34.232.58.13', NOW + 5 * 60 * 1000)).toBe(true)
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })
})
