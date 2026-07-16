import { create } from 'zustand'

/**
 * Snackbar state — one message at a time.
 *
 * Rendered by `SnackbarHost`, which is mounted once at the app root. It used to
 * be mounted per screen, which meant a message raised from inside a sheet could
 * be torn down along with the sheet before anyone read it.
 *
 * Non-React code (mutation hooks) raises messages through `showToast`.
 */

interface ToastState {
  message: string | null
  /** Monotonic sequence so repeat messages re-trigger the host animation. */
  seq: number
  show: (message: string) => void
  dismiss: () => void
}

export const useToastStore = create<ToastState>()((set) => ({
  message: null,
  seq: 0,
  show: (message) => set((state) => ({ message, seq: state.seq + 1 })),
  dismiss: () => set({ message: null }),
}))

/** Imperative entry point for hooks and stores. */
export function showToast(message: string): void {
  useToastStore.getState().show(message)
}
