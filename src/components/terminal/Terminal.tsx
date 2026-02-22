'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { executeCommand } from './command-interpreter'
import {
  fetchPeople,
  fetchComputedResults,
  fetchTodayData,
  fetchSelfPerson,
  type PersonRecord,
  type TodayData,
} from './tui-data'

// ─── Types ──────────────────────────────────────────────────────────────

type ViewId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

interface StyledSpan {
  text: string
  className: string
}

interface TerminalLine {
  type: 'input' | 'output'
  content: string
}

// ─── ANSI parser ────────────────────────────────────────────────────────

function parseAnsi(text: string): StyledSpan[] {
  const spans: StyledSpan[] = []
  const regex = /\x1b\[(\d+)m/g
  let lastIndex = 0
  let currentClasses: string[] = []

  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      spans.push({ text: text.slice(lastIndex, match.index), className: currentClasses.join(' ') })
    }
    const code = parseInt(match[1])
    switch (code) {
      case 0: currentClasses = []; break
      case 1: currentClasses.push('font-bold'); break
      case 2: currentClasses.push('opacity-50'); break
      case 31: currentClasses = currentClasses.filter(c => !c.startsWith('text-')); currentClasses.push('text-red-400'); break
      case 32: currentClasses = currentClasses.filter(c => !c.startsWith('text-')); currentClasses.push('text-green-400'); break
      case 33: currentClasses = currentClasses.filter(c => !c.startsWith('text-')); currentClasses.push('text-yellow-400'); break
      case 34: currentClasses = currentClasses.filter(c => !c.startsWith('text-')); currentClasses.push('text-blue-400'); break
      case 35: currentClasses = currentClasses.filter(c => !c.startsWith('text-')); currentClasses.push('text-purple-400'); break
      case 36: currentClasses = currentClasses.filter(c => !c.startsWith('text-')); currentClasses.push('text-cyan-400'); break
      case 37: currentClasses = currentClasses.filter(c => !c.startsWith('text-')); currentClasses.push('text-gray-200'); break
    }
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    spans.push({ text: text.slice(lastIndex), className: currentClasses.join(' ') })
  }
  return spans
}

function AnsiLine({ text }: { text: string }) {
  const spans = parseAnsi(text)
  return (
    <div className="leading-snug whitespace-pre">
      {spans.map((span, i) => (
        <span key={i} className={span.className}>{span.text}</span>
      ))}
    </div>
  )
}

// ─── Box Drawing Helpers ────────────────────────────────────────────────

const BOX = {
  tl: '┌', tr: '┐', bl: '└', br: '┘',
  h: '─', v: '│',
  lt: '├', rt: '┤', tt: '┬', bt: '┴', x: '┼',
}

function boxLine(left: string, fill: string, right: string, width: number): string {
  return left + fill.repeat(width - 2) + right
}

function boxText(text: string, width: number, align: 'left' | 'center' | 'right' = 'left'): string {
  const stripped = stripAnsi(text)
  const pad = width - 2 - stripped.length
  if (pad < 0) return BOX.v + text.slice(0, width - 2) + BOX.v
  if (align === 'center') {
    const l = Math.floor(pad / 2)
    const r = pad - l
    return BOX.v + ' '.repeat(l) + text + ' '.repeat(r) + BOX.v
  }
  if (align === 'right') {
    return BOX.v + ' '.repeat(pad) + text + BOX.v
  }
  return BOX.v + text + ' '.repeat(pad) + BOX.v
}

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[\d+m/g, '')
}

// ANSI color helpers
const C = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  magenta: (s: string) => `\x1b[35m${s}\x1b[0m`,
  blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  white: (s: string) => `\x1b[37m${s}\x1b[0m`,
}

// ─── Matrix rain effect ─────────────────────────────────────────────────

const GLYPHS = 'IMIXIKAKBALKANCHICCHANCIMIMANIKLAMATMULOCCHUEBENIXMENCIBCABANCAUACAHAU'

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const columns: number[] = []
    const fontSize = 14

    function resize() {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      const colCount = Math.floor(canvas.width / fontSize)
      columns.length = 0
      for (let i = 0; i < colCount; i++) {
        columns.push(Math.random() * canvas.height / fontSize)
      }
    }

    resize()
    window.addEventListener('resize', resize)

    function draw() {
      if (!ctx || !canvas) return
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < columns.length; i++) {
        const char = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        const x = i * fontSize
        const y = columns[i] * fontSize
        const alpha = 0.1 + Math.random() * 0.15
        ctx.fillStyle = `rgba(0, 255, 100, ${alpha})`
        ctx.fillText(char, x, y)
        if (y > canvas.height && Math.random() > 0.975) columns[i] = 0
        columns[i] += 0.5
      }

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
    />
  )
}

// ─── View Labels ────────────────────────────────────────────────────────

const VIEW_LABELS: Record<ViewId, string> = {
  1: 'Dashboard',
  2: 'People',
  3: 'Person',
  4: 'Dreamspell',
  5: 'Astrology',
  6: 'Human Design',
  7: 'Tzolkin',
  8: 'Compatibility',
  0: 'Command',
}

// ─── View Renderers ─────────────────────────────────────────────────────

