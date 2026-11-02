'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Field, PrimaryAction, site } from '../site'
import d from './docs.module.css'
import { parseBirthInput } from '@/lib/atlas/birth-input'
import { encodePeople, SHARE_PARAM } from '@/lib/atlas/share'
import { siteHref } from '@/lib/site/routes'

/** T6 side card: a birth date opens the map tool with that date already drawn. */
export function TryDateCard() {
  const router = useRouter()
  const [date, setDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = parseBirthInput({ date })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Use YYYY-MM-DD')
      return
    }
    const code = encodePeople([{ id: 'you', input: parsed.data }])
    router.push(`${siteHref('/map')}?${SHARE_PARAM}=${code}`)
  }

  return (
    <form className={`${site.card} ${d.tryCard}`} onSubmit={submit} noValidate aria-labelledby="try-date-title">
      <h2 id="try-date-title" className={site.h3}>
        Try it on your own date
      </h2>
      <p className={site.body}>
        Type a birth date to open the map with it drawn. Add a time and place there for the bodygraph and the rising
        sign.
      </p>
      <Field
        id="try-date"
        label="Your date"
        type="date"
        hint="YYYY-MM-DD"
        value={date}
        required
        error={error}
        onChange={(event) => {
          setDate(event.target.value)
          setError(null)
        }}
      />
      <PrimaryAction type="submit">Open my map</PrimaryAction>
    </form>
  )
}
