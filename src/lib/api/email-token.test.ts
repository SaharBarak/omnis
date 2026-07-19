import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  CONFIRM_TOKEN_TTL_MS,
  signConfirmToken,
  signUnsubscribeToken,
  verifyConfirmToken,
  verifyUnsubscribeToken,
} from './email-token'

describe('email-token', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv, UNSUBSCRIBE_SECRET: 'test-secret' }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('unsubscribe', () => {
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

  describe('confirm', () => {
    const now = 1_700_000_000_000

    it('signs and verifies a round-trip', async () => {
      const token = await signConfirmToken('user@example.com', now)
      expect(token!.sig).toMatch(/^[0-9a-f]{64}$/)
      expect(token!.expiresAt).toBe(now + CONFIRM_TOKEN_TTL_MS)
      await expect(
        verifyConfirmToken('user@example.com', token!.expiresAt, token!.sig, now)
      ).resolves.toBe(true)
    })

    it('normalizes email case and whitespace', async () => {
      const token = await signConfirmToken('  User@Example.COM ', now)
      await expect(
        verifyConfirmToken('user@example.com', token!.expiresAt, token!.sig, now)
      ).resolves.toBe(true)
    })

    it('rejects a signature for a different email', async () => {
      const token = await signConfirmToken('user@example.com', now)
      await expect(
        verifyConfirmToken('victim@example.com', token!.expiresAt, token!.sig, now)
      ).resolves.toBe(false)
    })

    it('rejects the link once the expiry has passed', async () => {
      const token = await signConfirmToken('user@example.com', now)
      const afterExpiry = token!.expiresAt + 1
      await expect(
        verifyConfirmToken('user@example.com', token!.expiresAt, token!.sig, afterExpiry)
      ).resolves.toBe(false)
    })

    it('rejects an extended expiry — exp is inside the signed payload', async () => {
      const token = await signConfirmToken('user@example.com', now)
      const extended = token!.expiresAt + CONFIRM_TOKEN_TTL_MS
      await expect(
        verifyConfirmToken('user@example.com', extended, token!.sig, now)
      ).resolves.toBe(false)
    })

    it('rejects a non-numeric expiry', async () => {
      const token = await signConfirmToken('user@example.com', now)
      await expect(
        verifyConfirmToken('user@example.com', Number('not-a-number'), token!.sig, now)
      ).resolves.toBe(false)
    })

    it('fails closed when the secret is unset', async () => {
      const token = await signConfirmToken('user@example.com', now)
      delete process.env.UNSUBSCRIBE_SECRET
      await expect(signConfirmToken('user@example.com', now)).resolves.toBeNull()
      await expect(
        verifyConfirmToken('user@example.com', token!.expiresAt, token!.sig, now)
      ).resolves.toBe(false)
    })
  })

  describe('purpose separation', () => {
    const now = 1_700_000_000_000

    it('an unsubscribe signature cannot confirm the same address', async () => {
      const sig = await signUnsubscribeToken('user@example.com')
      await expect(
        verifyConfirmToken('user@example.com', now + CONFIRM_TOKEN_TTL_MS, sig!, now)
      ).resolves.toBe(false)
    })

    it('a confirm signature cannot unsubscribe the same address', async () => {
      const token = await signConfirmToken('user@example.com', now)
      await expect(verifyUnsubscribeToken('user@example.com', token!.sig)).resolves.toBe(false)
    })
  })
})