function renderDashboard(today: TodayData | null, people: PersonRecord[], selfResults: Record<string, unknown> | null): string[] {
  if (!today) return [C.dim('Loading today\'s data...')]
  const lines: string[] = []
  const w = 60

  lines.push(C.cyan(boxLine(BOX.tl, BOX.h, BOX.tr, w)))
  lines.push(C.cyan(boxText(C.bold(C.yellow(' ☀  TODAY\'S GALACTIC SIGNATURE')), w, 'center')))
  lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  lines.push(C.cyan(boxText('', w)))
  lines.push(C.cyan(boxText(`  Kin ${C.bold(C.green(String(today.kin)))}: ${C.bold(C.green(today.toneName + ' ' + today.sealName))}`, w)))
  lines.push(C.cyan(boxText(`  ${C.dim(today.sealMayan)} │ ${today.sealColor}`, w)))
  lines.push(C.cyan(boxText('', w)))
  lines.push(C.cyan(boxText(`  ${C.yellow('Tone')} ${today.toneNumber}: ${today.toneName}`, w)))
  lines.push(C.cyan(boxText(`  ${C.dim(today.toneKeywords)}`, w)))
  lines.push(C.cyan(boxText('', w)))
  lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  lines.push(C.cyan(boxText(C.dim(' Oracle Cross'), w)))
  lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  lines.push(C.cyan(boxText('', w)))

  const guide = today.oracleGuide
  const analog = today.oracleAnalog
  const antipode = today.oracleAntipode
  const occult = today.oracleOccult

  lines.push(C.cyan(boxText(`          ${C.yellow('▲')} ${C.yellow(guide)}`, w)))
  lines.push(C.cyan(boxText(`          ${C.dim('│')} Guide`, w)))
  lines.push(C.cyan(boxText(`  ${C.magenta(analog)} ${C.dim('◄──')} ${C.green(C.bold(today.sealName))} ${C.dim('──►')} ${C.red(antipode)}`, w)))
  lines.push(C.cyan(boxText(`  ${C.dim('Analog')}        ${C.dim('KIN ' + today.kin)}       ${C.dim('Antipode')}`, w)))
  lines.push(C.cyan(boxText(`          ${C.dim('│')} Occult`, w)))
  lines.push(C.cyan(boxText(`          ${C.cyan('▼')} ${C.cyan(occult)}`, w)))
  lines.push(C.cyan(boxText('', w)))
  lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  lines.push(C.cyan(boxText(C.dim(` Stats: ${people.length} people saved`), w)))
  lines.push(C.cyan(boxLine(BOX.bl, BOX.h, BOX.br, w)))

  if (selfResults) {
    lines.push('')
    lines.push(C.cyan(boxLine(BOX.tl, BOX.h, BOX.tr, w)))
    lines.push(C.cyan(boxText(C.bold(C.yellow(' 👤  YOUR PROFILE')), w, 'center')))
    lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ds = selfResults.dreamspell as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const astro = selfResults.astrology as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hd = selfResults.humandesign as any
    if (ds) lines.push(C.cyan(boxText(`  ${C.yellow('Kin:')} ${ds.kin} - ${C.green(ds.toneData.name + ' ' + ds.sealData.english)}`, w)))
    if (astro) lines.push(C.cyan(boxText(`  ${C.yellow('Sun:')} ${C.green(astro.sunSign)}${astro.moonSign ? ` │ Moon: ${astro.moonSign}` : ''}`, w)))
    if (hd) lines.push(C.cyan(boxText(`  ${C.yellow('HD:')}  ${C.green(hd.type)}${hd.profile ? ` │ ${hd.profile}` : ''}`, w)))
    lines.push(C.cyan(boxLine(BOX.bl, BOX.h, BOX.br, w)))
  }

  return lines
}

