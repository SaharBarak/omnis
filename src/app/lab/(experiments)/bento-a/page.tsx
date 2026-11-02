import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Menu, Plus, Search, User } from 'lucide-react'
import { HeroMedia } from './hero-media'
import s from './bento.module.css'
import { BrandMark } from '@/components/brand-mark'
import { ArtCanvas, ThemeToggle, kit } from '@/components/bento-lab'
import { buildBentoLab, type OracleSeat } from '@/lib/data/bento-lab'
import { LAB_MEDIA } from '@/lib/data/lab-media'

export const revalidate = 3600

export const metadata = { title: 'Bento lab A · three columns' }

const MENU = [
  { href: '/learn', label: 'Learn' },
  { href: '/today', label: 'Today' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/login', label: 'Sign in' },
] as const

const SPOT_CLASS = [s.spotA, s.spotB, s.spotC] as const

const delay = (i: number) => ({ '--i': i }) as React.CSSProperties

function Hotspot({ seat, index }: { readonly seat: OracleSeat; readonly index: number }) {
  return (
    <div className={`${s.spot} ${SPOT_CLASS[index]} ${kit.rise}`} style={delay(6 + index)}>
      <span className={s.pin}>
        <Image src={seat.seal.src} alt="" width={16} height={16} className={s.pinGlyph} />
      </span>
      <span className={s.spotLabel}>
        <span className={s.spotRole}>{seat.role}</span> · {seat.seal.name}
      </span>
    </div>
  )
}

export default function BentoLabA() {
  const lab = buildBentoLab()
  const { today, guideOdds, commonest, ties, plans, systems, readingSystems } = lab
  const seats = lab.oracle.slice(0, 3)
  const maxBits = Math.max(...ties.map((t) => t.bits), 1)

  return (
    <div className={s.stage}>
      <main className={s.page}>
        {/* ---------- left: brand, promise, today ---------- */}
        <section className={s.left}>
          <header className={`${s.topbar} ${kit.rise}`} style={delay(0)}>
            <Link href="/" className={s.logo}>
              <BrandMark size={24} />
              <span>Pleiad</span>
            </Link>
            <details className={s.menu}>
              <summary className={kit.pill}>
                <Menu size={13} aria-hidden />
                Menu
              </summary>
              <ul className={s.menuList}>
                {MENU.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </details>
          </header>

          <h1 className={`${s.title} ${kit.rise}`} style={delay(1)}>
            <span className={s.row}>Map the</span>
            <span className={s.row}>
              <span className={s.highlight}>people</span> who
            </span>
            <span className={s.row}>
              shape
              <span className={s.twin} aria-hidden>
                <span className={s.twinSeal}>
                  <Image src={today.seal.src} alt="" width={20} height={20} className={kit.glyph} />
                </span>
                <span className={s.twinSeal}>
                  <Image src={lab.oracle[0].seal.src} alt="" width={20} height={20} className={kit.glyph} />
                </span>
              </span>
            </span>
            <span className={s.row}>your life</span>
          </h1>

          <hr className={s.divider} />
          <p className={`${s.lead} ${kit.rise}`} style={delay(2)}>
            Save everyone who matters. Read each person through {readingSystems.lead} systems, then see the ties
            only two people make together.
          </p>

          <div className={`${s.ctas} ${kit.rise}`} style={delay(3)}>
            <Link href="/calculate" className={`${kit.pill} ${kit.pillSolid} ${s.cta}`}>
              Start free <ArrowUpRight size={14} aria-hidden />
            </Link>
            <Link href="/learn" className={`${kit.pill} ${s.cta}`}>
              Explore
            </Link>
          </div>

          <aside className={`${s.promo} ${kit.rise}`} style={delay(4)}>
            <p className={s.promoText}>
              Today is <strong>{today.label}</strong>, lit in the 260-day count.
            </p>
            <div className={s.promoRow}>
              <ArtCanvas
                art="tzolkin"
                kin={today.kin}
                tone={today.tone}
                className={s.promoArt}
                label={`The Tzolkin's 260 days, with today, kin ${today.kin}, lit`}
              />
              <Link href="/calculate" className={s.go} aria-label="Find your own kin">
                <ArrowRight size={15} aria-hidden />
              </Link>
            </div>
          </aside>
        </section>

        {/* ---------- center: the portal ---------- */}
        <section className={s.center} aria-label="Today's oracle">
          <HeroMedia media={LAB_MEDIA}>
            {seats.map((seat, index) => (
              <Hotspot key={seat.role} seat={seat} index={index} />
            ))}

            <div className={`${kit.glass} ${s.proof} ${kit.rise}`} style={delay(9)}>
              <b className={s.proofFigure}>{guideOdds.percent}</b>
              <small className={s.proofText}>
                of pairs share an exact guide tie: {guideOdds.bits.toFixed(1)} bits. {commonest.label} shows up in{' '}
                {commonest.percent}: {commonest.bits.toFixed(1)} bits.
              </small>
              <Link href="/compatibility" className={`${kit.pill} ${s.proofCta}`}>
                Compare two <ArrowUpRight size={12} aria-hidden />
              </Link>
            </div>

            <div className={`${kit.glass} ${s.systemsCard} ${kit.rise}`} style={delay(10)}>
              <p>One person, read {readingSystems.count} ways.</p>
              <ul>
                {systems.map((system) => (
                  <li key={system.key}>
                    <Link href={system.href} className={s.systemLink}>
                      <span className={s.systemDot} style={{ background: system.accent }} />
                      {system.name}
                      <ArrowUpRight size={12} aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </HeroMedia>
        </section>

        {/* ---------- right: utility, plans, proof, sky ---------- */}
        <section className={s.right}>
          <div className={`${s.utility} ${kit.rise}`} style={delay(2)}>
            <Link href="/learn" className={s.search}>
              <Search size={13} aria-hidden />
              <span>Search the library</span>
              <span className={s.searchGo}>Go</span>
            </Link>
            <ThemeToggle className={kit.iconButton} />
            <Link href="/login" className={kit.iconButton} aria-label="Sign in">
              <User size={14} aria-hidden />
            </Link>
          </div>

          <div className={`${s.plans} ${kit.rise}`} style={delay(3)}>
            {plans.map((plan, index) => (
              <details key={plan.key} className={s.plan} open={index === 0}>
                <summary className={s.planHead}>
                  <span className={s.planChip}>{plan.name}</span>
                  <span className={s.planPrice}>{plan.price}</span>
                  <span className={s.planPlus} aria-hidden>
                    <Plus size={12} />
                  </span>
                </summary>
                <div className={s.planBody}>
                  <div>
                    <p>{plan.line}</p>
                    <Link href="/pricing" className={s.planLink}>
                      Choose <ArrowUpRight size={11} aria-hidden />
                    </Link>
                  </div>
                  {index === 0 && (
                    <ArtCanvas
                      art="wavespell"
                      kin={today.kin}
                      tone={today.tone}
                      className={s.planArt}
                      label={`The 13 tones in bar-and-dot numerals; today is tone ${today.tone}, ${today.toneName}`}
                    />
                  )}
                </div>
              </details>
            ))}
          </div>

          <figure className={`${s.chart} ${kit.rise}`} style={delay(4)}>
            <figcaption className={s.chartHead}>
              <span>What a tie is worth</span>
              <span className={kit.eyebrow}>bits</span>
            </figcaption>
            <ul className={s.bars}>
              {ties.map((tie) => (
                <li key={tie.type} className={s.bar}>
                  <span className={s.barLabel}>{tie.label}</span>
                  <span className={s.barTrack}>
                    <i style={{ width: `${Math.max(3, (tie.bits / maxBits) * 100)}%` }} />
                  </span>
                  <span className={s.barValue}>{tie.bits.toFixed(1)}</span>
                </li>
              ))}
            </ul>
            <p className={s.chartNote}>Measured share of pairs, scored as −log₂(share).</p>
          </figure>

          <div className={`${s.orbit} ${kit.rise}`} style={delay(5)}>
            <div className={s.ring} />
            <ArtCanvas art="sky" kin={today.kin} tone={today.tone} className={s.globe} label="A turning sky sphere with the ecliptic" />
            <span className={`${s.tag} ${s.tag1}`}>{today.moon}</span>
            <span className={`${s.tag} ${s.tag2}`}>{today.sun}</span>
            <span className={`${s.tag} ${s.tag3}`}>{today.gate}</span>
          </div>
        </section>
      </main>
    </div>
  )
}
