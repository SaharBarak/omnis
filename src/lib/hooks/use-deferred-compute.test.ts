import { describe, expect, it } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDeferredCompute } from './use-deferred-compute'

describe('useDeferredCompute', () => {
  it('settles a synchronously throwing compute as an error instead of loading forever', async () => {
    const { result } = renderHook(() =>
      useDeferredCompute(
        { n: 1 },
        () => {
          throw new Error('boom')
        },
        null,
        0,
      ),
    )
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toBe('boom')
  })

  it('hands compute the input itself, not a JSON copy', async () => {
    const day = new Date('2000-01-01T00:00:00Z')
    const seen: unknown[] = []
    const { result } = renderHook(() =>
      useDeferredCompute({ day }, async (input) => {
        seen.push(input.day)
        return input.day instanceof Date
      }, null, 0),
    )
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.value).toBe(true)
    expect(seen[0]).toBe(day)
  })

  it('reruns when a dep changes and skips the seeded first input', async () => {
    let runs = 0
    const compute = async (n: number) => {
      runs += 1
      return n * 10
    }
    const { result, rerender } = renderHook(({ dep }) => useDeferredCompute(1, compute, { input: 1, value: 99 }, 0, [dep]), { initialProps: { dep: 'a' } })
    expect(result.current).toMatchObject({ status: 'ready', value: 99 })
    rerender({ dep: 'b' })
    await waitFor(() => expect(result.current).toMatchObject({ status: 'ready', value: 10 }))
    expect(runs).toBe(1)
  })
})