function renderPeopleList(people: PersonRecord[], selectedIndex: number): string[] {
  const lines: string[] = []
  const w = 64

  lines.push(C.cyan(boxLine(BOX.tl, BOX.h, BOX.tr, w)))
  lines.push(C.cyan(boxText(C.bold(C.yellow(` 👥  PEOPLE (${people.length})`)), w)))
  lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))

  const hdr = `  ${C.bold(C.white('NAME'.padEnd(20)))} ${C.bold(C.white('DATE'.padEnd(12)))} ${C.bold(C.white('NOTES'))}`
  lines.push(C.cyan(boxText(hdr, w)))
  lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))

  if (people.length === 0) {
    lines.push(C.cyan(boxText(C.dim('  No people saved yet.'), w)))
  } else {
    for (let i = 0; i < people.length; i++) {
      const p = people[i]
      const sel = i === selectedIndex
      const name = p.name.slice(0, 18).padEnd(20)
      const date = (p.birth_date || '').slice(0, 10).padEnd(12)
      const notes = p.is_self ? C.yellow('★ self') : (p.hebrew_name || '')
      const prefix = sel ? C.green('► ') : '  '
      const line = `${prefix}${sel ? C.bold(C.green(name)) : name} ${C.dim(date)} ${notes}`
      lines.push(C.cyan(boxText(line, w)))
    }
  }

  lines.push(C.cyan(boxLine(BOX.bl, BOX.h, BOX.br, w)))
  lines.push('')
  lines.push(C.dim('  ↑↓ Navigate  │  Enter: View person  │  c: Compare with selected'))

  return lines
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderPersonDetail(person: PersonRecord | null, results: any): string[] {
  if (!person) return [C.dim('Select a person from the People view [2]')]
  if (!results) return [C.dim(`Loading data for ${person.name}...`)]

  const lines: string[] = []
  const w = 64

  lines.push(C.cyan(boxLine(BOX.tl, BOX.h, BOX.tr, w)))
  lines.push(C.cyan(boxText(C.bold(C.yellow(` 🔮  ${person.name.toUpperCase()}`)) + (person.hebrew_name ? ` ${C.dim(person.hebrew_name)}` : ''), w)))
  lines.push(C.cyan(boxText(C.dim(`  Born: ${person.birth_date || 'unknown'}${person.birth_time ? ' ' + person.birth_time : ''}`), w)))
  lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))

  const ds = results.dreamspell
  if (ds) {
    lines.push(C.cyan(boxText(C.bold(C.green(' ◈ DREAMSPELL')), w)))
    lines.push(C.cyan(boxText(`  Kin ${C.bold(String(ds.kin))}: ${C.green(ds.toneData.name + ' ' + ds.sealData.english)}`, w)))
    lines.push(C.cyan(boxText(`  ${C.dim('Seal:')} ${ds.sealData.english} (${ds.sealData.mayan}) │ ${ds.sealData.color}`, w)))
    lines.push(C.cyan(boxText(`  ${C.dim('Tone:')} ${ds.toneData.name} (${ds.tone}) - ${ds.toneData.keywords.join(', ')}`, w)))

    if (ds.oracle) {
      const guideName = ds.oracle.guideName || ''
      const analogName = ds.oracle.analogName || ''
      const antipodeName = ds.oracle.antipodeName || ''
      const occultName = ds.oracle.occultName || ''
      lines.push(C.cyan(boxText('', w)))
      lines.push(C.cyan(boxText(`  ${C.dim('Guide:')} ${guideName}  ${C.dim('Analog:')} ${analogName}`, w)))
      lines.push(C.cyan(boxText(`  ${C.dim('Antipode:')} ${antipodeName}  ${C.dim('Occult:')} ${occultName}`, w)))
    }
    lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  }

  const astro = results.astrology
  if (astro) {
    lines.push(C.cyan(boxText(C.bold(C.yellow(' ✦ ASTROLOGY')), w)))
    lines.push(C.cyan(boxText(`  ${C.yellow('Sun:')}     ${C.green(astro.sunSign || '?')}`, w)))
    if (astro.moonSign) lines.push(C.cyan(boxText(`  ${C.yellow('Moon:')}    ${C.green(astro.moonSign)}`, w)))
    if (astro.risingSign) lines.push(C.cyan(boxText(`  ${C.yellow('Rising:')}  ${C.green(astro.risingSign)}`, w)))
    if (astro.summary) {
      lines.push(C.cyan(boxText(`  ${C.dim('Element:')} ${astro.summary.dominantElement}  ${C.dim('Mode:')} ${astro.summary.dominantModality}`, w)))
    }

    if (astro.planets && Array.isArray(astro.planets)) {
      lines.push(C.cyan(boxText('', w)))
      lines.push(C.cyan(boxText(C.dim('  Planet       Sign          Deg'), w)))
      lines.push(C.cyan(boxText(C.dim('  ' + '─'.repeat(36)), w)))
      for (const pl of astro.planets.slice(0, 10)) {
        const pName = (pl.name || '').padEnd(12)
        const pSign = (pl.sign || '').padEnd(14)
        const pDeg = pl.degree != null ? `${Math.floor(pl.degree)}°` : ''
        lines.push(C.cyan(boxText(`  ${C.white(pName)} ${C.green(pSign)} ${C.dim(pDeg)}`, w)))
      }
    }

    if (!astro.hasBirthTime) {
      lines.push(C.cyan(boxText(C.dim('  ⚠ No birth time - Moon/Rising approximate'), w)))
    }
    lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  }

  const hd = results.humandesign
  if (hd) {
    lines.push(C.cyan(boxText(C.bold(C.magenta(' △ HUMAN DESIGN')), w)))
    lines.push(C.cyan(boxText(`  ${C.yellow('Type:')}      ${C.green(hd.type)}${hd.typeHebrew ? ` (${hd.typeHebrew})` : ''}`, w)))
    lines.push(C.cyan(boxText(`  ${C.yellow('Strategy:')}  ${hd.strategy || '?'}`, w)))
    lines.push(C.cyan(boxText(`  ${C.yellow('Authority:')} ${hd.authority || '?'}`, w)))
    if (hd.profile) lines.push(C.cyan(boxText(`  ${C.yellow('Profile:')}   ${hd.profile}`, w)))
    if (hd.definition) lines.push(C.cyan(boxText(`  ${C.yellow('Definition:')} ${hd.definition}`, w)))
    lines.push(C.cyan(boxText('', w)))
    lines.push(C.cyan(boxText(`  ${C.dim('Defined:')}   ${(hd.definedCenters || []).join(', ') || 'none'}`, w)))
    lines.push(C.cyan(boxText(`  ${C.dim('Open:')}      ${(hd.undefinedCenters || []).join(', ') || 'none'}`, w)))
    lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  }

  const gem = results.gematria
  if (gem) {
    lines.push(C.cyan(boxText(C.bold(C.white(' # GEMATRIA')), w)))
    if (gem.standardValue != null) lines.push(C.cyan(boxText(`  ${C.yellow('Standard:')} ${gem.standardValue}`, w)))
    if (gem.ordinalValue != null) lines.push(C.cyan(boxText(`  ${C.yellow('Ordinal:')}  ${gem.ordinalValue}`, w)))
    lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  }

  lines.push(C.cyan(boxLine(BOX.bl, BOX.h, BOX.br, w)))
  return lines
}

