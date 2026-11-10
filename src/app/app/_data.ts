import { cache } from 'react'
import { ownedPeople } from '@/lib/atlas/app/owned'

/** The account's people, read once per request: the shell's count and the dashboard share it. Ownership is the repository's. */
export const peopleOnce = cache(ownedPeople)
