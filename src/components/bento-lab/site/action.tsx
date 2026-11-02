'use client'

import Link from 'next/link'
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ForwardedRef,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { ArrowRight, ArrowUpRight, Check, Plus, Send, type LucideIcon } from 'lucide-react'
import { useMotionAllowed } from '../motion/use-motion-allowed'
import s from './site.module.css'
import { MAGNET } from '@/lib/design/motion-tokens'

interface Intent {
  readonly icon: LucideIcon
  /** How far the icon turns on hover and focus, in degrees. */
  readonly turn: number
  /** Whether the icon points along the line of text, so it mirrors in right-to-left text. */
  readonly mirror: boolean
}

/**
 * What the action does picks the icon in the signal disc and how it turns:
 * going on turns the arrow up and on, adding turns the plus a quarter, and
 * an icon that already points stays.
 */
const INTENTS = Object.freeze({
  forward: { icon: ArrowRight, turn: -45, mirror: true },
  add: { icon: Plus, turn: 90, mirror: false },
  save: { icon: Check, turn: 0, mirror: false },
  send: { icon: Send, turn: 0, mirror: true },
  out: { icon: ArrowUpRight, turn: 0, mirror: true },
} satisfies Record<string, Intent>)

export type ActionIntent = keyof typeof INTENTS

interface Look {
  readonly children: ReactNode
  readonly intent?: ActionIntent
  readonly size?: 'regular' | 'small'
}

type LinkAction = Look & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> & { readonly href: string; readonly external?: boolean }
type ButtonAction = Look & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & { readonly href?: never }
type ActionProps = LinkAction | ButtonAction
type Pointer = PointerEvent<HTMLElement>
type Handler = ((event: Pointer) => void) | undefined

const ICON_PX = { regular: 16, small: 14 } as const

const within = (value: number, reach: number): number => Math.max(-reach, Math.min(reach, value))

const lean = (el: HTMLElement, axis: 'x' | 'y'): number => Number.parseFloat(el.style.getPropertyValue(`--lean-${axis}`)) || 0

/**
 * Where the light sits and how far the pill leans, while a mouse is over it
 * and motion is allowed. The pointer is measured against the pill where it
 * stands unleaned, so the lean never feeds back into itself.
 */
function follow({ currentTarget: el, clientX, clientY }: Pointer): void {
  if (el.matches(':disabled, [aria-disabled="true"]')) return
  const box = el.getBoundingClientRect()
  const x = clientX - (box.left - lean(el, 'x'))
  const y = clientY - (box.top - lean(el, 'y'))
  el.dataset.follow = ''
  el.style.setProperty('--mx', `${x}px`)
  el.style.setProperty('--my', `${y}px`)
  el.style.setProperty('--lean-x', `${within((x - box.width / 2) * MAGNET.pull, MAGNET.reach)}px`)
  el.style.setProperty('--lean-y', `${within((y - box.height / 2) * MAGNET.pull, MAGNET.reach)}px`)
}

function release(el: HTMLElement): void {
  delete el.dataset.follow
  el.style.setProperty('--lean-x', '0px')
  el.style.setProperty('--lean-y', '0px')
}

/** The caller's handler first, then the component's own. */
const both =
  (own: (event: Pointer) => void, theirs: Handler) =>
  (event: Pointer): void => {
    theirs?.(event)
    own(event)
  }

function assign<T>(ref: ForwardedRef<T>, value: T | null): void {
  if (typeof ref === 'function') ref(value)
  else if (ref) ref.current = value
}

/**
 * The view's one call to action (BENTO_SITE.md "Primary action"): the
 * lantern at button size, a pill with a real label and one signal disc whose
 * icon turns on hover and focus. While motion is allowed, a light follows a mouse across it and it
 * leans toward the mouse; pressing scales it everywhere. Every attribute,
 * handler and ref a link or button takes reaches the element.
 */
export const PrimaryAction = forwardRef<HTMLAnchorElement | HTMLButtonElement, ActionProps>(function PrimaryAction(props, forwarded) {
  const { children, intent = 'forward', size = 'regular', className, style, onPointerMove, onPointerLeave, onPointerCancel, ...rest } = props
  const motion = useMotionAllowed()
  const own = useRef<HTMLElement | null>(null)
  const ref = useCallback(
    (el: HTMLAnchorElement | HTMLButtonElement | null) => {
      own.current = el
      assign(forwarded, el)
    },
    [forwarded],
  )

  useEffect(() => {
    if (!motion && own.current) release(own.current)
  }, [motion])

  const { icon: Icon, turn, mirror } = INTENTS[intent]
  const look = {
    className: [s.primary, size === 'small' ? s.primarySmall : '', className].filter(Boolean).join(' '),
    style: { ...style, '--turn': `${turn}deg` } as CSSProperties,
    onPointerMove: both((event) => {
      if (motion && event.pointerType === 'mouse') follow(event)
    }, onPointerMove as Handler),
    onPointerLeave: both((event) => release(event.currentTarget), onPointerLeave as Handler),
    onPointerCancel: both((event) => release(event.currentTarget), onPointerCancel as Handler),
  }
  const body = (
    <>
      <span className={s.primaryLabel}>{children}</span>
      <span className={s.signal} data-mirror={mirror || undefined} aria-hidden>
        <Icon size={ICON_PX[size]} />
      </span>
    </>
  )

  if (typeof rest.href === 'string') {
    const { href, external, ...anchor } = rest as Omit<LinkAction, keyof typeof look | keyof Look | 'onPointerCancel'>
    return external ? (
      <a target="_blank" {...anchor} rel={[anchor.rel, 'noopener noreferrer'].filter(Boolean).join(' ')} href={href} ref={ref} {...look}>
        {body}
      </a>
    ) : (
      <Link {...anchor} href={href} ref={ref} {...look}>
        {body}
      </Link>
    )
  }

  const { href: _href, ...button } = rest as Omit<ButtonAction, keyof typeof look | keyof Look | 'onPointerCancel'>
  return (
    <button type="button" {...button} ref={ref} {...look}>
      {body}
    </button>
  )
})
