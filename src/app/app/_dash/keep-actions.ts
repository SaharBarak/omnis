'use server'

import { revalidatePath } from 'next/cache'
import { TEXT_MAX } from '@/lib/atlas/birth-input'
import { ownedPeople } from '@/lib/atlas/app/owned'
import { personInsertOf, profileBirthOf } from '@/lib/atlas/app/saved-person'
import { inputFromForm, sketchFor, type Sketch } from '@/lib/atlas/app/sketch'
import type { BirthInput } from '@/lib/atlas/types'
import { getSession, type SessionUser } from '@/lib/auth-server'
import { createPersonWithinPlan } from '@/lib/services/people'
import { updateOwnProfile } from '@/lib/services/profile'
import { clearSketch, readSketch } from '@/lib/site/v2-sketch-cookie'
import { V2_GATE } from '@/lib/site/v2-routes'

/**
 * The dashboard's map actions (docs/redesign/BENTO_V2.md "The hand-off",
 * "Changing it later"). Each reads the session and parses its input again;
 * the keep actions also hold the cookie's owner and nonce, so a tab showing
 * an older map never consumes a newer one, and clear the cookie only after
 * their write succeeds.
 */

export interface MapActionState {
  readonly error: string | null
}

type Checked<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: string }

const fail = (error: string): Checked<never> => ({ ok: false, error })

const FIELDS = 'This map cannot be saved. Check the birth date above.'
const SIGNED_OUT = 'Your session ended. Sign in again to save this map.'
const STALE = 'A newer map was kept in another tab. Reload to see it.'
const FAILED = 'The map could not be saved. Try again.'

interface Signed {
  readonly user: SessionUser
  readonly input: BirthInput
}

async function signed(formData: FormData): Promise<Checked<Signed>> {
  const session = await getSession()
  if (!session) return fail(SIGNED_OUT)
  const input = inputFromForm(formData.get('input'))
  return input ? { ok: true, value: { user: session.user, input } } : fail(FIELDS)
}

/** The kept map this form was drawn from: this account's, with the form's nonce. */
async function offered(user: SessionUser, formData: FormData): Promise<Checked<Sketch>> {
  const sketch = sketchFor(await readSketch(), user.id)
  return sketch && sketch.nonce === formData.get('nonce') ? { ok: true, value: sketch } : fail(STALE)
}

/** Runs a write, then refreshes the dashboard; a throw becomes the form's error and keeps everything as it was. */
async function commit(write: () => Promise<string | null>, after: () => Promise<void> = async () => {}): Promise<MapActionState> {
  try {
    const refused = await write()
    if (refused) return { error: refused }
    await after()
  } catch (error) {
    console.error('v2 map action failed:', error)
    return { error: FAILED }
  }
  revalidatePath(V2_GATE.home)
  return { error: null }
}

const asYou = (user: SessionUser, input: BirthInput) => async () => {
  await updateOwnProfile(user, { ...profileBirthOf(input), onboarding_completed: true })
  return null
}

/** What a keep card's button asks for; the server holds each to its own rule. */
export type KeepIntent = 'as-you' | 'replace' | 'person' | 'discard'

const isIntent = (value: FormDataEntryValue | null): value is KeepIntent =>
  value === 'as-you' || value === 'replace' || value === 'person' || value === 'discard'

const HAS_MAP = 'This account already has its own map. Add this one as a person, or replace yours.'

/**
 * The keep card's one action, dispatched by the pressed button's `intent`, so
 * the card shows the outcome of the last press only. "Keep as you" is refused
 * once the account has its own map (a tab drawn before it had one cannot
 * overwrite it); "Replace your map" is that overwrite, asked for; "Add as a
 * person" saves one more person within the plan; "Discard" drops the map this
 * card shows, never a newer one.
 */
export async function keepOffer(_prev: MapActionState, formData: FormData): Promise<MapActionState> {
  const intent = formData.get('intent')
  if (!isIntent(intent)) return { error: FAILED }
  const session = await getSession()
  if (!session) return { error: SIGNED_OUT }
  const sketch = await offered(session.user, formData)
  if (!sketch.ok) return { error: sketch.error }
  if (intent === 'discard') return commit(async () => null, clearSketch)

  const form = await signed(formData)
  if (!form.ok) return { error: form.error }
  const { user, input } = form.value

  if (intent === 'person') {
    const name = String(formData.get('name') ?? '').trim()
    if (name === '' || name.length > TEXT_MAX.name) return { error: 'Give this person a name to save them.' }
    return commit(async () => {
      const { hebrew_name, birth_date, birth_time, birth_place } = personInsertOf({ ...input, name })
      const created = await createPersonWithinPlan(user.id, { name, hebrew_name, birth_date, birth_time, birth_place })
      return created.ok ? null : created.message
    }, clearSketch)
  }

  return commit(async () => {
    if (intent === 'as-you' && (await ownedPeople(user.id)).some((person) => person.is_self)) return HAS_MAP
    return asYou(user, input)()
  }, clearSketch)
}

/** "Change your map": the account's own map, rewritten through the profile. */
export async function changeYourMap(_prev: MapActionState, formData: FormData): Promise<MapActionState> {
  const form = await signed(formData)
  if (!form.ok) return { error: form.error }
  return commit(asYou(form.value.user, form.value.input))
}

/** Signing out forgets any kept map, so the next account on this browser is never offered it. */
export async function forgetSketch(): Promise<void> {
  await clearSketch()
}