function renderDreamspellView(today: TodayData | null): string[] {
  if (!today) return [C.dim('Loading...')]
  const lines: string[] = []
  const w = 60

  lines.push(C.cyan(boxLine(BOX.tl, BOX.h, BOX.tr, w)))
  lines.push(C.cyan(boxText(C.bold(C.yellow(' ◈  DREAMSPELL ORACLE')), w, 'center')))
  lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  lines.push(C.cyan(boxText('', w)))
  lines.push(C.cyan(boxText(`  Today: Kin ${C.bold(C.green(String(today.kin)))} - ${C.bold(C.green(today.toneName + ' ' + today.sealName))}`, w)))
  lines.push(C.cyan(boxText('', w)))
  lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  lines.push(C.cyan(boxText(C.bold(' Oracle Cross'), w, 'center')))
  lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  lines.push(C.cyan(boxText('', w)))

  // ASCII Oracle Cross
  const g = today.oracleGuide
  const a = today.oracleAnalog
  const an = today.oracleAntipode
  const o = today.oracleOccult
  const s = today.sealName

  const cw = 16
  const padC = (t: string, len: number) => {
    const stripped = stripAnsi(t)
    const total = len - stripped.length
    const left = Math.floor(total / 2)
    const right = total - left
    return ' '.repeat(Math.max(0, left)) + t + ' '.repeat(Math.max(0, right))
  }

  lines.push(C.cyan(boxText(`          ┌${'─'.repeat(cw)}┐`, w)))
  lines.push(C.cyan(boxText(`          │${padC(C.yellow(g), cw)}│`, w)))
  lines.push(C.cyan(boxText(`          │${padC(C.dim('GUIDE'), cw)}│`, w)))
  lines.push(C.cyan(boxText(`  ┌${'─'.repeat(cw)}┼${'─'.repeat(cw)}┼${'─'.repeat(cw)}┐`, w)))
  lines.push(C.cyan(boxText(`  │${padC(C.magenta(a), cw)}│${padC(C.green(C.bold(s)), cw)}│${padC(C.red(an), cw)}│`, w)))
  lines.push(C.cyan(boxText(`  │${padC(C.dim('ANALOG'), cw)}│${padC(C.dim('KIN ' + today.kin), cw)}│${padC(C.dim('ANTIPODE'), cw)}│`, w)))
  lines.push(C.cyan(boxText(`  └${'─'.repeat(cw)}┼${'─'.repeat(cw)}┼${'─'.repeat(cw)}┘`, w)))
  lines.push(C.cyan(boxText(`          │${padC(C.cyan(o), cw)}│`, w)))
  lines.push(C.cyan(boxText(`          │${padC(C.dim('OCCULT'), cw)}│`, w)))
  lines.push(C.cyan(boxText(`          └${'─'.repeat(cw)}┘`, w)))

  lines.push(C.cyan(boxText('', w)))
  lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  lines.push(C.cyan(boxText(C.bold(' Wavespell'), w, 'center')))
  lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  lines.push(C.cyan(boxText(`  ${C.dim('Wavespell of')} ${C.green(today.wavespellSeal || '?')}`, w)))
  lines.push(C.cyan(boxText(`  ${C.dim('Position:')} ${today.wavespellPosition || '?'} of 13`, w)))
  lines.push(C.cyan(boxText('', w)))
  lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  lines.push(C.cyan(boxText(C.bold(' Tone Details'), w, 'center')))
  lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  lines.push(C.cyan(boxText(`  ${C.yellow('Tone ' + today.toneNumber)}: ${today.toneName}`, w)))
  lines.push(C.cyan(boxText(`  ${C.dim('Keywords:')} ${today.toneKeywords}`, w)))
  lines.push(C.cyan(boxText('', w)))
  lines.push(C.cyan(boxLine(BOX.bl, BOX.h, BOX.br, w)))

  return lines
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderAstrologyView(person: PersonRecord | null, results: any): string[] {
  if (!person || !results?.astrology) return [C.dim('Select a person first [2] to view their astrology')]
  const astro = results.astrology
  const lines: string[] = []
  const w = 64

  lines.push(C.cyan(boxLine(BOX.tl, BOX.h, BOX.tr, w)))
  lines.push(C.cyan(boxText(C.bold(C.yellow(` ✦  ASTROLOGY - ${person.name.toUpperCase()}`)), w)))
  lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  lines.push(C.cyan(boxText('', w)))
  lines.push(C.cyan(boxText(`  ${C.yellow('☉ Sun:')}     ${C.bold(C.green(astro.sunSign || '?'))}`, w)))
  if (astro.moonSign) lines.push(C.cyan(boxText(`  ${C.yellow('☽ Moon:')}    ${C.bold(C.green(astro.moonSign))}`, w)))
  if (astro.risingSign) lines.push(C.cyan(boxText(`  ${C.yellow('↑ Rising:')}  ${C.bold(C.green(astro.risingSign))}`, w)))
  if (astro.mercurySign) lines.push(C.cyan(boxText(`  ${C.yellow('☿ Mercury:')} ${C.green(astro.mercurySign)}`, w)))
  if (astro.venusSign) lines.push(C.cyan(boxText(`  ${C.yellow('♀ Venus:')}   ${C.green(astro.venusSign)}`, w)))
  if (astro.marsSign) lines.push(C.cyan(boxText(`  ${C.yellow('♂ Mars:')}    ${C.green(astro.marsSign)}`, w)))
  lines.push(C.cyan(boxText('', w)))

  if (astro.summary) {
    lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
    lines.push(C.cyan(boxText(C.bold(' Summary'), w, 'center')))
    lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
    lines.push(C.cyan(boxText(`  ${C.yellow('Element:')}   ${C.green(astro.summary.dominantElement || '?')}`, w)))
    lines.push(C.cyan(boxText(`  ${C.yellow('Modality:')}  ${C.green(astro.summary.dominantModality || '?')}`, w)))
    if (astro.summary.dominantPlanet) lines.push(C.cyan(boxText(`  ${C.yellow('Ruler:')}     ${C.green(astro.summary.dominantPlanet)}`, w)))
  }

  if (astro.planets && Array.isArray(astro.planets) && astro.planets.length > 0) {
    lines.push(C.cyan(boxText('', w)))
    lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
    lines.push(C.cyan(boxText(C.bold(' Planet Positions'), w, 'center')))
    lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
    lines.push(C.cyan(boxText(`  ${C.bold(C.white('Planet'.padEnd(12)))} ${C.bold(C.white('Sign'.padEnd(14)))} ${C.bold(C.white('Degree'.padEnd(8)))} ${C.bold(C.white('Rx'))}`, w)))
    lines.push(C.cyan(boxText(`  ${'─'.repeat(42)}`, w)))

    for (const pl of astro.planets) {
      const name = (pl.name || '').padEnd(12)
      const sign = (pl.sign || '').padEnd(14)
      const deg = pl.degree != null ? `${Math.floor(pl.degree)}°${Math.floor((pl.degree % 1) * 60)}'`.padEnd(8) : ''.padEnd(8)
      const rx = pl.retrograde ? C.red('R') : ' '
      lines.push(C.cyan(boxText(`  ${C.white(name)} ${C.green(sign)} ${C.dim(deg)} ${rx}`, w)))
    }
  }

  if (astro.aspects && Array.isArray(astro.aspects) && astro.aspects.length > 0) {
    lines.push(C.cyan(boxText('', w)))
    lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
    lines.push(C.cyan(boxText(C.bold(' Major Aspects'), w, 'center')))
    lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))

    for (const asp of astro.aspects.slice(0, 12)) {
      const sym = asp.type === 'conjunction' ? '☌' : asp.type === 'opposition' ? '☍' : asp.type === 'trine' ? '△' : asp.type === 'square' ? '□' : asp.type === 'sextile' ? '⚹' : '·'
      lines.push(C.cyan(boxText(`  ${asp.planet1 || '?'} ${C.yellow(sym)} ${asp.planet2 || '?'} ${C.dim(`(${asp.type})`)}`, w)))
    }
  }

  if (!astro.hasBirthTime) {
    lines.push(C.cyan(boxText('', w)))
    lines.push(C.cyan(boxText(C.dim('  ⚠ No birth time - results approximate'), w)))
  }

  lines.push(C.cyan(boxLine(BOX.bl, BOX.h, BOX.br, w)))
  return lines
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderHumanDesignView(person: PersonRecord | null, results: any): string[] {
  if (!person || !results?.humandesign) return [C.dim('Select a person first [2] to view their Human Design')]
  const hd = results.humandesign
  const lines: string[] = []
  const w = 64

  lines.push(C.cyan(boxLine(BOX.tl, BOX.h, BOX.tr, w)))
  lines.push(C.cyan(boxText(C.bold(C.magenta(` △  HUMAN DESIGN - ${person.name.toUpperCase()}`)), w)))
  lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  lines.push(C.cyan(boxText('', w)))
  lines.push(C.cyan(boxText(`  ${C.yellow('Type:')}        ${C.bold(C.green(hd.type))}`, w)))
  lines.push(C.cyan(boxText(`  ${C.yellow('Strategy:')}    ${C.green(hd.strategy || '?')}`, w)))
  lines.push(C.cyan(boxText(`  ${C.yellow('Authority:')}   ${C.green(hd.authority || '?')}`, w)))
  if (hd.profile) lines.push(C.cyan(boxText(`  ${C.yellow('Profile:')}     ${C.green(hd.profile)}`, w)))
  if (hd.definition) lines.push(C.cyan(boxText(`  ${C.yellow('Definition:')}  ${C.green(hd.definition)}`, w)))
  if (hd.incarnationCross) lines.push(C.cyan(boxText(`  ${C.yellow('Cross:')}       ${C.green(hd.incarnationCross)}`, w)))
  lines.push(C.cyan(boxText('', w)))

  // ASCII Bodygraph
  lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  lines.push(C.cyan(boxText(C.bold(' Bodygraph Centers'), w, 'center')))
  lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))

  const defined = new Set((hd.definedCenters || []).map((c: string) => c.toLowerCase()))
  const centerFmt = (name: string) => {
    const isDefined = defined.has(name.toLowerCase())
    const display = name.slice(0, 6).toUpperCase().padEnd(6)
    return isDefined ? C.bold(C.yellow(`[${display}]`)) : C.dim(`(${display})`)
  }

  lines.push(C.cyan(boxText('', w)))
  lines.push(C.cyan(boxText(`                ${centerFmt('Head')}`, w)))
  lines.push(C.cyan(boxText(`                  ${C.dim('│')}`, w)))
  lines.push(C.cyan(boxText(`                ${centerFmt('Ajna')}`, w)))
  lines.push(C.cyan(boxText(`                  ${C.dim('│')}`, w)))
  lines.push(C.cyan(boxText(`              ${centerFmt('Throat')}`, w)))
  lines.push(C.cyan(boxText(`              ${C.dim('╱')}      ${C.dim('╲')}`, w)))
  lines.push(C.cyan(boxText(`      ${centerFmt('Self')}           ${centerFmt('Will')}`, w)))
  lines.push(C.cyan(boxText(`         ${C.dim('│')}   ${C.dim('╲')}      ${C.dim('╱')}   ${C.dim('│')}`, w)))
  lines.push(C.cyan(boxText(`         ${C.dim('│')}  ${centerFmt('Sacral')}   ${C.dim('│')}`, w)))
  lines.push(C.cyan(boxText(`         ${C.dim('│')}      ${C.dim('│')}       ${C.dim('│')}`, w)))
  lines.push(C.cyan(boxText(`  ${centerFmt('Spleen')}    ${centerFmt('Sacral')}    ${centerFmt('Solar')}`, w)))
  lines.push(C.cyan(boxText(`         ${C.dim('╲')}      ${C.dim('│')}       ${C.dim('╱')}`, w)))
  lines.push(C.cyan(boxText(`              ${centerFmt('Root')}`, w)))
  lines.push(C.cyan(boxText('', w)))

  lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  lines.push(C.cyan(boxText(`  ${C.yellow('[DEFN  ]')} = Defined   ${C.dim('(OPEN  )')} = Open`, w)))
  lines.push(C.cyan(boxText('', w)))
  lines.push(C.cyan(boxText(`  ${C.dim('Defined:')} ${(hd.definedCenters || []).join(', ') || 'none'}`, w)))
  lines.push(C.cyan(boxText(`  ${C.dim('Open:')}    ${(hd.undefinedCenters || []).join(', ') || 'none'}`, w)))

  if (hd.channels && Array.isArray(hd.channels) && hd.channels.length > 0) {
    lines.push(C.cyan(boxText('', w)))
    lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
    lines.push(C.cyan(boxText(C.bold(' Active Channels'), w, 'center')))
    lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
    for (const ch of hd.channels) {
      const label = typeof ch === 'string' ? ch : (ch.name || `${ch.gate1}-${ch.gate2}`)
      lines.push(C.cyan(boxText(`  ${C.green('●')} ${label}`, w)))
    }
  }

  if (!hd.hasBirthTime) {
    lines.push(C.cyan(boxText('', w)))
    lines.push(C.cyan(boxText(C.dim('  ⚠ No birth time - results approximate'), w)))
  }

  lines.push(C.cyan(boxLine(BOX.bl, BOX.h, BOX.br, w)))
  return lines
}

