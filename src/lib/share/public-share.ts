import type {
  FullGroupAnalysis,
  GroupMemberAnalysis,
} from '@/lib/services/group-analysis'
import type { ShareOptions } from '@/lib/types/relationship'

/**
 * Public share projections — the ONLY shapes the anonymous /share/[token]
 * surface is allowed to receive. Everything here is derived analysis; raw
 * tenant internals (owner_id, password_hash, member birth data) are stripped
 * server-side before serialization.
 */

/** Group member as exposed to anonymous share viewers — no birth data. */
export type PublicGroupMemberAnalysis = Omit<
  GroupMemberAnalysis,
  'birthDate' | 'birthTime' | 'birthPlace'
>

/** Group analysis as exposed to anonymous share viewers. */
export type PublicGroupAnalysis = Omit<FullGroupAnalysis, 'members'> & {
  members: PublicGroupMemberAnalysis[]
}

/** Successful response body of GET/POST /api/share/[token]. */
export interface PublicShareResponse {
  share: {
    share_type: 'person' | 'relationship' | 'group' | 'graph'
    options: ShareOptions
  }
  group?: PublicGroupAnalysis
}

/**
 * Strips per-member birth data (birthDate / birthTime / birthPlace) from a
 * group analysis before it crosses the trust boundary. The share page only
 * renders names + derived Dreamspell/Tzolkin values, so the raw PII never
 * needs to leave the server.
 */
export function toPublicGroupAnalysis(
  analysis: FullGroupAnalysis
): PublicGroupAnalysis {
  return {
    ...analysis,
    members: analysis.members.map((member) => {
      const {
        birthDate: _birthDate,
        birthTime: _birthTime,
        birthPlace: _birthPlace,
        ...safe
      } = member
      return safe
    }),
  }
}

// Share token + password hashing moved to src/lib/share/share-token.ts —
// re-exported here for existing importers.
export { hashSharePassword } from './share-token'
