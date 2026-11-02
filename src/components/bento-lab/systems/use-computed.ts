'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

export type Computed<T> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly value: T }
  | { readonly status: 'error'; readonly error: string }

type Outcome<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: string }

const messageOf = (e: unknown): string => (e instanceof Error ? e.message : String(e))

/**
 * Runs an engine task (usually a dynamic import plus a pure call) and tracks
 * it. The task's identity is its key: pass a memoised task, and a new one
 * starts a new run. Null means there is nothing to compute yet.
 */
export function useComputed<T>(task: (() => Promise<T>) | null): Computed<T> & { readonly retry: () => void } {
  const [attempt, setAttempt] = useState(0)
  const [done, setDone] = useState<{ readonly task: () => Promise<T>; readonly attempt: number; readonly outcome: Outcome<T> } | null>(null)
  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  useEffect(() => {
    if (!task) return
    let live = true
    task().then(
      (value) => live && setDone({ task, attempt, outcome: { ok: true, value } }),
      (error: unknown) => live && setDone({ task, attempt, outcome: { ok: false, error: messageOf(error) } }),
    )
    return () => {
      live = false
    }
  }, [task, attempt])

  if (!task) return { status: 'idle', retry }
  if (!done || done.task !== task || done.attempt !== attempt) return { status: 'loading', retry }
  return done.outcome.ok ? { status: 'ready', value: done.outcome.value, retry } : { status: 'error', error: done.outcome.error, retry }
}

const pad = (n: number): string => String(n).padStart(2, '0')

/** The civil date where the viewer is, YYYY-MM-DD. */
export const localIso = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** The UTC date, YYYY-MM-DD. */
export const utcIso = (d: Date): string => d.toISOString().slice(0, 10)

const noSubscribe = () => () => {}

/**
 * Today's date, read on the client only: the server and the first client
 * render both see null, so a page never hydrates against another day.
 */
export function useToday(clock: 'local' | 'utc'): string | null {
  return useSyncExternalStore(
    noSubscribe,
    () => (clock === 'local' ? localIso : utcIso)(new Date()),
    () => null,
  )
}