function renderTzolkinGrid(): string[] {
  const lines: string[] = []
  const sealNames = [
    'Dragon', 'Wind  ', 'Night ', 'Seed  ', 'Serpen',
    'W.Brdg', 'Hand  ', 'Star  ', 'Moon  ', 'Dog   ',
    'Monkey', 'Human ', 'Skywal', 'Wizard', 'Eagle ',
    'Warrir', 'Earth ', 'Mirror', 'Storm ', 'Sun   ',
  ]
  const colors = ['red', 'white', 'blue', 'yellow']
  const colorFn: Record<string, (s: string) => string> = {
    red: C.red, white: C.white, blue: C.blue, yellow: C.yellow,
  }

  lines.push('')
  lines.push(C.bold(C.yellow('  TZOLKIN - 260 Kin Harmonic Matrix')))
  lines.push('')

  // Column header: tone numbers 1-13
  let header = '        '
  for (let t = 1; t <= 13; t++) {
    header += C.dim(String(t).padStart(3).padEnd(5))
  }
  lines.push(header)
  lines.push(C.dim('  ──────' + '─'.repeat(65)))

  // 20 rows (seals) x 13 columns (tones) = 260 kin
  for (let s = 0; s < 20; s++) {
    const sealLabel = sealNames[s]
    const color = colors[s % 4]
    const cf = colorFn[color]
    let row = cf(sealLabel) + ' '
    for (let t = 0; t < 13; t++) {
      const kin = ((t * 20 + s) % 260) + 1
      const kinStr = String(kin).padStart(3)
      const isGAP = isGalacticActivationPortal(kin)
      if (isGAP) {
        row += C.bold(cf(kinStr)) + C.dim('* ')
      } else {
        row += cf(kinStr) + '  '
      }
    }
    lines.push('  ' + row)
  }

  lines.push('')
  lines.push(C.dim('  ──────' + '─'.repeat(65)))
  lines.push(C.dim('  * = Galactic Activation Portal'))
  lines.push(`  ${C.red('Red')} ${C.white('White')} ${C.blue('Blue')} ${C.yellow('Yellow')} = Seal colors (4-color cycle)`)
  lines.push('')

  return lines
}

