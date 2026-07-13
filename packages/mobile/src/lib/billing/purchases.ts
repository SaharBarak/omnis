import { Platform } from 'react-native'
import Purchases, {
  LOG_LEVEL,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases'

import { ENV } from '@/lib/env'

/**
 * RevenueCat — the only place money changes hands.
 *
 * The App Store / Google Play are the merchant of record; RevenueCat is the
 * entitlement ledger in front of them. We configure it with the **Auth0 sub**
 * as the `appUserID`, which is the whole trick: the server looks the user up in
 * RevenueCat by that same id, so a purchase made on this phone unlocks the
 * user's account on the web too.
 *
 * In Expo Go the SDK falls back to its Preview API Mode (native calls become
 * JS mocks), so the paywall renders but real purchases do not work — those need
 * a development/EAS build.
 */

/** Entitlement identifiers, named after the plan tiers (server agrees). */
export type Entitlement = 'explorer' | 'complete' | 'practitioner' | 'lifetime'

function apiKey(): string | null {
  const key =
    Platform.OS === 'ios' ? ENV.revenueCatIosKey : ENV.revenueCatAndroidKey
  return key.length > 0 ? key : null
}

/** False when no RevenueCat key is configured — callers must degrade, not crash. */
export function isPurchasesConfigured(): boolean {
  return apiKey() !== null
}

let configuredFor: string | null = null

/**
 * Point RevenueCat at a signed-in user. Safe to call repeatedly; only does work
 * when the user actually changes. No-ops when no key is configured.
 */
export async function identifyPurchaser(userId: string): Promise<void> {
  const key = apiKey()
  if (key === null || configuredFor === userId) return

  if (configuredFor === null) {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN)
    // appUserID at configure time avoids ever minting an anonymous id we would
    // then have to alias to the real user.
    Purchases.configure({ apiKey: key, appUserID: userId })
  } else {
    // A different user signed in on the same device.
    await Purchases.logIn(userId)
  }
  configuredFor = userId
}

/** Detach the device from the user on sign-out, so purchases don't leak across accounts. */
export async function forgetPurchaser(): Promise<void> {
  if (apiKey() === null || configuredFor === null) return
  try {
    await Purchases.logOut()
  } catch {
    // Logging out of an anonymous id throws; nothing to clean up either way.
  }
  configuredFor = null
}

/** The current offering (the set of packages configured in RevenueCat). */
export async function getOffering(): Promise<PurchasesOffering | null> {
  if (apiKey() === null) return null
  const offerings = await Purchases.getOfferings()
  return offerings.current ?? null
}

/**
 * Buy a package. Resolves to the entitlements the customer holds afterwards.
 * A user-cancelled purchase resolves to `null` rather than throwing — that is a
 * normal outcome, not an error to surface.
 */
export async function purchase(
  pkg: PurchasesPackage
): Promise<string[] | null> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg)
    return Object.keys(customerInfo.entitlements.active)
  } catch (error) {
    if ((error as { userCancelled?: boolean }).userCancelled === true) return null
    throw error
  }
}

/** Re-apply purchases already made with this store account (App Store requirement). */
export async function restore(): Promise<string[]> {
  if (apiKey() === null) return []
  const customerInfo = await Purchases.restorePurchases()
  return Object.keys(customerInfo.entitlements.active)
}
