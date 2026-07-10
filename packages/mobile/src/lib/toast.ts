import { create } from 'zustand'

/**
 * App toast state — a single calm notice at a time (DESIGN_LANGUAGE §7:
 * success/error confirmations are subtle, bottom-sheet style). Rendered by
 * ToastHost (src/components/ui/toast.tsx); non-React code (mutation hooks)
 * raises toasts through `showToast`.
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
