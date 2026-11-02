'use client'

import { useEffect, useRef, useState } from 'react'

/** How long input must hold still before an expensive recompute starts. */
export const INPUT_SETTLE_MS = 300

export type ComputeStatus = 'idle' | 'loading' | 'ready' | 'error'

interface Settled<T> {
  readonly key: string
  readonly value: T | null
  readonly error: string | null
}

export interface DeferredResult<T> {
  /** The last good value; kept on screen while a newer one computes or fails. */
  readonly value: T | null
  readonly status: ComputeStatus
  readonly error: string | null
}

/**
 * Recomputes an expensive value after its input settles. The input is keyed
 * by its JSON form, so a fresh object with the same content does not rerun;
 * `compute` receives the input itself, never a JSON copy. A seed value for
 * the first input skips the first computation. A `compute` that throws
 * synchronously settles as an error like one that rejects.
 *
 * `compute` may read only its input and `deps`. Anything else it closes over
 * (a date, a setting) goes in `deps`, which joins the key, so a change to it
 * reruns the computation instead of leaving a stale value on screen.
 */
export function useDeferredCompute<I, T>(
  input: I | null,
  compute: (input: I) => Promise<T>,
  seed: { readonly input: I; readonly value: T } | null = null,
  settleMs: number = INPUT_SETTLE_MS,
  deps: readonly unknown[] = [],
): DeferredResult<T> {
  const keyOf = (value: I): string => JSON.stringify([value, deps])
  const key = input === null ? null : keyOf(input)
  const [settled, setSettled] = useState<Settled<T> | null>(() =>
    seed ? { key: keyOf(seed.input), value: seed.value, error: null } : null,
  )

  const latest = useRef({ input, compute })
  useEffect(() => {
    latest.current = { input, compute }
  })

  useEffect(() => {
    if (key === null || key === settled?.key) return
    let live = true
    const timer = setTimeout(() => {
      const { input: current, compute: run } = latest.current
      if (current === null) return
      Promise.resolve()
        .then(() => run(current))
        .then(
          (value) => live && setSettled({ key, value, error: null }),
          (err: unknown) =>
            live &&
            setSettled((prev) => ({
              key,
              value: prev?.value ?? null,
              error: err instanceof Error ? err.message : 'Could not compute this',
            })),
        )
    }, settleMs)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [key, settled?.key, settleMs])

  if (key === null) return { value: settled?.value ?? null, status: 'idle', error: null }
  if (settled?.key !== key) return { value: settled?.value ?? null, status: 'loading', error: null }
  return { value: settled.value, status: settled.error ? 'error' : 'ready', error: settled.error }
}
