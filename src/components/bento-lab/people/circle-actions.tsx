'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { DialogButton } from '../site/dialog'
import { useAppHrefs } from '../site/site-tree'
import site from '../site/site.module.css'
import { useGroups } from '@/lib/hooks/use-groups'
import { useShares } from '@/lib/hooks/use-shares'
import type { ShareOptions } from '@/lib/types/relationship'

interface CircleRef {
  readonly id: string
  readonly name: string
}

/** Every system a shared view can carry: a circle is shared whole. */
const SHARED_SYSTEMS: ShareOptions['includeSystems'] = ['dreamspell', 'tzolkin', 'astrology', 'humandesign', 'gematria']

type Link =
  | { readonly kind: 'idle' }
  | { readonly kind: 'making' }
  | { readonly kind: 'made'; readonly url: string; readonly copied: boolean }
  | { readonly kind: 'failed' }

/** Makes a share link for the circle on a press, and offers it to copy. */
function ShareCircle({ circle }: { readonly circle: CircleRef }) {
  const { createShare } = useShares()
  const [link, setLink] = useState<Link>({ kind: 'idle' })
  const make = () => {
    setLink({ kind: 'making' })
    void createShare({ shareType: 'group', options: { groupId: circle.id, includeSystems: [...SHARED_SYSTEMS], includeAnalysis: true } }).then((made) =>
      setLink(made ? { kind: 'made', url: made.url, copied: false } : { kind: 'failed' }),
    )
  }
  const copy = (url: string) =>
    navigator.clipboard.writeText(url).then(
      () => setLink({ kind: 'made', url, copied: true }),
      () => undefined,
    )
  return (
    <>
      <p>Anyone with the link sees {circle.name}: its people, their maps and the ties between them. A link can be turned off in settings.</p>
      {link.kind === 'made' && <input className={site.input} readOnly value={link.url} aria-label="Share link" onFocus={(e) => e.currentTarget.select()} />}
      {link.kind === 'failed' && (
        <p className={site.error} role="alert">
          The link could not be made.
        </p>
      )}
      <div className={site.actions}>
        {link.kind === 'made' ? (
          <button type="button" className={site.btn} onClick={() => void copy(link.url)}>
            {link.copied ? 'Copied' : 'Copy link'}
          </button>
        ) : (
          <button type="button" className={site.btn} disabled={link.kind === 'making'} onClick={make}>
            {link.kind === 'making' ? 'Making the link' : 'Make a link'}
          </button>
        )}
      </div>
    </>
  )
}

type Removal = { readonly kind: 'asking' } | { readonly kind: 'removing' } | { readonly kind: 'failed'; readonly message: string }

/** Asks before a circle is deleted (its people stay saved), then leaves for the circles list. */
function RemoveCircle({ circle, close }: { readonly circle: CircleRef; readonly close: () => void }) {
  const router = useRouter()
  const hrefs = useAppHrefs()
  const { deleteGroup } = useGroups()
  const [removal, setRemoval] = useState<Removal>({ kind: 'asking' })
  const remove = () => {
    setRemoval({ kind: 'removing' })
    deleteGroup(circle.id).then(
      () => {
        close()
        router.push(hrefs.groups)
      },
      (err: unknown) => setRemoval({ kind: 'failed', message: err instanceof Error ? err.message : 'The circle could not be deleted.' }),
    )
  }
  return (
    <>
      <p>The circle is deleted. Its people stay saved, each with their own map.</p>
      {removal.kind === 'failed' && (
        <p className={site.error} role="alert">
          {removal.message}
        </p>
      )}
      <div className={site.actions}>
        <button type="button" className={site.btn} data-tone="danger" disabled={removal.kind === 'removing'} onClick={remove}>
          {removal.kind === 'removing' ? 'Deleting' : 'Delete circle'}
        </button>
        <button type="button" className={site.btn} onClick={close}>
          Keep it
        </button>
      </div>
    </>
  )
}

/** A saved circle's own actions (BENTO_V2.md "The app in v2", "Flows"): sharing it as a link, and deleting it, asked first. */
export function CircleActions({ circle }: { readonly circle: CircleRef }) {
  return (
    <div className={site.actions}>
      <DialogButton label="Share" title={`Share ${circle.name}`}>
        {() => <ShareCircle circle={circle} />}
      </DialogButton>
      <DialogButton label="Delete" title={`Delete ${circle.name}?`}>
        {(close) => <RemoveCircle circle={circle} close={close} />}
      </DialogButton>
    </div>
  )
}
