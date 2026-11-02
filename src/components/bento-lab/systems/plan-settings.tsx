'use client'

import { Check } from 'lucide-react'
import s from './systems.module.css'
import { SystemSection } from './system-page'
import kit from '../kit.module.css'
import { PlanLedger } from '../blocks'
import { PrimaryAction, Skeleton } from '../site'
import site from '../site/site.module.css'
import { usePlan } from '@/lib/hooks/use-plan'
import { planCards } from '@/lib/site/plans'
import { APP_STORE_URL, PLAY_STORE_URL, hasStoreLinks } from '@/lib/store-links'

/**
 * The account's plan, read through the same gate the system pages use.
 * Paid plans are store purchases, so the web shows the plan and points at
 * the app; it never takes payment.
 */
export function PlanSettings() {
  const { plan, loading } = usePlan()
  const current = planCards().find((p) => p.id === plan)
  return (
    <SystemSection id="plan" title="Plan" lead="Plans are bought in the Pleiad app. A purchase there opens the same readings here, on the same account.">
      {loading || !current ? (
        <Skeleton height={180} />
      ) : (
        <div className={s.grid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))' }}>
          <div className={site.card} style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
            <span className={kit.eyebrow}>Your plan</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <h3 className={site.h3}>{current.name}</h3>
              <span className={s.tileText}>
                {current.price}
                {current.cadence}
              </span>
            </div>
            <ul className={s.facts}>
              {current.facts.map((f) => (
                <li key={f} style={{ display: 'flex', gap: 8 }}>
                  <Check size={15} aria-hidden style={{ marginTop: 2, flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className={s.note} style={{ alignContent: 'start' }}>
            <span className={kit.eyebrow}>Change plan</span>
            {hasStoreLinks ? (
              <div className={site.actions}>
                {APP_STORE_URL && (
                  <PrimaryAction href={APP_STORE_URL} external intent="out" size="small">
                    App Store
                  </PrimaryAction>
                )}
                {PLAY_STORE_URL && (
                  <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer" className={`${site.btn} ${site.btnSmall}`}>
                    Google Play
                  </a>
                )}
              </div>
            ) : (
              <p>The app is on its way to the App Store and Google Play. Plans open there first.</p>
            )}
          </div>
        </div>
      )}
      <details>
        <summary className={s.tileLabel} style={{ cursor: 'pointer', paddingBlock: 6 }}>
          Compare every plan
        </summary>
        <PlanLedger />
      </details>
    </SystemSection>
  )
}
