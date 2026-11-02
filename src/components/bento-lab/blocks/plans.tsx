import Link from 'next/link'
import { Check, Minus } from 'lucide-react'
import b from './blocks.module.css'
import { LiftCard, RevealRows } from './plan-motion'
import kit from '../kit.module.css'
import { PrimaryAction } from '../site/action'
import site from '../site/site.module.css'
import { planCards, planLedger, PLAN_ORDER, type PlanCard } from '@/lib/site/plans'
import { PLANS } from '@/lib/services/billing'

function Card({ plan }: { plan: PlanCard }) {
  return (
    <LiftCard className={`${b.plan} ${plan.featured ? b.planFeatured : ''}`} labelledBy={`plan-${plan.id}`}>
      <header className={b.planHead}>
        <h3 id={`plan-${plan.id}`} className={site.h3}>
          {plan.name}
        </h3>
        <span className={b.planTagline}>{plan.tagline}</span>
      </header>
      <div className={b.priceRow}>
        <span className={b.price}>{plan.price}</span>
        {plan.cadence && <span className={b.cadence}>{plan.cadence}</span>}
      </div>
      <ul className={b.facts}>
        {plan.facts.map((f) => (
          <li key={f}>
            <Check size={15} aria-hidden className={b.factMark} />
            {f}
          </li>
        ))}
      </ul>
      {plan.featured ? (
        <PrimaryAction href={plan.action.href} external={plan.action.external} intent={plan.action.external ? 'out' : 'forward'} size="small">
          {plan.cta}
        </PrimaryAction>
      ) : plan.action.external ? (
        <a href={plan.action.href} target="_blank" rel="noreferrer" className={`${site.btn} ${site.btnSmall}`}>
          {plan.cta}
        </a>
      ) : (
        <Link href={plan.action.href} className={`${site.btn} ${site.btnSmall}`}>
          {plan.cta}
        </Link>
      )}
    </LiftCard>
  )
}

/** Every plan, facts derived from billing limits. */
export function PlanCards() {
  return (
    <div className={b.plans}>
      {planCards().map((p) => (
        <Card key={p.id} plan={p} />
      ))}
    </div>
  )
}

/** The comparison ledger as a table; rows arrive one after another as it comes into view. */
export function PlanLedger() {
  return (
    <div className={`${site.tableScroll} ${b.ledger}`}>
      <table className={site.table} style={{ minWidth: 720 }}>
        <thead>
          <tr>
            <th scope="col">Included</th>
            {PLAN_ORDER.map((id) => (
              <th key={id} scope="col">
                {PLANS[id].name}
              </th>
            ))}
          </tr>
        </thead>
        <RevealRows
          rows={planLedger().map((row) => ({
            key: row.label,
            cells: (
              <>
                <td>{row.label}</td>
                {PLAN_ORDER.map((id) => (
                  <td key={id}>
                    {row.values[id] ?? (
                      <>
                        <Minus size={14} aria-hidden />
                        <span className={kit.srOnly}>Not included</span>
                      </>
                    )}
                  </td>
                ))}
              </>
            ),
          }))}
        />
      </table>
    </div>
  )
}
