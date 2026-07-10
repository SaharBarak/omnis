import { describe, expect, it, vi } from 'vitest'

import { sendExpoPush, type PushMessage } from './push'

function message(to: string): PushMessage {
  return { to, title: 'Kin 113', body: 'Red Solar Skywalker' }
}

function fetchReturning(tickets: unknown, ok = true) {
  return vi.fn(async () => ({
    ok,
    json: async () => ({ data: tickets }),
  })) as unknown as typeof fetch
}

describe('sendExpoPush', () => {
  it('counts ok tickets as sent', async () => {
    const fetchFn = fetchReturning([{ status: 'ok' }, { status: 'ok' }])
    const result = await sendExpoPush([message('a'), message('b')], fetchFn)
    expect(result).toEqual({ sent: 2, failed: 0, deadTokens: [] })
  })

  it('collects DeviceNotRegistered tokens for pruning', async () => {
    const fetchFn = fetchReturning([
      { status: 'ok' },
      { status: 'error', details: { error: 'DeviceNotRegistered' } },
    ])
    const result = await sendExpoPush([message('alive'), message('dead')], fetchFn)
    expect(result.sent).toBe(1)
    expect(result.failed).toBe(1)
    expect(result.deadTokens).toEqual(['dead'])
  })

  it('marks whole batch failed on HTTP error', async () => {
    const fetchFn = fetchReturning([], false)
    const result = await sendExpoPush([message('a'), message('b')], fetchFn)
    expect(result).toEqual({ sent: 0, failed: 2, deadTokens: [] })
  })

  it('batches requests of 100', async () => {
    const tickets = Array.from({ length: 100 }, () => ({ status: 'ok' as const }))
    const fetchFn = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: tickets }),
    })) as unknown as typeof fetch
    const messages = Array.from({ length: 150 }, (_, i) => message(`t${i}`))
    await sendExpoPush(messages, fetchFn)
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('sends nothing for an empty list', async () => {
    const fetchFn = vi.fn() as unknown as typeof fetch
    const result = await sendExpoPush([], fetchFn)
    expect(result).toEqual({ sent: 0, failed: 0, deadTokens: [] })
    expect(fetchFn).not.toHaveBeenCalled()
  })
})
