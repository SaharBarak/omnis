import Link from 'next/link'
import type { Inline, Rich } from '@/lib/site/legal'

type HrefResolver = (href: string) => string

const keepHref: HrefResolver = (href) => href
const isInternal = (href: string): boolean => href.startsWith('/')
const isExternal = (href: string): boolean => /^https?:\/\//.test(href)

interface PartProps {
  readonly part: Inline
  readonly resolveHref: HrefResolver
  readonly linkClassName?: string
}

function RichPart({ part, resolveHref, linkClassName }: PartProps) {
  if (typeof part === 'string') return part
  if (part.kind === 'strong') return <strong>{part.text}</strong>
  if (isInternal(part.href)) {
    return (
      <Link href={resolveHref(part.href)} className={linkClassName}>
        {part.text}
      </Link>
    )
  }
  if (isExternal(part.href)) {
    return (
      <a href={part.href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
        {part.text}
      </a>
    )
  }
  return (
    <a href={part.href} className={linkClassName}>
      {part.text}
    </a>
  )
}

export interface RichTextProps {
  readonly run: Rich
  /** Maps an in-app path to the tree being rendered. Live pages keep it as is. */
  readonly resolveHref?: HrefResolver
  readonly linkClassName?: string
}

/** Renders a run of legal or article text: plain strings, strong, links. */
export function RichText({ run, resolveHref = keepHref, linkClassName }: RichTextProps) {
  return (
    <>
      {run.map((part, index) => (
        <RichPart key={index} part={part} resolveHref={resolveHref} linkClassName={linkClassName} />
      ))}
    </>
  )
}
