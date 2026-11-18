'use client'

import { useState, type FormEvent } from 'react'
import { track } from '@/lib/analytics/posthog'
import { ErrorState, Field, Loading, PrimaryAction, site } from '../site'
import d from './docs.module.css'

/** The live contact endpoint (src/app/api/contact/route.ts); it validates and rate-limits. */
const CONTACT_ENDPOINT = '/api/contact'

type Status =
  | { readonly kind: 'idle' }
  | { readonly kind: 'sending' }
  | { readonly kind: 'sent'; readonly name: string }
  | { readonly kind: 'failed'; readonly message: string }

const FALLBACK_ERROR = 'Sending failed. Email us instead.'

const readError = async (response: Response): Promise<string> => {
  try {
    const body: unknown = await response.json()
    return typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
      ? body.error
      : FALLBACK_ERROR
  } catch {
    return FALLBACK_ERROR
  }
}

/** Sends name, email and message as the endpoint's schema reads them. */
async function sendMessage(fields: { name: string; email: string; message: string }): Promise<Status> {
  try {
    const response = await fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    return response.ok ? { kind: 'sent', name: fields.name } : { kind: 'failed', message: await readError(response) }
  } catch {
    return { kind: 'failed', message: FALLBACK_ERROR }
  }
}

const fieldValue = (form: HTMLFormElement, name: string): string => {
  const value = new FormData(form).get(name)
  return typeof value === 'string' ? value.trim() : ''
}

export function ContactForm({ fallbackAddress }: { readonly fallbackAddress: string }) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    setStatus({ kind: 'sending' })
    const next = await sendMessage({
      name: fieldValue(form, 'name'),
      email: fieldValue(form, 'email'),
      message: fieldValue(form, 'message'),
    })
    setStatus(next)
    if (next.kind === 'sent') {
      track('lead_submitted', { channel: 'contact_form', placement: 'contact_page' })
      form.reset()
    }
  }

  if (status.kind === 'sent') {
    return (
      <div className={site.state} role="status">
        <h3 className={site.h3}>{`Thanks, ${status.name}. Your message is with us.`}</h3>
        <p className={site.body}>We reply within two business days, to the email you gave.</p>
        <button type="button" className={`${site.btn} ${site.btnSmall}`} onClick={() => setStatus({ kind: 'idle' })}>
          Write another message
        </button>
      </div>
    )
  }

  const sending = status.kind === 'sending'
  return (
    <form className={d.form} onSubmit={submit} aria-busy={sending}>
      <div className={d.formRow}>
        <Field id="contact-name" name="name" label="Name" autoComplete="name" required disabled={sending} />
        <Field id="contact-email" name="email" label="Email" type="email" autoComplete="email" required disabled={sending} />
      </div>
      <div className={site.field}>
        <label htmlFor="contact-message" className={site.label}>
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          disabled={sending}
          className={`${site.input} ${d.textarea}`}
          aria-describedby="contact-message-hint"
        />
        <span id="contact-message-hint" className={site.hint}>
          For a purchase or refund, add the store and the date you paid.
        </span>
      </div>
      {status.kind === 'failed' && (
        <ErrorState
          title="The message did not send"
          action={
            <p className={site.body}>
              Or write to{' '}
              <a href={`mailto:${fallbackAddress}`} className={site.textLink}>
                {fallbackAddress}
              </a>
            </p>
          }
        >
          {status.message}
        </ErrorState>
      )}
      <div className={site.actions}>
        <PrimaryAction type="submit" intent="send" disabled={sending}>
          Send message
        </PrimaryAction>
        {sending && (
          <Loading label="Sending your message">
            <span className={site.hint}>Sending your message</span>
          </Loading>
        )}
      </div>
    </form>
  )
}
