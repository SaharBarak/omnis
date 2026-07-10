import * as Notifications from 'expo-notifications'
import * as SecureStore from 'expo-secure-store'
import { create } from 'zustand'

/**
 * Push opt-in moment — F9: NOT on launch. After the first person lands on
 * the map (create onServerSuccess), a one-time designed prompt asks for the
 * morning digest. A module flag stops re-asks this session; a secure-store
 * flag stops re-asks across launches.
 */

const DISMISSED_KEY = 'pleiad.push.promptDismissed'

// Session guard — once asked (or decided), never re-ask until next launch.
let askedThisSession = false

interface PushOptInState {
  visible: boolean
  show: () => void
  /** Close and remember — the prompt never returns after one answer. */
  dismiss: () => void
}

export const usePushOptIn = create<PushOptInState>()((set) => ({
  visible: false,
  show: () => set({ visible: true }),
  dismiss: () => {
    set({ visible: false })
    void SecureStore.setItemAsync(DISMISSED_KEY, '1').catch(() => undefined)
  },
}))

/**
 * Called from the people create path: shows the prompt only when push
 * permission is still undetermined, once per session, once per install.
 * Never throws — the save path must stay untouched by prompt failures.
 */
export async function maybePromptForPush(): Promise<void> {
  try {
    if (askedThisSession) return
    askedThisSession = true

    const dismissed = await SecureStore.getItemAsync(DISMISSED_KEY)
    if (dismissed !== null) return

    const permission = await Notifications.getPermissionsAsync()
    if (permission.status !== 'undetermined') return

    usePushOptIn.getState().show()
  } catch {
    // Silent — the prompt is an invitation, not a requirement.
  }
}
