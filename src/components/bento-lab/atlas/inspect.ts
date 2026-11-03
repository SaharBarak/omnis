import { markKey, type AtlasMarkRef } from '@/lib/atlas/marks'

/**
 * Which mark's card is open on the atlas (docs/redesign/BENTO_SITE.md,
 * "Marks explain themselves"). Pure: the stage feeds it pointer, focus and
 * key events and draws what it says. An event that changes nothing returns
 * the same state, so the drawing does not render again while the pointer
 * moves within one mark.
 */

export interface InspectState {
  /** The mark whose card is open. */
  readonly active: AtlasMarkRef | null
  /** Kept open by a tap, a click, Enter or Space: the pointer moving elsewhere leaves it. */
  readonly kept: boolean
  /** Closed on purpose: stays closed until the pointer finds another mark or leaves. */
  readonly muted: string | null
  /** The last mark shown, so a closing card leaves with its words. */
  readonly shown: AtlasMarkRef | null
}

export const IDLE: InspectState = Object.freeze({ active: null, kept: false, muted: null, shown: null })

export type InspectEvent =
  /** The pointer is over a mark, or over none. */
  | { readonly type: 'point'; readonly ref: AtlasMarkRef | null }
  /** Keyboard focus reached a mark. Focus wins over a kept card. */
  | { readonly type: 'focus'; readonly ref: AtlasMarkRef }
  /** Focus left the marks. */
  | { readonly type: 'blur' }
  /** A tap, a click, Enter or Space on a mark: keeps its card, or closes it when it is the one kept. */
  | { readonly type: 'keep'; readonly ref: AtlasMarkRef }
  /** Escape, or a press outside the drawing. */
  | { readonly type: 'dismiss' }
  /** The atlas changed: its marks moved. */
  | { readonly type: 'reset' }

const keyOf = (ref: AtlasMarkRef | null): string | null => (ref ? markKey(ref) : null)

const open = (state: InspectState, ref: AtlasMarkRef, kept: boolean): InspectState =>
  keyOf(state.active) === markKey(ref) && state.kept === kept && state.muted === null ? state : { active: ref, kept, muted: null, shown: ref }

const close = (state: InspectState, muted: string | null): InspectState =>
  state.active === null && !state.kept && state.muted === muted ? state : { ...state, active: null, kept: false, muted }

export function inspect(state: InspectState, event: InspectEvent): InspectState {
  switch (event.type) {
    case 'point': {
      if (state.kept) return state
      const key = keyOf(event.ref)
      if (event.ref === null) return close(state, null)
      if (key === state.muted) return close(state, state.muted)
      return open(state, event.ref, false)
    }
    case 'focus':
      return open(state, event.ref, false)
    case 'blur':
      return state.kept ? state : close(state, state.muted)
    case 'keep':
      return state.kept && keyOf(state.active) === markKey(event.ref) ? close(state, markKey(event.ref)) : open(state, event.ref, true)
    case 'dismiss':
      return close(state, keyOf(state.active) ?? state.muted)
    case 'reset':
      return state === IDLE ? state : IDLE
  }
}
