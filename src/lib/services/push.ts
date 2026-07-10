/**
 * Expo push delivery (PUSH-M1). Plain fetch against the Expo Push API —
 * worker-compatible, no SDK. Batches of 100 per request (Expo limit).
 * Returns tokens Expo reported as dead so callers can prune them.
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const BATCH_SIZE = 100

export interface PushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
}

interface ExpoPushTicket {
  status: 'ok' | 'error'
  message?: string
  details?: { error?: string }
}

export interface PushResult {
  sent: number
  failed: number
  deadTokens: string[]
}

export async function sendExpoPush(
  messages: PushMessage[],
  fetchFn: typeof fetch = fetch
): Promise<PushResult> {
  const result: PushResult = { sent: 0, failed: 0, deadTokens: [] }
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE)
    const response = await fetchFn(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(batch),
    })
    if (!response.ok) {
      result.failed += batch.length
      continue
    }
    const payload = (await response.json()) as { data?: ExpoPushTicket[] }
    const tickets = payload.data ?? []
    tickets.forEach((ticket, index) => {
      if (ticket.status === 'ok') {
        result.sent += 1
        return
      }
      result.failed += 1
      if (ticket.details?.error === 'DeviceNotRegistered') {
        const message = batch[index]
        if (message) result.deadTokens.push(message.to)
      }
    })
    // Tickets can be shorter than the batch on malformed input; count the gap.
    if (tickets.length < batch.length) {
      result.failed += batch.length - tickets.length
    }
  }
  return result
}
