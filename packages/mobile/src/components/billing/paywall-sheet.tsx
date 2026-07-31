import type { PlanTier, Subscription } from '@pleiad/api-client'
import { useQueryClient } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { XIcon } from 'phosphor-react-native'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases'

import { BottomSheet, Button, Card, Divider, IconButton, Text } from '@/components/m3'
import { api, useSubscription } from '@/lib/api'
import {
  getOffering,
  isPurchasesConfigured,
  purchase,
  restore,
} from '@/lib/billing/purchases'
import { showToast } from '@/lib/toast'
import { SHAPE, SPACE, useTheme } from '@/theme/m3'

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
    eyebrow: 'Your map is full',
    headline: (limit, planName) => `Your map holds ${limit} people on ${planName}.`,
    body: 'Every person you keep gets the full nine-system reading. Larger maps open with a plan. Nothing you typed is lost.',
  },
  'system-lock': {
    eyebrow: 'Eight more systems',
    headline: () => 'One person, nine readings.',
    body: 'Tzolkin, Long Count, Astrology, Human Design, Kabbalah, Numerology, BaZi and the Gene Keys are already computed for everyone on your map. A plan lifts the veil.',
  },
  'bond-lock': {
    eyebrow: 'The bond runs deeper',
    headline: () => 'Compatibility reads five systems deep.',
    body: 'Synastry, Human Design, Tzolkin and name resonance are waiting for this pair. Complete opens the full stack, and lets you keep the bond on your map.',
  },
  'group-insights': {
    eyebrow: 'The circle is read',
    headline: () => "Group insight is a practitioner's craft.",
    body: 'Strengths, gaps and patterns across the whole circle are already computed. Practitioner unlocks the reading.',
  },
  generic: {
    eyebrow: 'Go further',
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
      systems: 'All nine',
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
      systems: 'All nine',
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
      systems: 'All nine',
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
      systems: 'All nine',
      ai: '50/mo',
      timeline: 'Yes',
      bonds: 'Advanced',
      groups: 'Yes',
    },
  },
] as const

const LEDGER_ROWS: ReadonlyArray<{ key: keyof TierLedger; label: string }> = [
  { key: 'profiles', label: 'People' },
  { key: 'systems', label: 'Systems' },
  { key: 'ai', label: 'AI readings' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'bonds', label: 'Bonds' },
  { key: 'groups', label: 'Group insights' },
] as const

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
      {/* Meter readouts stay bright — they are the number being argued about. */}
      <Text variant="dataSmall" color="primary">
        {meterLine('People', profiles.used, profiles.limit)}
      </Text>
      {showAi && (
        <Text variant="dataSmall" color="primary">
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
  const theme = useTheme()

  return (
    <Card
      variant="outlined"
      onPress={onSelect}
      accessibilityLabel={`${tier.name}, ${tier.price}`}
      style={[
        styles.tierRow,
        selected && {
          borderColor: theme.colors.primary,
          backgroundColor: theme.surfaceAt(2),
        },
        // The recommendation outranks the selection: gold survives either way.
        tier.recommended === true && { borderColor: theme.colors.tertiary },
      ]}
    >
      <View style={styles.tierText}>
        <Text variant="titleMedium">{tier.name}</Text>
        {tier.recommended === true && (
          <Text variant="labelMedium" color="tertiary">
            Recommended
          </Text>
        )}
        {tier.note !== undefined && (
          <Text variant="bodySmall" color="onSurfaceVariant">
            {tier.note}
          </Text>
        )}
        {current && (
          <Text variant="labelMedium" color="onSurfaceVariant">
            Your plan
          </Text>
        )}
      </View>
      {/* Prices are emphasised numerals, not quiet settings data. */}
      <Text variant="dataMedium">{tier.price}</Text>
    </Card>
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
  const theme = useTheme()
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
      showToast(`Restored: you're on ${fresh.planName}.`)
    } catch {
      showToast("Couldn't restore purchases. Try again.")
    } finally {
      setPhase('idle')
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text variant="labelLarge" color="primary">
          {copy.eyebrow}
        </Text>
        <IconButton
          icon={(color) => <XIcon size={24} color={color} />}
          onPress={onClose}
          accessibilityLabel="Close"
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text variant="headlineSmall">{copy.headline(profileLimit, planName)}</Text>
        <Text variant="bodyLarge" color="onSurfaceVariant">
          {copy.body}
        </Text>

        {/* Current plan + usage — only once the subscription is real. */}
        {subscription.data !== undefined && (
          <View style={styles.currentBlock}>
            <Text variant="labelLarge" color="onSurfaceVariant">
              {`On ${subscription.data.planName}`}
            </Text>
            <UsageMeters subscription={subscription.data} />
          </View>
        )}
        {subscription.isPending && (
          <View
            style={[
              styles.skeletonLine,
              { backgroundColor: theme.colors.surfaceContainerHighest },
            ]}
          />
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
                  <Text variant="labelLarge" color="onSurfaceVariant">
                    {label}
                  </Text>
                  <Text variant="bodyMedium">{tier?.ledger[key] ?? '—'}</Text>
                </View>
                {index < LEDGER_ROWS.length - 1 && <Divider />}
              </View>
            )
          })}
        </View>

        {purchasable ? (
          <>
            <Button fullWidth onPress={() => void buy()} disabled={buyDisabled}>
              {phase === 'purchasing'
                ? 'Confirming your plan…'
                : selectedPackage !== null
                  ? `Get ${selectedPackage.product.priceString}`
                  : 'Continue'}
            </Button>

            {selected === currentPlan && selected !== 'free' && (
              <Text variant="labelMedium" color="onSurfaceVariant" style={styles.note}>
                This is already your plan
              </Text>
            )}
            {offering === null && (
              <Text variant="labelMedium" color="onSurfaceVariant" style={styles.note}>
                Loading plans…
              </Text>
            )}

            <Button
              variant="text"
              fullWidth
              onPress={() => void restorePurchases()}
              disabled={phase !== 'idle'}
            >
              {phase === 'restoring' ? 'Restoring…' : 'Restore purchases'}
            </Button>

            <Text variant="labelMedium" color="onSurfaceVariant" style={styles.note}>
              Billed by the App Store · cancel any time in your subscription settings
            </Text>
          </>
        ) : (
          <Text variant="labelMedium" color="onSurfaceVariant" style={styles.note}>
            Purchases aren&apos;t available here yet
          </Text>
        )}
      </ScrollView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACE.sm,
  },
  scrollContent: {
    gap: SPACE.lg,
    paddingBottom: SPACE.xl,
  },
  currentBlock: {
    gap: SPACE.sm,
  },
  usageRow: {
    flexDirection: 'row',
    gap: SPACE.lg,
  },
  skeletonLine: {
    height: 16,
    width: '48%',
    borderRadius: SHAPE.full,
  },
  ladder: {
    gap: SPACE.md,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.lg,
  },
  tierText: {
    flex: 1,
    gap: 2,
  },
  ledger: {
    paddingTop: SPACE.sm,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.lg,
    paddingVertical: SPACE.md,
  },
  note: {
    textAlign: 'center',
  },
})