function isGalacticActivationPortal(kin: number): boolean {
  const gaps = new Set([
    1, 20, 22, 39, 43, 50, 51, 58, 64, 69, 72, 77, 85, 88, 93, 96,
    106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 146, 147, 148,
    149, 150, 151, 152, 153, 154, 155, 165, 168, 173, 176, 184, 189,
    192, 197, 203, 210, 211, 218, 222, 239, 241, 260,
  ])
  return gaps.has(kin)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderCompatibilityView(person1: PersonRecord | null, person2: PersonRecord | null, r1: any, r2: any): string[] {
  if (!person1 || !person2) return [
    C.dim('Select two people to compare.'),
    '',
    C.dim('Use the People view [2] to select Person 1 (Enter),'),
    C.dim('then press "c" on Person 2 to compare.'),
  ]

  const lines: string[] = []
  const w = 64

  lines.push(C.cyan(boxLine(BOX.tl, BOX.h, BOX.tr, w)))
  lines.push(C.cyan(boxText(C.bold(C.yellow(` ⚡  COMPATIBILITY`)), w)))
  lines.push(C.cyan(boxText(`  ${C.green(person1.name)} ${C.dim('×')} ${C.green(person2.name)}`, w)))
  lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))

  if (r1?.dreamspell && r2?.dreamspell) {
    lines.push(C.cyan(boxText(C.bold(C.green(' ◈ Dreamspell')), w)))
    lines.push(C.cyan(boxText(`  ${person1.name}: Kin ${r1.dreamspell.kin} - ${r1.dreamspell.toneData.name} ${r1.dreamspell.sealData.english}`, w)))
    lines.push(C.cyan(boxText(`  ${person2.name}: Kin ${r2.dreamspell.kin} - ${r2.dreamspell.toneData.name} ${r2.dreamspell.sealData.english}`, w)))

    const seal1 = r1.dreamspell.seal
    const seal2 = r2.dreamspell.seal
    const oracle1 = r1.dreamspell.oracle
    const oracle2 = r2.dreamspell.oracle
    const rels: string[] = []
    if (oracle1.analog === seal2 || oracle2.analog === seal1) rels.push(C.magenta('Analog (support)'))
    if (oracle1.antipode === seal2 || oracle2.antipode === seal1) rels.push(C.red('Antipode (challenge)'))
    if (oracle1.occult === seal2 || oracle2.occult === seal1) rels.push(C.cyan('Occult (hidden power)'))
    if (oracle1.guide === seal2 || oracle2.guide === seal1) rels.push(C.yellow('Guide'))
    if (rels.length > 0) {
      lines.push(C.cyan(boxText(`  ${C.bold('Connections:')}`, w)))
      for (const r of rels) lines.push(C.cyan(boxText(`    ● ${r}`, w)))
    } else {
      lines.push(C.cyan(boxText(C.dim('  No direct oracle connections'), w)))
    }
    lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  }

  if (r1?.astrology && r2?.astrology) {
    lines.push(C.cyan(boxText(C.bold(C.yellow(' ✦ Astrology')), w)))
    lines.push(C.cyan(boxText(`  ${person1.name}: ☉ ${r1.astrology.sunSign}${r1.astrology.moonSign ? ` ☽ ${r1.astrology.moonSign}` : ''}`, w)))
    lines.push(C.cyan(boxText(`  ${person2.name}: ☉ ${r2.astrology.sunSign}${r2.astrology.moonSign ? ` ☽ ${r2.astrology.moonSign}` : ''}`, w)))

    if (r1.astrology.summary?.dominantElement && r2.astrology.summary?.dominantElement) {
      const e1 = r1.astrology.summary.dominantElement
      const e2 = r2.astrology.summary.dominantElement
      const compat = elementCompatibility(e1, e2)
      lines.push(C.cyan(boxText(`  ${C.dim('Elements:')} ${e1} × ${e2} = ${compat}`, w)))
    }
    lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  }

  if (r1?.humandesign && r2?.humandesign) {
    lines.push(C.cyan(boxText(C.bold(C.magenta(' △ Human Design')), w)))
    lines.push(C.cyan(boxText(`  ${person1.name}: ${r1.humandesign.type}${r1.humandesign.profile ? ` (${r1.humandesign.profile})` : ''}`, w)))
    lines.push(C.cyan(boxText(`  ${person2.name}: ${r2.humandesign.type}${r2.humandesign.profile ? ` (${r2.humandesign.profile})` : ''}`, w)))

    const def1 = new Set<string>((r1.humandesign.definedCenters || []).map((c: string) => c.toLowerCase()))
    const def2 = new Set<string>((r2.humandesign.definedCenters || []).map((c: string) => c.toLowerCase()))
    const complementary: string[] = []
    def1.forEach(c => { if (!def2.has(c)) complementary.push(c) })
    if (complementary.length > 0) {
      lines.push(C.cyan(boxText(`  ${C.dim('Complementary:')} ${person1.name} defines what ${person2.name} doesn't:`, w)))
      lines.push(C.cyan(boxText(`    ${complementary.join(', ')}`, w)))
    }
    lines.push(C.cyan(boxLine(BOX.lt, BOX.h, BOX.rt, w)))
  }

  lines.push(C.cyan(boxLine(BOX.bl, BOX.h, BOX.br, w)))
  return lines
}

function elementCompatibility(e1: string, e2: string): string {
  const el1 = e1.toLowerCase()
  const el2 = e2.toLowerCase()
  if (el1 === el2) return C.green('Same element - natural affinity')
  const harmonious: Record<string, string[]> = {
    fire: ['air'], air: ['fire'], earth: ['water'], water: ['earth'],
  }
  if (harmonious[el1]?.includes(el2)) return C.green('Harmonious')
  return C.yellow('Dynamic tension')
}

