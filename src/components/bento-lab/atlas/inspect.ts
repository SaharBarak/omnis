import { markKey, type AtlasMarkRef } from '@/lib/atlas/marks'

/**
 * Which card is open (docs/redesign/BENTO_SITE.md, "Marks explain
 * themselves" and "Facts explain themselves"). Pure: the drawing and the
 * digest feed it pointer, focus and key events and draw what it says. It is
 * written once over any reference with a stable key, so the marks and the
 * digest's facts follow one model. An event that changes nothing returns the
 * same state, so nothing renders again while the pointer moves within one
 * target.
 */

export interface InspectState<Ref = AtlasMarkRef> {
  /** The reference whose card is open. */
  readonly active: Ref | null
  /** Kept open by a tap, a click, Enter or Space: the pointer moving elsewhere leaves it. */
  readonly kept: boolean
  /** Opened by focus: the pointer passing over other targets neither replaces nor closes it. */
  readonly focused: boolean
  /** Closed on purpose: stays closed until the pointer finds another target or leaves. */
  readonly muted: string | null
  /** The last reference shown, so a closing card leaves with its words. */
  readonly shown: Ref | null
}

export const IDLE: InspectState<never> = Object.freeze({ active: null, kept: false, focused: false, muted: null, shown: null })

export type InspectEvent<Ref = AtlasMarkRef> =
  /** The pointer is over a target, or over none. */
  | { readonly type: 'point'; readonly ref: Ref | null }
  /** Keyboard focus reached a target. Focus wins over a kept card. */
  | { readonly type: 'focus'; readonly ref: Ref }
  /** Focus left the targets. */
  | { readonly type: 'blur' }
  /** A tap, a click, Enter or Space on a target: keeps its card, or closes it when it is the one kept. */
  | { readonly type: 'keep'; readonly ref: Ref }
  /** Escape, or a press outside. */
  | { readonly type: 'dismiss' }
  /** The atlas changed: the targets moved. */
  | { readonly type: 'reset' }

export type Inspect<Ref> = (state: InspectState<Ref>, event: InspectEvent<Ref>) => InspectState<Ref>

/** The reducer over references told apart by `keyOf`. */
export function createInspect<Ref>(keyOf: (ref: Ref) => string): Inspect<Ref> {
  const key = (ref: Ref | null): string | null => (ref === null ? null : keyOf(ref))

  const open = (state: InspectState<Ref>, ref: Ref, kept: boolean, focused: boolean): InspectState<Ref> =>
    key(state.active) === keyOf(ref) && state.kept === kept && state.focused === focused && state.muted === null
      ? state
      : { active: ref, kept, focused, muted: null, shown: ref }

  const close = (state: InspectState<Ref>, muted: string | null): InspectState<Ref> =>
    state.active === null && !state.kept && !state.focused && state.muted === muted
      ? state
      : { ...state, active: null, kept: false, focused: false, muted }

  return (state, event) => {
    switch (event.type) {
      case 'point': {
        if (state.kept || state.focused) return state
        if (event.ref === null) return close(state, null)
        if (keyOf(event.ref) === state.muted) return close(state, state.muted)
        return open(state, event.ref, false, false)
      }
      case 'focus':
        return open(state, event.ref, false, true)
      case 'blur':
        if (state.kept) return state.focused ? { ...state, focused: false } : state
        return close(state, state.muted)
      case 'keep':
        return state.kept && key(state.active) === keyOf(event.ref) ? close(state, keyOf(event.ref)) : open(state, event.ref, true, state.focused)
      case 'dismiss':
        return close(state, key(state.active) ?? state.muted)
      case 'reset':
        return state === IDLE ? state : IDLE
    }
  }
}

/** The drawing's marks. */
export const inspect: Inspect<AtlasMarkRef> = createInspect(markKey)
