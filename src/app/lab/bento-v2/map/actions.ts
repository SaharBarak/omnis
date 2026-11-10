'use server'

import { redirect } from 'next/navigation'
import { inputFromForm, newNonce } from '@/lib/atlas/app/sketch'
import { getSession } from '@/lib/auth-server'
import { loginHref } from '@/lib/auth/gates'
import { AUTH_MODE_PARAM } from '@/lib/site/routes'
import { writeSketch } from '@/lib/site/v2-sketch-cookie'
import { V2_GATE } from '@/lib/site/v2-routes'

export interface KeepSketchState {
  readonly error: string | null
}

/**
 * "Keep this map" (BENTO_V2.md "The hand-off"): parse the map with the form's
 * schema, hold it in this browser's sketch cookie under the account keeping
 * it (none when signed out), then go to the dashboard that offers it, by way
 * of sign-up when signed out. Nothing is stored on the server.
 */
export async function keepSketch(_prev: KeepSketchState, formData: FormData): Promise<KeepSketchState> {
  const input = inputFromForm(formData.get('input'))
  const unreadable = { error: 'This map cannot be kept yet. Check the birth date above.' }
  if (!input) return unreadable
  const session = await getSession()
  if (!(await writeSketch({ nonce: newNonce(), owner: session?.user.id ?? null, input }))) return unreadable
  redirect(session ? V2_GATE.home : loginHref(V2_GATE.prefix, V2_GATE.home, { [AUTH_MODE_PARAM]: 'signup' }))
}