// ─── REPL View (view 0) ────────────────────────────────────────────────

function REPLView({
  lines, input, setInput, onSubmit, history, historyIndex, setHistoryIndex, isProcessing, inputRef, bottomRef,
}: {
  lines: TerminalLine[]
  input: string
  setInput: (v: string) => void
  onSubmit: () => void
  history: string[]
  historyIndex: number
  setHistoryIndex: (v: number) => void
  isProcessing: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  bottomRef: React.RefObject<HTMLDivElement | null>
}) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); onSubmit() }
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const idx = Math.min(historyIndex + 1, history.length - 1)
        setHistoryIndex(idx)
        setInput(history[idx])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) { const idx = historyIndex - 1; setHistoryIndex(idx); setInput(history[idx]) }
      else { setHistoryIndex(-1); setInput('') }
    }
  }, [onSubmit, history, historyIndex, setHistoryIndex, setInput])

  return (
    <div className="flex-1 overflow-y-auto p-2">
      {lines.map((line, i) => (
        <div key={i}>
          {line.type === 'input' ? (
            <div className="flex gap-2">
              <span className="text-cyan-400 shrink-0">omnis&gt;</span>
              <span className="text-green-300">{line.content}</span>
            </div>
          ) : (
            <AnsiLine text={line.content} />
          )}
        </div>
      ))}
      <div className="flex gap-2 items-center mt-1">
        <span className="text-cyan-400 shrink-0">omnis&gt;</span>
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          className="flex-1 bg-transparent text-green-300 outline-none caret-green-400 placeholder:text-green-900"
          placeholder={isProcessing ? 'processing...' : ''}
          spellCheck={false}
          autoComplete="off"
        />
        {isProcessing && <span className="text-green-600 animate-pulse">|</span>}
      </div>
      <div ref={bottomRef as React.RefObject<HTMLDivElement>} />
    </div>
  )
}

// ─── Main Terminal Component ────────────────────────────────────────────

