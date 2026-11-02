import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import s from './notched.module.css'
import { BrandMark } from '@/components/brand-mark'
import { MotionToggle, Notch, PixelVideo, ThemeToggle, kit } from '@/components/bento-lab'
import { buildBentoLab } from '@/lib/data/bento-lab'
import { PORTAL_LOOP, SKY_LOOP } from '@/lib/data/lab-media'

export const revalidate = 3600

export const metadata = { title: 'Bento lab B · notched media' }

const NAV = [
  { href: '/learn', label: 'Learn' },
  { href: '/today', label: 'Today' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/login', label: 'Sign in' },
] as const

const delay = (i: number) => ({ '--i': i }) as React.CSSProperties

export default function BentoLabB() {
  const { today, guideOdds, commonest, oracle, readingSystems } = buildBentoLab()

  return (
    <div className={s.stage}>
      <main className={s.page}>
        {/* ---------- main media, notched twice ---------- */}
        <section className={s.main} aria-labelledby="lab-b-title">
          <PixelVideo media={PORTAL_LOOP} preload="auto" />
          <div className={s.scrim} />

          <Link href="/" className={`${s.brand} ${kit.rise}`} style={delay(1)} aria-label="Pleiad home">
            <BrandMark size={22} />
          </Link>

          <Notch corner="tr" className={s.navNotch}>
            <nav aria-label="Primary" className={`${s.nav} ${kit.rise}`} style={delay(2)}>
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className={`${kit.pill} ${s.navPill}`}>
                  {item.label}
                </Link>
              ))}
              <MotionToggle className={`${kit.iconButton} ${s.navIcon}`} />
              <ThemeToggle className={`${kit.iconButton} ${s.navIcon}`} />
            </nav>
          </Notch>

          <Notch corner="bl" className={s.titleNotch}>
            <span className={`${kit.pill} ${s.eyebrow} ${kit.rise}`} style={delay(3)}>
              <Sparkles size={12} aria-hidden /> {readingSystems.count} systems, one map
            </span>
            <h1 id="lab-b-title" className={`${s.title} ${kit.rise}`} style={delay(4)}>
              <span className={s.titleLine}>Map your</span>
              <span className={s.titleLine}>people</span>
            </h1>
          </Notch>
        </section>

        {/* ---------- stat card: the rarest tie ---------- */}
        <section className={`${s.stat} ${kit.rise}`} style={delay(5)} aria-label="How rare a guide tie is">
          <div className={s.statTop}>
            <Link href="/calculate" className={`${kit.pill} ${s.statPill}`}>
              <ArrowUpRight size={12} aria-hidden /> Start free
            </Link>
            <div className={s.seats}>
              <span className={s.avatars}>
                {oracle.slice(0, 3).map((seat) => (
                  <span key={seat.role} className={s.avatar} title={`${seat.role} · ${seat.seal.name}`}>
                    <Image src={seat.seal.src} alt="" width={16} height={16} className={s.avatarGlyph} />
                  </span>
                ))}
              </span>
              <span className={s.seatsCaption}>Today&apos;s oracle seats</span>
            </div>
          </div>

          <div className={s.statFigure}>
            <b>{guideOdds.percent}</b>
            <span>
              of pairs share an exact guide tie: {guideOdds.bits.toFixed(1)} bits. {commonest.label} shows up in{' '}
              {commonest.percent} of pairs: {commonest.bits.toFixed(1)} bits.
            </span>
          </div>

          <Notch corner="br" className={s.arrowNotch}>
            <Link href="/compatibility" className={s.arrow} aria-label="Compare two people">
              <ArrowUpRight size={18} aria-hidden />
            </Link>
          </Notch>
        </section>

        {/* ---------- second media with caption inset ---------- */}
        <section className={`${s.second} ${kit.rise}`} style={delay(6)} aria-label="What Pleiad does">
          <PixelVideo media={SKY_LOOP} />
          <div className={`${kit.glass} ${s.caption}`}>
            <span className={s.captionDot} aria-hidden />
            <p>
              Save everyone you love. Read each person through {readingSystems.lead} systems, then see the ties only
              two people make together.
            </p>
            <p className={s.captionToday}>
              Today · {today.label} · {today.hebrewDate}
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
