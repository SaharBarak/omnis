import * as SecureStore from 'expo-secure-store'

/**
 * S10 map layout persistence. The constellation auto-settles every visit, but
 * any star the user drags is *pinned* — and only those pinned positions are
 * remembered here, keyed per account. Storing pins alone (not the whole
 * layout) keeps the payload a handful of coordinates, comfortably under
 * SecureStore's ~2KB Android value ceiling, so no extra native module or
 * dev-build rebuild is needed.
 */

/** Pinned star positions in canvas space (origin = self), by person id. */
export type PinnedLayout = Record<string, { x: number; y: number }>

const KEY_PREFIX = 'pleiad.map.layout.'
/** Defensive cap: a runaway map degrades to the most-recent pins, never a throw. */
const MAX_PINS = 48

function keyFor(userId: string): string {
  return `${KEY_PREFIX}${userId}`
}

function isPoint(value: unknown): value is { x: number; y: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { x?: unknown }).x === 'number' &&
    typeof (value as { y?: unknown }).y === 'number'
  )
}

/** Read a user's pinned layout. Any corruption or read error yields no pins. */
export async function loadPinnedLayout(userId: string): Promise<PinnedLayout> {
  try {
    const raw = await SecureStore.getItemAsync(keyFor(userId))
    if (raw === null) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    const out: PinnedLayout = {}
    for (const [id, value] of Object.entries(parsed)) {
      if (isPoint(value)) out[id] = { x: value.x, y: value.y }
    }
    return out
  } catch {
    return {}
  }
}

/** Persist a user's pinned layout. An empty layout clears the stored key. */
export async function savePinnedLayout(userId: string, layout: PinnedLayout): Promise<void> {
  try {
    const ids = Object.keys(layout)
    if (ids.length === 0) {
      await SecureStore.deleteItemAsync(keyFor(userId))
      return
    }
    // Round to whole pixels and keep only the most-recent pins under the cap.
    const compact: PinnedLayout = {}
    for (const id of ids.slice(-MAX_PINS)) {
      const point = layout[id]
      if (point !== undefined) compact[id] = { x: Math.round(point.x), y: Math.round(point.y) }
    }
    await SecureStore.setItemAsync(keyFor(userId), JSON.stringify(compact))
  } catch {
    // Non-fatal: a failed write just means this arrangement won't survive a cold start.
  }
}
