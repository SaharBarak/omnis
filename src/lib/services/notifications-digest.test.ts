import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * The #65 hour×timezone filter: each hourly run must serve exactly the
 * recipients whose chosen digest hour, in their own timezone, is now.
 */

const mockRecipients = vi.fn()

vi.mock('@/lib/db/repositories/notifications-repo', () => ({
  listAllEnabledDigestRecipients: () => mockRecipients(),
  listPushTokensForUsers: vi.fn().mockResolvedValue([]),
  deletePushTokens: vi.fn(),
  logEmailSend: vi.fn(),
}))

vi.mock('@/lib/db/repositories/push-tokens-repo', () => ({
  listPushTokensForUsers: vi.fn().mockResolvedValue([]),
  deletePushTokens: vi.fn(),
}))

const mockSendEmail = vi.fn().mockResolvedValue({ ok: true, id: 'mail-1' })
vi.mock('@/lib/email', () => ({
  sendTransactionalEmail: (args: unknown) => mockSendEmail(args),
  esc: (s: string) => s,
}))

vi.mock('@/lib/services/push', () => ({
  sendExpoPush: vi.fn().mockResolvedValue({ sent: 0, deadTokens: [] }),
}))

import { processDailyDigestNotifications } from './notifications'

function recipient(overrides: Partial<Record<string, unknown>>) {
  return {
    userId: 'u1',
    email: 'u1@example.com',
    name: 'U One',
    birthDate: null,
    channels: ['email'],
    digestTime: '08:00',
    timezone: 'UTC',
    ...overrides,
  }
}

describe('processDailyDigestNotifications hour×timezone filter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendEmail.mockResolvedValue({ ok: true, id: 'mail-1' })
  })

  it('serves only recipients whose local hour matches now', async () => {
    // 08:00 UTC = 11:00 in Tel Aviv (IDT, July).
    const now = new Date('2026-07-29T08:00:00Z')
    mockRecipients.mockResolvedValue([
      recipient({ userId: 'utc-8', email: 'a@x.com', digestTime: '08:00', timezone: 'UTC' }),
      recipient({ userId: 'tlv-8', email: 'b@x.com', digestTime: '08:00', timezone: 'Asia/Jerusalem' }),
      recipient({ userId: 'tlv-11', email: 'c@x.com', digestTime: '11:00', timezone: 'Asia/Jerusalem' }),
    ])

    const result = await processDailyDigestNotifications(now)

    // utc-8 (08 local) and tlv-11 (11:00 Jerusalem == 08:00 UTC) match;
    // tlv-8 waits for 05:00 UTC.
    expect(result.sent).toBe(2)
    const to = mockSendEmail.mock.calls.map((c) => (c[0] as { to: string }).to).sort()
    expect(to).toEqual(['a@x.com', 'c@x.com'])
  })

  it('falls back to UTC on an invalid timezone instead of dropping the user', async () => {
    const now = new Date('2026-07-29T09:00:00Z')
    mockRecipients.mockResolvedValue([
      recipient({ userId: 'bad-tz', digestTime: '09:00', timezone: 'Not/AZone' }),
    ])

    const result = await processDailyDigestNotifications(now)
    expect(result.sent).toBe(1)
  })

  it('sends nothing on an hour nobody picked', async () => {
    const now = new Date('2026-07-29T03:00:00Z')
    mockRecipients.mockResolvedValue([
      recipient({ digestTime: '08:00', timezone: 'UTC' }),
    ])

    const result = await processDailyDigestNotifications(now)
    expect(result.sent).toBe(0)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })
})

describe('daily digest body — today across the systems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendEmail.mockResolvedValue({ ok: true, id: 'mail-1' })
  })

  async function bodyFor(preferences: unknown): Promise<string> {
    const now = new Date('2026-07-29T08:00:00Z')
    mockRecipients.mockResolvedValue([
      recipient({ digestTime: '08:00', timezone: 'UTC', preferences }),
    ])
    await processDailyDigestNotifications(now)
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
    return (mockSendEmail.mock.calls[0][0] as { bodyHtml: string }).bodyHtml
  }

  it('includes every system line by default (no stored preference)', async () => {
    const body = await bodyFor(null)
    expect(body).toContain('Today, across the systems')
    for (const label of ['Moon', 'Sun', 'Sidereal', 'Gate', 'Hebrew', 'Hijri', 'Persian', 'Chinese', 'Panchang', 'Long Count']) {
      expect(body).toContain(`>${label}</td>`)
    }
    expect(body).toContain('Sky today')
  })

  it('drops lines the recipient turned off, keeps the rest', async () => {
    const body = await bodyFor({ systems: { hijri: false, panchang: false } })
    expect(body).not.toContain('>Hijri</td>')
    expect(body).not.toContain('>Panchang</td>')
    expect(body).toContain('>Hebrew</td>')
    expect(body).toContain('>Long Count</td>')
  })

  it('gates the sky section on the astrology preference', async () => {
    const body = await bodyFor({ systems: { astrology: false } })
    expect(body).not.toContain('Sky today')
    expect(body).not.toContain('>Sun</td>')
  })
})
