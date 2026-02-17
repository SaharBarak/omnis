'use client'

import { createClient } from '@/lib/supabase/client'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { calculateOracle } from '@/lib/calculations/oracle'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'
import type { ComputedResultsForPerson } from '@/lib/hooks/use-computed-results'

const supabase = createClient()

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function getPeople() {
  const user = await getCurrentUser()
  if (!user) return []
  const { data } = await supabase
    .from('people')
    .select('*')
    .is('deleted_at', null)
    .order('name')
  return data || []
}

async function findPerson(name: string) {
  const people = await getPeople()
  const lower = name.toLowerCase()
  return people.find(p =>
    p.name.toLowerCase() === lower ||
    p.name.toLowerCase().includes(lower) ||
    (p.hebrew_name && p.hebrew_name.includes(name))
  )
}

async function getComputedResults(personId: string): Promise<ComputedResultsForPerson> {
  const { data } = await supabase
    .from('computed_results')
    .select('*')
    .eq('person_id', personId)

  const results: ComputedResultsForPerson = {
    dreamspell: null, tzolkin: null, longcount: null,
    astrology: null, humandesign: null, gematria: null,
  }

  for (const row of data || []) {
    const key = row.system_type as keyof ComputedResultsForPerson
    if (key in results) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results[key] = row.result_data as any
    }
  }
  return results
}

async function getSelfPerson() {
  const { data } = await supabase
    .from('people')
    .select('*')
    .eq('is_self', true)
    .is('deleted_at', null)
    .limit(1)
    .single()
  return data
}

