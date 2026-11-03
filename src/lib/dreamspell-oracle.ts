/**
 * The five seats of the Dreamspell oracle, held once: the learn page's oracle
 * section and the atlas cards (docs/redesign/BENTO_SITE.md, "Marks explain
 * themselves") both read this table.
 */

export type OracleRoleId = 'destiny' | 'guide' | 'analog' | 'antipode' | 'occult'

export interface OracleRole {
  readonly id: OracleRoleId
  /** The seat's name on the learn page. */
  readonly name: string
  /** The seat named on a person's map and in the readout. */
  readonly label: string
  readonly color: string
  readonly description: string
  readonly calculation: string
}

export const ORACLE_ROLES: readonly OracleRole[] = Object.freeze([
  {
    id: 'destiny',
    name: 'Destiny (Center)',
    label: 'Your seal',
    color: '#F59E0B',
    description: 'Your core Kin, the central theme of your energy. This is your Galactic Signature.',
    calculation: 'Your birth date Kin',
  },
  {
    id: 'guide',
    name: 'Guide',
    label: 'Guide',
    color: '#10B981',
    description: 'The higher wisdom that leads you. Based on your Tone, this Seal of the same color guides your path.',
    calculation: 'Same color family, determined by Tone',
  },
  {
    id: 'analog',
    name: 'Analog (Support)',
    label: 'Analog',
    color: '#3B82F6',
    description: 'Your support energy, a complementary partner that adds up to 19 with your Seal number.',
    calculation: 'Seal number that + your Seal = 19',
  },
  {
    id: 'antipode',
    name: 'Antipode (Challenge)',
    label: 'Antipode',
    color: '#EF4444',
    description: 'Your challenge and gift, the energy that stretches you. Located 10 Seals away.',
    calculation: 'Your Seal + 10 (or -10 if over 20)',
  },
  {
    id: 'occult',
    name: 'Occult (Hidden Power)',
    label: 'Occult',
    color: '#8B5CF6',
    description: 'Hidden, magical power that emerges from the shadows. The Seal that + yours = 21.',
    calculation: 'Seal number that + your Seal = 21',
  },
])

const BY_ID: ReadonlyMap<OracleRoleId, OracleRole> = new Map(ORACLE_ROLES.map((role) => [role.id, role]))

export const oracleRole = (id: OracleRoleId): OracleRole => BY_ID.get(id) as OracleRole
