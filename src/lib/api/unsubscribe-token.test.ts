import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { signUnsubscribeToken, verifyUnsubscribeToken } from './unsubscribe-token'

describe('unsubscribe-token', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv, UNSUBSCRIBE_SECRET: 'test-secret' }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('signs and verifies a round-trip', async () => {
    const sig = await signUnsubscribeToken('user@example.com')
    expect(sig).toMatch(/^[0-9a-f]{64}$/)
    await expect(verifyUnsubscribeToken('user@example.com', sig!)).resolves.toBe(true)
  })

  it('normalizes email case and whitespace', async () => {
    const sig = await signUnsubscribeToken('  User@Example.COM ')
    await expect(verifyUnsubscribeToken('user@example.com', sig!)).resolves.toBe(true)
  })

  it('rejects a signature for a different email', async () => {
    const sig = await signUnsubscribeToken('user@example.com')
    await expect(verifyUnsubscribeToken('victim@example.com', sig!)).resolves.toBe(false)
  })

  it('rejects a tampered signature', async () => {
    const sig = await signUnsubscribeToken('user@example.com')
    const tampered = (sig![0] === 'a' ? 'b' : 'a') + sig!.slice(1)
    await expect(verifyUnsubscribeToken('user@example.com', tampered)).resolves.toBe(false)
  })

  it('rejects an empty signature', async () => {
    await expect(verifyUnsubscribeToken('user@example.com', '')).resolves.toBe(false)
  })

  it('fails closed when the secret is unset', async () => {
    const sig = await signUnsubscribeToken('user@example.com')
    delete process.env.UNSUBSCRIBE_SECRET
    await expect(signUnsubscribeToken('user@example.com')).resolves.toBeNull()
    await expect(verifyUnsubscribeToken('user@example.com', sig!)).resolves.toBe(false)
  })
})
