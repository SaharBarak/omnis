import type { PlanTier, Subscription } from '@pleiad/api-client'
import { useQueryClient } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { XIcon } from 'phosphor-react-native'
import { useEffect, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases'
import Animated, { FadeIn, SlideInDown, useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button, Divider, Eyebrow } from '@/components/ui/primitives'
import { api, useSubscription } from '@/lib/api'
import {
  getOffering,
  isPurchasesConfigured,
  purchase,
  restore,
} from '@/lib/billing/purchases'
import { showToast } from '@/lib/toast'
import { COLORS, DURATION, FONTS, RADII, SPACE, SPRING, TYPE } from '@/theme/tokens'

/**
 * S18 paywall — F11. Trigger-specific headline, the five-tier ladder with the
 * §6 feature ledger, and a real in-app purchase.
 *
 * The App Store / Google Play are the merchant of record. On success we ask the
 * server for a forced re-sync, which re-fetches the entitlement straight from
 * RevenueCat — so the plan flips immediately rather than racing the webhook,
 * and the same purchase unlocks the user's account on the web.
 *
 * Client checks are UX only; the server 403 limit_exceeded is the truth.
 */

export type PaywallTrigger =
  | 'people-cap'
  | 'system-lock'
  | 'bond-lock'
  | 'group-insights'
  | 'generic'

interface TriggerCopy {
  eyebrow: string
  headline: (limit: number, planName: string) => string
  body: string
}

const TRIGGER_COPY: Record<PaywallTrigger, TriggerCopy> = {
  'people-cap': {
    eyebrow: 'YOUR MAP IS FULL',
    headline: (limit, planName) => `Your map holds ${limit} people on ${planName}.`,
    body: 'Every person you keep gets the full five-system reading. Larger maps open with a plan — nothing you typed is lost.',
  },
  'system-lock': {
    eyebrow: 'FOUR MORE SYSTEMS',
    headline: () => 'One person, five readings.',
    body: 'Tzolkin, Astrology, Human Design and Kabbalah are already computed for everyone on your map. A plan lifts the veil.',
  },
  'bond-lock': {
    eyebrow: 'THE BOND RUNS DEEPER',
    headline: () => 'Compatibility reads five systems deep.',
    body: 'Synastry, Human Design, Tzolkin and name resonance are waiting for this pair. Complete opens the full stack — and lets you keep the bond on your map.',
  },
  'group-insights': {
    eyebrow: 'THE CIRCLE IS READ',
    headline: () => "Group insight is a practitioner's craft.",
    body: 'Strengths, gaps and patterns across the whole circle are already computed. Practitioner unlocks the reading.',
  },
  generic: {
    eyebrow: 'GO FURTHER',
    headline: () => 'The whole map opens with a plan.',
    body: 'More people, every system, AI interpretation, timelines and the bonds between charts.',
  },
}

/** Feature ledger values — hardcoded mirror of spec §6 / server PLANS. */
interface TierLedger {
  profiles: string
  systems: string
  ai: string
  timeline: string
  bonds: string
  groups: string
}

interface Tier {
  plan: PlanTier
  name: string
  price: string
  note?: string
  recommended?: boolean
  ledger: TierLedger
}

const TIERS: readonly Tier[] = [
  {
    plan: 'free',
    name: 'Free',
    price: '$0',
    ledger: {
      profiles: '3',
      systems: 'Dreamspell only',
      ai: '—',
      timeline: '—',
      bonds: '—',
      groups: '—',
    },
  },
  {
    plan: 'explorer',
    name: 'Explorer',
    price: '$5/mo',
    ledger: {
      profiles: '15',
      systems: 'All six',
      ai: '5/mo',
      timeline: 'Yes',
      bonds: 'Basic',
      groups: '—',
    },
  },
  {
    plan: 'complete',
    name: 'Complete',
    price: '$9/mo',
    recommended: true,
    ledger: {
      profiles: '25',
      systems: 'All six',
      ai: '50/mo',
      timeline: 'Yes',
      bonds: 'Basic',
      groups: '—',
    },
  },
  {
    plan: 'practitioner',
    name: 'Practitioner',
    price: '$29/mo',
    ledger: {
      profiles: 'Unlimited',
      systems: 'All six',
      ai: 'Unlimited',
      timeline: 'Yes',
      bonds: 'Advanced',
      groups: 'Yes',
    },
  },
  {
    plan: 'lifetime',
    name: 'Founding',
    price: '$79 once',
    note: 'Unlimited, forever',
    ledger: {
      profiles: 'Unlimited',
      systems: 'All six',
      ai: '50/mo',
      timeline: 'Yes',
      bonds: 'Advanced',
      groups: 'Yes',
    },
  },
] as const

const LEDGER_ROWS: ReadonlyArray<{ key: keyof TierLedger; label: string }> = [
  { key: 'profiles', label: 'PEOPLE' },
  { key: 'systems', label: 'SYSTEMS' },
  { key: 'ai', label: 'AI READINGS' },
  { key: 'timeline', label: 'TIMELINE' },
  { key: 'bonds', label: 'BONDS' },
  { key: 'groups', label: 'GROUP INSIGHTS' },
] as const

/** Gold — the ONE gold accent, reserved for the recommended tier. */
const GOLD = '#C9A227'

/**
 * Resolve the RevenueCat package backing a tier.
 *
 * Convention: each package in the RevenueCat offering is given an identifier
 * equal to the plan tier ('explorer' | 'complete' | 'practitioner' |
 * 'lifetime') — the same names as the entitlements the server maps back to
 * plans. The product-id fallback keeps an offering that was configured with
 * RevenueCat's default package identifiers ($rc_monthly, …) working too.
 */
function findPackage(
  offering: PurchasesOffering,
  plan: PlanTier
): PurchasesPackage | null {
  return (
    offering.availablePackages.find((p) => p.identifier === plan) ??
    offering.availablePackages.find((p) =>
      p.product.identifier.includes(plan)
    ) ??
    null
  )
}

function meterLine(label: string, used: number, limit: number | null): string {
  return `${label} ${used} / ${limit === null ? '∞' : limit}`
}

function UsageMeters({ subscription }: { subscription: Subscription }) {
  const { profiles, aiInterpretations } = subscription.usage
  const showAi = aiInterpretations.limit === null || aiInterpretations.limit > 0
  return (
    <View style={styles.usageRow}>
      <Text style={styles.usageText}>
        {meterLine('PEOPLE', profiles.used, profiles.limit)}
      </Text>
      {showAi && (
        <Text style={styles.usageText}>
          {meterLine('AI', aiInterpretations.used, aiInterpretations.limit)}
        </Text>
      )}
    </View>
  )
}

function TierRow({
  tier,
  current,
  selected,
  onSelect,
}: {
  tier: Tier
  current: boolean
  selected: boolean
  onSelect: () => void
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={[
        styles.tierRow,
        selected && styles.tierRowSelected,
        tier.recommended === true && styles.tierRowRecommended,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${tier.name} — ${tier.price}`}
    >
      <View style={styles.tierText}>
        <Text style={TYPE.card}>{tier.name}</Text>
        {tier.recommended === true && (
          <Text style={[styles.tierBadge, { color: GOLD }]}>RECOMMENDED</Text>
        )}
        {tier.note !== undefined && <Text style={styles.tierNote}>{tier.note}</Text>}
        {current && <Text style={styles.tierBadge}>YOUR PLAN</Text>}
      </View>
      <Text style={styles.tierPrice}>{tier.price}</Text>
    </Pressable>
  )
}

export function PaywallSheet({
  visible,
  onClose,
  trigger,
}: {
  visible: boolean
  onClose: () => void
  trigger: PaywallTrigger
}) {
  const reduced = useReducedMotion()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const subscription = useSubscription()

  const [selected, setSelected] = useState<PlanTier>('complete')
  const [phase, setPhase] = useState<'idle' | 'purchasing' | 'restoring'>('idle')
  const [offering, setOffering] = useState<PurchasesOffering | null>(null)

  const currentPlan = subscription.data?.plan ?? 'free'
  const planName = subscription.data?.planName ?? 'Free'
  const profileLimit = subscription.data?.usage.profiles.limit ?? 3

  const copy = TRIGGER_COPY[trigger]
  const purchasable = isPurchasesConfigured()

  // Load the offering when the sheet opens (products come from the store).
  useEffect(() => {
    if (!visible || !purchasable) return
    let cancelled = false
    void getOffering()
      .then((current) => {
        if (!cancelled) setOffering(current)
      })
      .catch(() => {
        // Leave `offering` null — the CTA falls back to a disabled state.
      })
    return () => {
      cancelled = true
    }
  }, [visible, purchasable])

  const selectedPackage =
    offering !== null && selected !== 'free'
      ? findPackage(offering, selected)
      : null

  const buyDisabled =
    selected === 'free' ||
    selected === currentPlan ||
    phase !== 'idle' ||
    selectedPackage === null

  /** Pull the server's view forward: it re-fetches RevenueCat, so no webhook race. */
  const syncPlanFromServer = async (): Promise<Subscription> => {
    const fresh = await api.billing.getSubscription({ refresh: true })
    queryClient.setQueryData(['subscription'], fresh)
    await queryClient.invalidateQueries({ queryKey: ['subscription'] })
    return fresh
  }

  const buy = async () => {
    if (selectedPackage === null || phase !== 'idle') return
    setPhase('purchasing')
    try {
      const entitlements = await purchase(selectedPackage)
      if (entitlements === null) return // user cancelled — not an error

      const fresh = await syncPlanFromServer()
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onClose()
      showToast(`Welcome to ${fresh.planName}.`)
    } catch {
      showToast("That purchase didn't go through. Nothing was charged.")
    } finally {
      setPhase('idle')
    }
  }

  /** App Store requires a visible way to re-apply an existing purchase. */
  const restorePurchases = async () => {
    if (phase !== 'idle') return
    setPhase('restoring')
    try {
      const entitlements = await restore()
      const fresh = await syncPlanFromServer()
      if (entitlements.length === 0 && fresh.plan === 'free') {
        showToast('No previous purchase found on this store account.')
        return
      }
      onClose()
      showToast(`Restored — you're on ${fresh.planName}.`)
    } catch {
      showToast("Couldn't restore purchases. Try again.")
    } finally {
      setPhase('idle')
    }
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View
          entering={reduced ? undefined : FadeIn.duration(DURATION.normal)}
          style={StyleSheet.absoluteFill}
        >
          <Pressable
            style={[StyleSheet.absoluteFill, styles.scrim]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
        </Animated.View>

        <Animated.View
          entering={
            reduced
              ? undefined
              : SlideInDown.springify().damping(SPRING.damping).stiffness(SPRING.stiffness)
          }
          style={[styles.sheet, { paddingBottom: insets.bottom + SPACE.cardPad }]}
        >
          <View style={styles.header}>
            <Eyebrow color={COLORS.brandSoft}>{copy.eyebrow}</Eyebrow>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <XIcon size={20} color={COLORS.text50} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={TYPE.zone}>{copy.headline(profileLimit, planName)}</Text>
            <Text style={styles.body}>{copy.body}</Text>

            {/* Current plan + usage — only once the subscription is real. */}
            {subscription.data !== undefined && (
              <View style={styles.currentBlock}>
                <Eyebrow>{`ON ${subscription.data.planName.toUpperCase()}`}</Eyebrow>
                <UsageMeters subscription={subscription.data} />
              </View>
            )}
            {subscription.isPending && (
              <View style={styles.usageSkeleton}>
                <View style={styles.skeletonLine} />
              </View>
            )}

            <View style={styles.ladder}>
              {TIERS.map((tier) => (
                <TierRow
                  key={tier.plan}
                  tier={tier}
                  current={tier.plan === currentPlan}
                  selected={tier.plan === selected}
                  onSelect={() => setSelected(tier.plan)}
                />
              ))}
            </View>

            <View style={styles.ledger}>
              {LEDGER_ROWS.map(({ key, label }, index) => {
                const tier = TIERS.find((candidate) => candidate.plan === selected)
                return (
                  <View key={key}>
                    <View style={styles.ledgerRow}>
                      <Text style={TYPE.eyebrow}>{label}</Text>
                      <Text style={styles.ledgerValue}>
                        {tier?.ledger[key] ?? '—'}
                      </Text>
                    </View>
                    {index < LEDGER_ROWS.length - 1 && <Divider />}
                  </View>
                )
              })}
            </View>

            {purchasable ? (
              <>
                <Button onPress={() => void buy()} disabled={buyDisabled}>
                  {phase === 'purchasing'
                    ? 'Confirming your plan…'
                    : selectedPackage !== null
                      ? `Get ${selectedPackage.product.priceString}`
                      : 'Continue'}
                </Button>

                {selected === currentPlan && selected !== 'free' && (
                  <Text style={styles.note}>THIS IS ALREADY YOUR PLAN</Text>
                )}
                {offering === null && (
                  <Text style={styles.note}>LOADING PLANS…</Text>
                )}

                <Button
                  variant="secondary"
                  onPress={() => void restorePurchases()}
                  disabled={phase !== 'idle'}
                >
                  {phase === 'restoring' ? 'Restoring…' : 'Restore purchases'}
                </Button>

                <Text style={styles.note}>
                  BILLED BY THE APP STORE · CANCEL ANY TIME IN YOUR SUBSCRIPTION
                  SETTINGS
                </Text>
              </>
            ) : (
              <Text style={styles.note}>PURCHASES AREN&apos;T AVAILABLE HERE YET</Text>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    backgroundColor: 'rgba(11,13,22,0.72)',
  },
  sheet: {
    maxHeight: '90%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADII.feature,
    borderTopRightRadius: RADII.feature,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACE.featurePad,
    paddingTop: SPACE.featurePad,
    gap: SPACE.cardPad,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrollContent: {
    gap: SPACE.cardPad,
    paddingBottom: SPACE.unit * 2,
  },
  body: {
    ...TYPE.body,
    color: COLORS.text70,
  },
  currentBlock: {
    gap: 8,
  },
  usageRow: {
    flexDirection: 'row',
    gap: SPACE.cardPad,
  },
  usageText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.5,
    color: COLORS.brandBright,
    fontVariant: ['tabular-nums'],
  },
  usageSkeleton: {
    paddingVertical: 4,
  },
  skeletonLine: {
    height: 16,
    width: '48%',
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface2,
  },
  ladder: {
    gap: 10,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.cardPad,
    borderRadius: RADII.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardFill,
    paddingHorizontal: SPACE.cardPad,
    paddingVertical: 14,
  },
  tierRowSelected: {
    borderColor: COLORS.brandSoft,
    backgroundColor: COLORS.surface2,
  },
  tierRowRecommended: {
    borderColor: GOLD,
  },
  tierText: {
    flex: 1,
    gap: 3,
  },
  tierBadge: {
    ...TYPE.statLabel,
  },
  tierNote: {
    ...TYPE.bodySm,
    color: COLORS.text50,
  },
  tierPrice: {
    fontFamily: FONTS.monoMedium,
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.brandBright,
    fontVariant: ['tabular-nums'],
  },
  ledger: {
    paddingTop: SPACE.unit,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.cardPad,
    paddingVertical: 12,
  },
  ledgerValue: {
    ...TYPE.bodySm,
    color: COLORS.text90,
  },
  note: {
    ...TYPE.statLabel,
    textAlign: 'center',
  },
})
