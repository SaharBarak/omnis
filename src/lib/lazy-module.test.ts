import { describe, expect, it, vi } from 'vitest'
import { lazyModule } from './lazy-module'

describe('lazyModule', () => {
  it('loads once for concurrent and later callers', async () => {
    const load = vi.fn(async () => ({ value: 1 }))
    const get = lazyModule(load)
    const [a, b] = await Promise.all([get(), get()])
    expect(a).toBe(b)
    expect(await get()).toBe(a)
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('retries after a failed load instead of replaying the rejection', async () => {
    const load = vi.fn<() => Promise<string>>().mockRejectedValueOnce(new Error('chunk failed')).mockResolvedValueOnce('ok')
    const get = lazyModule(load)
    await expect(get()).rejects.toThrow('chunk failed')
    await expect(get()).resolves.toBe('ok')
    expect(load).toHaveBeenCalledTimes(2)
  })
})