// ANSI color helpers for styled terminal output
const C = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  magenta: (s: string) => `\x1b[35m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  white: (s: string) => `\x1b[37m${s}\x1b[0m`,
}

const HELP_TEXT = `
${C.cyan('+===========================================+')}
${C.cyan('|')}   ${C.bold(C.green('OMNIS TERMINAL'))} ${C.dim('- Cosmic CLI v1.0')}    ${C.cyan('|')}
${C.cyan('+===========================================+')}

${C.yellow('COMMANDS:')}

  ${C.green('whoami')}                    Your cosmic identity
  ${C.green('kin')} ${C.dim('<name>')}               Dreamspell kin lookup
  ${C.green('chart')} ${C.dim('<name>')}             Natal chart summary
  ${C.green('hd')} ${C.dim('<name>')}                Human Design profile
  ${C.green('today')}                     Today's kin & energy
  ${C.green('compare')} ${C.dim('<name1> <name2>')}  Compatibility check
  ${C.green('people')}                    List saved people
  ${C.green('ascii')} ${C.dim('<name>')}             Oracle cross ASCII art
  ${C.green('help')}                      This message
  ${C.green('clear')}                     Clear terminal

${C.dim('Tip: Names are fuzzy-matched against your saved people.')}
`

async function cmdWhoami(): Promise<string> {
  const self = await getSelfPerson()
  if (!self) return C.red('No self profile found. Add yourself in People first.')

  const results = await getComputedResults(self.id)
  const ds = results.dreamspell
  const hd = results.humandesign
  const astro = results.astrology

  const lines = [
    C.cyan('+--- WHO AM I ---+'),
    `  ${C.bold(self.name)}${self.hebrew_name ? ` (${self.hebrew_name})` : ''}`,
    '',
  ]

  if (ds) {
    lines.push(`  ${C.yellow('Dreamspell:')} Kin ${ds.kin} - ${C.green(`${ds.toneData.name} ${ds.sealData.english}`)}`)
  }
  if (astro) {
    lines.push(`  ${C.yellow('Sun Sign:')}   ${C.green(astro.sunSign)}${astro.moonSign ? ` | Moon: ${astro.moonSign}` : ''}${astro.risingSign ? ` | Rising: ${astro.risingSign}` : ''}`)
  }
  if (hd) {
    lines.push(`  ${C.yellow('HD Type:')}    ${C.green(hd.type)}${hd.profile ? ` | Profile: ${hd.profile}` : ''}`)
    lines.push(`  ${C.yellow('Authority:')}  ${hd.authority}`)
    lines.push(`  ${C.yellow('Strategy:')}   ${hd.strategy}`)
  }

  lines.push(C.cyan('+----------------+'))
  return lines.join('\n')
}

async function cmdKin(name: string): Promise<string> {
  if (!name) return C.red('Usage: kin <name>')
  const person = await findPerson(name)
  if (!person) return C.red(`Person "${name}" not found. Try 'people' to see saved names.`)

  const results = await getComputedResults(person.id)
  const ds = results.dreamspell
  if (!ds) return C.red(`No Dreamspell data for ${person.name}.`)

  const oracle = ds.oracle
  const guideSeal = getSeal(oracle.guide)
  const analogSeal = getSeal(oracle.analog)
  const antipodeSeal = getSeal(oracle.antipode)
  const occultSeal = getSeal(oracle.occult)

  return [
    '',
    `  ${C.bold(C.cyan(person.name))} - Kin ${C.bold(String(ds.kin))}`,
    `  ${C.green(`${ds.toneData.name} ${ds.sealData.english}`)} (${ds.sealData.mayan})`,
    '',
    `  ${C.yellow('Tone:')}  ${ds.toneData.name} (${ds.tone}) - ${ds.toneData.keywords.join(', ')}`,
    `  ${C.yellow('Seal:')}  ${ds.sealData.english} (${ds.seal}) - ${ds.sealData.color}`,
    '',
    `  ${C.dim('Oracle Cross:')}`,
    `    Guide:    ${guideSeal.english}`,
    `    Analog:   ${analogSeal.english}`,
    `    Antipode: ${antipodeSeal.english}`,
    `    Occult:   ${occultSeal.english}`,
    '',
  ].join('\n')
}

async function cmdChart(name: string): Promise<string> {
  if (!name) return C.red('Usage: chart <name>')
  const person = await findPerson(name)
  if (!person) return C.red(`Person "${name}" not found.`)

  const results = await getComputedResults(person.id)
  const astro = results.astrology
  if (!astro) return C.red(`No astrology data for ${person.name}.`)

  const lines = [
    '',
    `  ${C.bold(C.cyan(person.name))} - Natal Chart`,
    '',
    `  ${C.yellow('Sun:')}     ${C.green(astro.sunSign)}${astro.summary?.sunSignHebrew ? ` (${astro.summary.sunSignHebrew})` : ''}`,
  ]

  if (astro.moonSign) {
    lines.push(`  ${C.yellow('Moon:')}    ${C.green(astro.moonSign)}${astro.summary?.moonSignHebrew ? ` (${astro.summary.moonSignHebrew})` : ''}`)
  }
  if (astro.risingSign) {
    lines.push(`  ${C.yellow('Rising:')}  ${C.green(astro.risingSign)}${astro.summary?.risingSignHebrew ? ` (${astro.summary.risingSignHebrew})` : ''}`)
  }
  if (astro.summary) {
    lines.push('')
    lines.push(`  ${C.yellow('Element:')}   ${astro.summary.dominantElement}`)
    lines.push(`  ${C.yellow('Modality:')}  ${astro.summary.dominantModality}`)
  }

  if (!astro.hasBirthTime) {
    lines.push('')
    lines.push(`  ${C.dim('Warning: Birth time unknown - Moon/Rising may be inaccurate')}`)
  }

  lines.push('')
  return lines.join('\n')
}

async function cmdHd(name: string): Promise<string> {
  if (!name) return C.red('Usage: hd <name>')
  const person = await findPerson(name)
  if (!person) return C.red(`Person "${name}" not found.`)

  const results = await getComputedResults(person.id)
  const hd = results.humandesign
  if (!hd) return C.red(`No Human Design data for ${person.name}.`)

  const lines = [
    '',
    `  ${C.bold(C.cyan(person.name))} - Human Design`,
    '',
    `  ${C.yellow('Type:')}       ${C.green(hd.type)}${hd.typeHebrew ? ` (${hd.typeHebrew})` : ''}`,
    `  ${C.yellow('Strategy:')}   ${hd.strategy}${hd.strategyHebrew ? ` (${hd.strategyHebrew})` : ''}`,
    `  ${C.yellow('Authority:')}  ${hd.authority}${hd.authorityHebrew ? ` (${hd.authorityHebrew})` : ''}`,
  ]

  if (hd.profile) {
    lines.push(`  ${C.yellow('Profile:')}    ${hd.profile}${hd.profileHebrew ? ` (${hd.profileHebrew})` : ''}`)
  }

  lines.push('')
  lines.push(`  ${C.dim('Defined Centers:')}  ${hd.definedCenters.join(', ') || 'none'}`)
  lines.push(`  ${C.dim('Open Centers:')}    ${hd.undefinedCenters.join(', ') || 'none'}`)

  if (!hd.hasBirthTime) {
    lines.push('')
    lines.push(`  ${C.dim('Warning: Birth time unknown - results are approximate')}`)
  }

  lines.push('')
  return lines.join('\n')
}

async function cmdToday(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10)
  const kin = dateToKin(today)
  const seal = getSeal(kinToSeal(kin))
  const tone = getTone(kinToTone(kin))
  const oracle = calculateOracle(kin)

  const guideSeal = getSeal(oracle.guide)
  const analogSeal = getSeal(oracle.analog)
  const antipodeSeal = getSeal(oracle.antipode)
  const occultSeal = getSeal(oracle.occult)

  return [
    '',
    `  ${C.bold(C.cyan("TODAY'S ENERGY"))} - ${today}`,
    '',
    `  ${C.yellow('Kin')} ${C.bold(String(kin))}: ${C.green(`${tone.name} ${seal.english}`)}`,
    `  ${C.dim(seal.mayan)} | ${seal.hebrew} | ${seal.color}`,
    '',
    `  ${C.yellow('Tone')} ${tone.number}: ${tone.name} - ${tone.keywords.join(', ')}`,
    '',
    `  ${C.dim('Oracle Cross:')}`,
    `    ${C.yellow('Guide:')}    ${guideSeal.english} (${guideSeal.mayan})`,
    `    ${C.yellow('Analog:')}   ${analogSeal.english} (${analogSeal.mayan})`,
    `    ${C.yellow('Antipode:')} ${antipodeSeal.english} (${antipodeSeal.mayan})`,
    `    ${C.yellow('Occult:')}   ${occultSeal.english} (${occultSeal.mayan})`,
    '',
  ].join('\n')
}

async function cmdPeople(): Promise<string> {
  const people = await getPeople()
  if (people.length === 0) return C.dim('No people saved yet. Add some in the app.')

  const lines = [
    '',
    `  ${C.bold(C.cyan('SAVED PEOPLE'))} (${people.length})`,
    '',
  ]

  for (const p of people) {
    const selfBadge = p.is_self ? C.yellow(' *') : ''
    lines.push(`  ${C.green('>')} ${p.name}${p.hebrew_name ? ` (${p.hebrew_name})` : ''}${selfBadge} ${C.dim(`- ${p.birth_date}`)}`)
  }

  lines.push('')
  return lines.join('\n')
}

async function cmdCompare(args: string): Promise<string> {
  const parts = args.trim().split(/\s+/)
  if (parts.length < 2) return C.red('Usage: compare <name1> <name2>')

  const person1 = await findPerson(parts[0])
  const person2 = await findPerson(parts.slice(1).join(' '))
  if (!person1) return C.red(`Person "${parts[0]}" not found.`)
  if (!person2) return C.red(`Person "${parts.slice(1).join(' ')}" not found.`)

  const r1 = await getComputedResults(person1.id)
  const r2 = await getComputedResults(person2.id)

  const lines = [
    '',
    `  ${C.bold(C.cyan('COMPATIBILITY'))}`,
    `  ${C.green(person1.name)} x ${C.green(person2.name)}`,
    '',
  ]

  if (r1.dreamspell && r2.dreamspell) {
    lines.push(`  ${C.yellow('Dreamspell:')}`)
    lines.push(`    ${person1.name}: Kin ${r1.dreamspell.kin} - ${r1.dreamspell.toneData.name} ${r1.dreamspell.sealData.english}`)
    lines.push(`    ${person2.name}: Kin ${r2.dreamspell.kin} - ${r2.dreamspell.toneData.name} ${r2.dreamspell.sealData.english}`)

    const seal1 = r1.dreamspell.seal
    const seal2 = r2.dreamspell.seal
    const oracle1 = r1.dreamspell.oracle
    const oracle2 = r2.dreamspell.oracle

    const relationships: string[] = []
    if (oracle1.analog === seal2 || oracle2.analog === seal1) relationships.push('Analog (support)')
    if (oracle1.antipode === seal2 || oracle2.antipode === seal1) relationships.push('Antipode (challenge)')
    if (oracle1.occult === seal2 || oracle2.occult === seal1) relationships.push('Occult (hidden power)')
    if (oracle1.guide === seal2 || oracle2.guide === seal1) relationships.push('Guide')

    if (relationships.length > 0) {
      lines.push(`    ${C.magenta('Connections:')} ${relationships.join(', ')}`)
    } else {
      lines.push(`    ${C.dim('No direct oracle connections')}`)
    }
  }

  if (r1.astrology && r2.astrology) {
    lines.push('')
    lines.push(`  ${C.yellow('Astrology:')}`)
    lines.push(`    ${person1.name}: Sun ${r1.astrology.sunSign}${r1.astrology.moonSign ? ` | Moon ${r1.astrology.moonSign}` : ''}`)
    lines.push(`    ${person2.name}: Sun ${r2.astrology.sunSign}${r2.astrology.moonSign ? ` | Moon ${r2.astrology.moonSign}` : ''}`)
  }

  if (r1.humandesign && r2.humandesign) {
    lines.push('')
    lines.push(`  ${C.yellow('Human Design:')}`)
    lines.push(`    ${person1.name}: ${r1.humandesign.type}${r1.humandesign.profile ? ` (${r1.humandesign.profile})` : ''}`)
    lines.push(`    ${person2.name}: ${r2.humandesign.type}${r2.humandesign.profile ? ` (${r2.humandesign.profile})` : ''}`)
  }

  lines.push('')
  return lines.join('\n')
}

async function cmdAscii(name: string): Promise<string> {
  if (!name) return C.red('Usage: ascii <name>')
  const person = await findPerson(name)
  if (!person) return C.red(`Person "${name}" not found.`)

  const results = await getComputedResults(person.id)
  const ds = results.dreamspell
  if (!ds) return C.red(`No Dreamspell data for ${person.name}.`)

  const seal = ds.sealData.english
  const guide = getSeal(ds.oracle.guide).english
  const analog = getSeal(ds.oracle.analog).english
  const antipode = getSeal(ds.oracle.antipode).english
  const occult = getSeal(ds.oracle.occult).english

  const pad = (s: string, len: number) => s.padStart(Math.floor((len + s.length) / 2)).padEnd(len)

  return [
    '',
    C.cyan(`  ${person.name} - Oracle Cross`),
    '',
    C.dim('                +------------------+'),
    C.dim('                |') + C.yellow(pad(guide, 18)) + C.dim('|'),
    C.dim('                |') + C.dim(pad('GUIDE', 18)) + C.dim('|'),
    C.dim('  +-------------+------------------+-------------+'),
    C.dim('  |') + C.magenta(pad(analog, 13)) + C.dim('|') + C.green(pad(seal, 18)) + C.dim('|') + C.red(pad(antipode, 13)) + C.dim('|'),
    C.dim('  |') + C.dim(pad('ANALOG', 13)) + C.dim('|') + C.dim(pad(`KIN ${ds.kin}`, 18)) + C.dim('|') + C.dim(pad('ANTIPODE', 13)) + C.dim('|'),
    C.dim('  +-------------+------------------+-------------+'),
    C.dim('                |') + C.cyan(pad(occult, 18)) + C.dim('|'),
    C.dim('                |') + C.dim(pad('OCCULT', 18)) + C.dim('|'),
    C.dim('                +------------------+'),
    '',
  ].join('\n')
}

export async function executeCommand(input: string): Promise<string> {
  const trimmed = input.trim()
  if (!trimmed) return ''

  const [cmd, ...rest] = trimmed.split(/\s+/)
  const args = rest.join(' ')

  switch (cmd.toLowerCase()) {
    case 'help':
      return HELP_TEXT
    case 'whoami':
      return cmdWhoami()
    case 'kin':
      return cmdKin(args)
    case 'chart':
      return cmdChart(args)
    case 'hd':
      return cmdHd(args)
    case 'today':
      return cmdToday()
    case 'people':
      return cmdPeople()
    case 'compare':
      return cmdCompare(args)
    case 'ascii':
      return cmdAscii(args)
    case 'clear':
      return '__CLEAR__'
    default:
      return C.red(`Unknown command: ${cmd}. Type 'help' for available commands.`)
  }
}
