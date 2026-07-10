import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

import { api } from '@/lib/api'

/**
 * Push client — F9. registerForPush() runs the whole chain (permission →
 * Expo token → device registration on the server) and resolves null quietly
 * wherever push simply isn't possible (simulator, Expo Go without a
 * projectId, denied permission). unregisterPush() is the sign-out mirror:
 * best-effort server delete of the stored token, never throws.
 */

const PUSH_TOKEN_KEY = 'pleiad.push.expoToken'

function resolveProjectId(): string | null {
  const easProjectId = Constants.easConfig?.projectId
  if (typeof easProjectId === 'string' && easProjectId.length > 0) return easProjectId
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: unknown } }
    | undefined
  const extraProjectId = extra?.eas?.projectId
  if (typeof extraProjectId === 'string' && extraProjectId.length > 0) {
    return extraProjectId
  }
  return null
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync()
  if (current.granted) return true
  if (!current.canAskAgain) return false
  const requested = await Notifications.requestPermissionsAsync()
  return requested.granted
}

/**
 * Permission request → Expo push token → POST /api/notifications/devices.
 * Resolves the token on success, null on any quiet dead end.
 */
export async function registerForPush(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null // simulators hold no push credentials

    const granted = await ensurePermission()
    if (!granted) return null

    // Expo Go (or a build without EAS wiring) has no projectId — silent no.
    const projectId = resolveProjectId()
    if (projectId === null) return null

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Daily sky',
        importance: Notifications.AndroidImportance.DEFAULT,
      })
    }

    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({
      projectId,
    })

    await api.notifications.registerDevice({
      expoPushToken,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    })
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, expoPushToken)
    return expoPushToken
  } catch {
    return null // push is an enhancement — never surface a failure here
  }
}

/**
 * Sign-out mirror — delete the device row server-side (while the bearer
 * token still exists), then forget the local copy. Best-effort throughout.
 */
export async function unregisterPush(): Promise<void> {
  try {
    const stored = await SecureStore.getItemAsync(PUSH_TOKEN_KEY)
    if (stored !== null) {
      await api.notifications.unregisterDevice(stored).catch(() => undefined)
    }
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY)
  } catch {
    // Silent — a stale device row is pruned server-side on the next send.
  }
}