export default function Terminal() {
  const [currentView, setCurrentView] = useState<ViewId>(1)
  const [people, setPeople] = useState<PersonRecord[]>([])
  const [selectedPersonIndex, setSelectedPersonIndex] = useState(0)
  const [selectedPerson, setSelectedPerson] = useState<PersonRecord | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [personResults, setPersonResults] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selfResults, setSelfResults] = useState<any>(null)
  const [todayData, setTodayData] = useState<TodayData | null>(null)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [clock, setClock] = useState(new Date())
  const [comparePerson, setComparePerson] = useState<PersonRecord | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [compareResults, setCompareResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // REPL state
  const [replLines, setReplLines] = useState<TerminalLine[]>([
    { type: 'output', content: C.cyan('OMNIS Command Line') + '\n' + C.dim("Type 'help' for commands. Press 1-8 for TUI views.") },
  ])
  const [replInput, setReplInput] = useState('')
  const [replHistory, setReplHistory] = useState<string[]>([])
  const [replHistoryIndex, setReplHistoryIndex] = useState(-1)
  const [replProcessing, setReplProcessing] = useState(false)
  const replInputRef = useRef<HTMLInputElement>(null)
  const replBottomRef = useRef<HTMLDivElement>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  // Clock tick
  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Load initial data
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [peopleData, today] = await Promise.all([
          fetchPeople(),
          Promise.resolve(fetchTodayData()),
        ])
        setPeople(peopleData)
        setTodayData(today)

        const selfPerson = await fetchSelfPerson()
        if (selfPerson) {
          const sr = await fetchComputedResults(selfPerson.id)
          setSelfResults(sr)
          setSelectedPerson(selfPerson)
          setPersonResults(sr)
          const idx = peopleData.findIndex(p => p.id === selfPerson.id)
          if (idx >= 0) setSelectedPersonIndex(idx)
        }
      } catch (e) {
        console.error('Failed to load TUI data:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const loadPersonResults = useCallback(async (person: PersonRecord) => {
    setSelectedPerson(person)
    setPersonResults(null)
    const results = await fetchComputedResults(person.id)
    setPersonResults(results)
  }, [])

  const loadCompareResults = useCallback(async (person: PersonRecord) => {
    setComparePerson(person)
    setCompareResults(null)
    const results = await fetchComputedResults(person.id)
    setCompareResults(results)
  }, [])

  // Keyboard handler
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Don't intercept when REPL input is focused
      if (currentView === 0 && document.activeElement === replInputRef.current) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setCurrentView(1)
        }
        return
      }

      // Number keys switch views
      if (e.key >= '0' && e.key <= '8' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault()
        const view = parseInt(e.key) as ViewId
        setCurrentView(view)
        setScrollOffset(0)
        if (view === 0) {
          setTimeout(() => replInputRef.current?.focus(), 50)
        }
        return
      }

      // Scroll / navigate
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault()
        if (currentView === 2) {
          setSelectedPersonIndex(prev => Math.min(prev + 1, people.length - 1))
        } else {
          setScrollOffset(prev => prev + 3)
        }
      }
      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault()
        if (currentView === 2) {
          setSelectedPersonIndex(prev => Math.max(prev - 1, 0))
        } else {
          setScrollOffset(prev => Math.max(prev - 3, 0))
        }
      }

      // Enter to select person
      if (e.key === 'Enter' && currentView === 2 && people[selectedPersonIndex]) {
        e.preventDefault()
        loadPersonResults(people[selectedPersonIndex])
        setCurrentView(3)
        setScrollOffset(0)
      }

      // 'c' to set compare person
      if (e.key === 'c' && currentView === 2 && people[selectedPersonIndex]) {
        e.preventDefault()
        if (selectedPerson && people[selectedPersonIndex].id !== selectedPerson.id) {
          loadCompareResults(people[selectedPersonIndex])
          setCurrentView(8)
          setScrollOffset(0)
        }
      }

      // Escape go to dashboard
      if (e.key === 'Escape') {
        e.preventDefault()
        setCurrentView(1)
        setScrollOffset(0)
      }

      if (e.key === 'PageDown') { e.preventDefault(); setScrollOffset(prev => prev + 20) }
      if (e.key === 'PageUp') { e.preventDefault(); setScrollOffset(prev => Math.max(prev - 20, 0)) }
      if (e.key === 'Home') { e.preventDefault(); setScrollOffset(0) }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentView, people, selectedPersonIndex, selectedPerson, loadPersonResults, loadCompareResults])

  // REPL submit
  const handleReplSubmit = useCallback(async () => {
    const cmd = replInput.trim()
    if (!cmd) return
    setReplLines(prev => [...prev, { type: 'input', content: cmd }])
    setReplHistory(prev => [cmd, ...prev])
    setReplHistoryIndex(-1)
    setReplInput('')
    setReplProcessing(true)
    try {
      const result = await executeCommand(cmd)
      if (result === '__CLEAR__') {
        setReplLines([])
      } else if (result) {
        setReplLines(prev => [...prev, { type: 'output', content: result }])
      }
    } catch (err) {
      setReplLines(prev => [...prev, {
        type: 'output',
        content: `\x1b[31mError: ${err instanceof Error ? err.message : 'Unknown error'}\x1b[0m`,
      }])
    } finally {
      setReplProcessing(false)
    }
  }, [replInput])

  // Render main content
  function renderMainContent(): string[] {
    if (loading) return [C.dim('  Loading data...'), '', C.dim('  Please wait...')]

    switch (currentView) {
      case 1: return renderDashboard(todayData, people, selfResults)
      case 2: return renderPeopleList(people, selectedPersonIndex)
      case 3: return renderPersonDetail(selectedPerson, personResults)
      case 4: return renderDreamspellView(todayData)
      case 5: return renderAstrologyView(selectedPerson, personResults)
      case 6: return renderHumanDesignView(selectedPerson, personResults)
      case 7: return renderTzolkinGrid()
      case 8: return renderCompatibilityView(selectedPerson, comparePerson, personResults, compareResults)
      default: return []
    }
  }

  const mainLines = renderMainContent()
  const visibleLines = mainLines.slice(scrollOffset, scrollOffset + 200)

  const timeStr = clock.toLocaleTimeString('en-US', { hour12: false })
  const dateStr = clock.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col h-full bg-black font-mono text-xs text-green-400 overflow-hidden select-none"
      tabIndex={0}
    >
      {/* Matrix rain background */}
      <MatrixRain />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
        }}
      />

      {/* CRT vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* ═══ TOP BAR ═══ */}
      <div className="relative z-20 flex items-center justify-between px-3 py-1 bg-green-950/60 border-b border-green-800/50">
        <div className="flex items-center gap-2">
          <span className="text-green-300 font-bold tracking-wider">OMNIS TUI</span>
          <span className="text-green-700">│</span>
          <span className="text-green-600">{VIEW_LABELS[currentView]}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-green-600">{dateStr}</span>
          <span className="text-green-500 font-bold tabular-nums">{timeStr}</span>
        </div>
      </div>

      {/* ═══ MAIN LAYOUT ═══ */}
      <div className="relative z-20 flex flex-1 overflow-hidden">

        {/* ─── LEFT SIDEBAR ─── */}
        <div className="w-28 shrink-0 border-r border-green-800/50 bg-black/40 flex flex-col py-1">
          {([1, 2, 3, 4, 5, 6, 7, 8, 0] as ViewId[]).map(v => {
            const active = currentView === v
            const icons: Record<ViewId, string> = {
              1: '☀', 2: '👥', 3: '🔮', 4: '◈', 5: '✦', 6: '△', 7: '▦', 8: '⚡', 0: '>_',
            }
            return (
              <button
                key={v}
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentView(v)
                  setScrollOffset(0)
                  if (v === 0) setTimeout(() => replInputRef.current?.focus(), 50)
                }}
                className={`
                  text-left px-2 py-0.5 text-xs transition-colors cursor-pointer
                  ${active
                    ? 'bg-green-900/50 text-green-300 font-bold border-r-2 border-green-400'
                    : 'text-green-700 hover:text-green-500 hover:bg-green-950/40'
                  }
                `}
              >
                <span className="text-green-600">[{v}]</span>{' '}
                <span>{icons[v]}</span>{' '}
                <span className="hidden lg:inline">{VIEW_LABELS[v].slice(0, 6)}</span>
              </button>
            )
          })}

          {selectedPerson && (
            <div className="mt-auto px-2 py-1 border-t border-green-900/50">
              <div className="text-green-700 text-[10px]">SELECTED</div>
              <div className="text-green-500 text-[10px] truncate">{selectedPerson.name}</div>
            </div>
          )}
        </div>

        {/* ─── MAIN PANEL ─── */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {currentView === 0 ? (
            <REPLView
              lines={replLines}
              input={replInput}
              setInput={setReplInput}
              onSubmit={handleReplSubmit}
              history={replHistory}
              historyIndex={replHistoryIndex}
              setHistoryIndex={setReplHistoryIndex}
              isProcessing={replProcessing}
              inputRef={replInputRef}
              bottomRef={replBottomRef}
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-3">
              {visibleLines.map((line, i) => (
                <AnsiLine key={i + scrollOffset} text={line} />
              ))}
              {scrollOffset > 0 && (
                <div className="text-green-800 text-[10px] mt-1">
                  ─ scrolled {scrollOffset} lines ─ Home to reset
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ BOTTOM BAR ═══ */}
      <div className="relative z-20 flex items-center justify-between px-3 py-1 bg-green-950/60 border-t border-green-800/50 text-[10px]">
        <div className="flex items-center gap-2 text-green-700">
          <span>[1-8] Views</span>
          <span className="text-green-900">│</span>
          <span>[0] CMD</span>
          <span className="text-green-900">│</span>
          <span>[↑↓] Scroll</span>
          <span className="text-green-900">│</span>
          <span>[Esc] Dashboard</span>
          {currentView === 2 && (
            <>
              <span className="text-green-900">│</span>
              <span>[Enter] Select</span>
              <span className="text-green-900">│</span>
              <span>[c] Compare</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-800">{people.length} people</span>
          <span className="text-green-900">│</span>
          <span className="text-green-700">OMNIS v2.0</span>
        </div>
      </div>
    </div>
  )
}
