import { describe, expect, it } from 'vitest'
import { shiftDay } from '@pleiad/engine/calculations/day-search'
import { getTodayAcrossSystems } from './today-board'
import { todayBoards, type CalendarView, type DayBoard } from './today-boards'
import { todayFigures } from './today-figures'
import { expectBoardRules } from './boards/board-rules'

/**
 * The boards the rows open (BENTO_V2.md "Rows open their calendar's board")
 * for 2026-11-08, read off sources outside the code: the Moon a day before
 * the new Moon of 9 November, then at first quarter on the 17th, full on the
 * 24th, last quarter on 1 December (USNO); the Sun at 16° Scorpio, entering
 * Sagittarius on 22 November and Capricorn on 21 December, and at 21° Libra
 * sidereal (Lahiri), entering Scorpio on 16 November; the Sun in gate 1 line
 * 4 of the Human Design wheel, gate 1 in the G centre with its channel to 8,
 * Heaven over Heaven, its Gene Key Entropy, Freshness, Beauty; 28 Heshvan
 * 5787, a Sunday, with 1 Kislev on 11 November, Hanukkah's first day on
 * 5 December, Tu BiShvat on 23 January and Purim on 23 March 2027; Long
 * Count 13.0.14.1.10, its winal turning on 18 November; the Yang Fire Horse,
 * 43rd of the sixty, and the Yin Fire Goat from 6 February 2027; 28 Jumada I
 * 1448 (Umm al-Qura) with Jumada II from 11 November; 17 Aban 1405 with Azar
 * from 22 November. The Chinese date 九月三十, the 30th of the ninth month,
 * in the solar term Lidong from 7 November, the tenth month from 9 November
 * and Xiaoxue on the 22nd (Hong Kong Observatory). At sunrise in Ujjain
 * Krishna Chaturdashi to 11:27 IST, Swati, Ayushman, Shakuni, in Ashvin
 * amanta and Kartika purnimanta; the Sun into sidereal Vrishchika on the
 * 16th, the Ekadashis on 20 November (no sunrise in its tithi) and
 * 4 December (Drik Panchang). The Sun's ingresses of the year ahead to
 * 2027's Leo (23 July) and Virgo (23 August) are the almanac's.
 */
const DAY = '2026-11-08'
const boards = todayBoards(DAY, getTodayAcrossSystems(new Date(`${DAY}T12:00:00Z`)))
const facts = (board: DayBoard | undefined) => Object.fromEntries((board?.facts ?? []).map((f) => [f.label, f.value]))
const next = (board: DayBoard | undefined) => (board?.next ?? []).map(({ name, date, inDays }) => [name, date, inDays])
const mast = (board: DayBoard | undefined) => board?.mast && [board.mast.numeral.text, board.mast.title, board.mast.words.map((w) => w.text)]
const cellsOf = (view: CalendarView | undefined) => (view?.sections ?? []).flatMap((s) => s.cells)
const todayIn = (view: CalendarView | undefined) => cellsOf(view).filter((c) => c.state === 'today')
const shape = (view: CalendarView | undefined) => view && { layout: view.layout, name: view.name, caption: view.caption, cells: view.sections.map((s) => s.cells.length) }
const heads = (view: CalendarView | undefined) => view?.sections[0]?.heads?.map((h) => `${h.text}${h.weekend ? '*' : ''}`).join('')
const eventsIn = (view: CalendarView | undefined) => cellsOf(view).flatMap((c) => (c.events ?? []).map((e) => [c.key, e.name]))

describe('todayBoards', () => {
  const built = Object.entries(boards) as [string, DayBoard][]

  it("builds a board for every calendar, the kin's for its tile", () => {
    expect(Object.keys(boards).sort()).toEqual(['chineseYear', 'gate', 'hebrewDate', 'hijri', 'kin', 'longCount', 'moon', 'panchang', 'persian', 'sidereal', 'sun'])
  })

  it('gives every board a mast, and a calendar whose views hold today once, each cell saying itself', () => {
    for (const [field, board] of built) {
      expect(board.mast, field).toBeDefined()
      for (const view of board.views ?? []) {
        if (!view) continue
        expect(todayIn(view), `${field} ${view.name}`).toHaveLength(1)
        expect(view.caption, `${field} ${view.name}`).not.toBe('')
        const keys = cellsOf(view).map((c) => c.key)
        expect(new Set(keys).size, `${field} ${view.name} keys`).toBe(keys.length)
        for (const cell of cellsOf(view)) expect(cell.said, `${field} ${cell.key}`).not.toBe('')
      }
    }
  })

  it('holds every board to the board rules: keyed legends, linked events, placed sections (BENTO_BOARDS.md)', () => {
    for (const [field, board] of built) expectBoardRules(board, field, shiftDay, DAY)
  })

  it('dates what comes next on or after today, nearest first, each date the days it says from today', () => {
    for (const [field, board] of built) {
      expect(board.next.length, field).toBeGreaterThan(0)
      for (const event of board.next) expect(event.date, `${field} ${event.name}`).toBe(shiftDay(DAY, event.inDays))
      const days = board.next.map((e) => e.inDays)
      expect(days, field).toEqual([...days].sort((a, b) => a - b))
      expect(Math.min(...days), field).toBeGreaterThanOrEqual(0)
    }
  })

  it('reads the Moon a day before the new Moon: the lunation in weeks, a face a day, the quarters on their days to the minute', () => {
    expect(boards.moon).toMatchObject({ value: 'New Moon', meaning: 'Read for beginnings, intention-setting.' })
    expect(mast(boards.moon)).toEqual(['29', 'New Moon', ['Day 29 of 29', '1% lit', 'in Scorpio']])
    expect(facts(boards.moon)).toMatchObject({ Age: '28 days', 'Moon in': 'Scorpio' })
    const unit = boards.moon?.views?.[0]
    expect(shape(unit)).toEqual({ layout: 'grid', name: 'The lunation', caption: 'Day 29 of the lunation', cells: [29] })
    expect(heads(unit)).toBe('S*MTWTFS*')
    expect(cellsOf(unit).every((c) => c.mark?.kind === 'moon')).toBe(true)
    expect(todayIn(unit)[0]?.said).toBe('Sun 8 Nov · day 29 of the lunation · New Moon, 1% lit · Moon in Scorpio · Moon enters Scorpio, Sat 7 Nov 22:40 UTC')
    const months = boards.moon?.views?.find((v) => v.id === 'months')
    expect(eventsIn(months)).toContainEqual(['2026-11-09', 'New Moon, 07:03 UTC'])
    expect(months?.sections.map((s) => [s.name, s.offset, s.cells.length])).toEqual([
      ['November 2026', 0, 30],
      ['December 2026', 2, 31],
    ])
    expect(boards.moon?.views?.map((v) => v.id)).toEqual(['lunation', 'year', 'months'])
    expect(next(boards.moon).filter(([name]) => /Moon|Quarter/.test(String(name)) && !String(name).startsWith('Moon enters'))).toEqual([
      ['New Moon, 07:03 UTC', '2026-11-09', 1],
      ['First Quarter, 11:48 UTC', '2026-11-17', 9],
      ['Full Moon, 14:54 UTC', '2026-11-24', 16],
      ['Last Quarter, 06:09 UTC', '2026-12-01', 23],
    ])
  })

  it("reads the Sun's sign at its degree: its season a degree a day under its terms, the faces banded, the year's ingresses on a ring", () => {
    expect(boards.sun).toMatchObject({ value: '16° Scorpio', meaning: 'Transformation, intensity, depth.' })
    expect(mast(boards.sun)).toEqual(['16°', 'Scorpio', ['Water', 'Fixed', 'Feminine', 'ruled by Mars']])
    expect(facts(boards.sun)).toMatchObject({ Ruler: 'Mars; Pluto in modern astrology', Decan: 'II, ruled by the Sun', Term: 'Mercury, 11° to 19°', Entered: 'Fri 23 Oct 09:38 UTC, 16 days ago' })
    const unit = boards.sun?.views?.[0]
    expect(shape(unit)).toEqual({ layout: 'grid', name: "Scorpio's season", caption: '16 of 30 degrees of Scorpio crossed', cells: [30] })
    expect(unit?.sections[0]?.offset).toBe(5)
    expect(unit?.legend.map((l) => l.words).slice(0, 3)).toEqual(['I · Mars, 0° to 10°', 'II · The Sun, 10° to 20°', 'III · Venus, 20° to 30°'])
    expect(eventsIn(unit)).toEqual([
      ['2026-10-23', 'Sun enters Scorpio, 09:38 UTC'],
      ['2026-11-07', 'Cross-quarter, 15° Scorpio, 09:53 UTC'],
    ])
    const ring = boards.sun?.views?.[1]
    expect(shape(ring)).toMatchObject({ layout: 'ring', name: 'The year ahead', cells: [12] })
    expect(cellsOf(ring).map((c) => c.note)).toEqual(['20 Mar', '20 Apr', '21 May', '21 Jun', '23 Jul', '23 Aug', '23 Sept', '23 Oct', '22 Nov', '21 Dec', '20 Jan', '18 Feb'])
    expect(todayIn(ring)[0]?.title).toBe('Scorpio')
    expect(next(boards.sun).filter(([name]) => String(name).startsWith('Enters'))).toEqual([
      ['Enters Sagittarius, 07:24 UTC', '2026-11-22', 14],
      ['Enters Capricorn at the December solstice, 20:50 UTC', '2026-12-21', 43],
    ])
  })

  it('reads the sidereal Sun as Jyotish does: the rashi under the Lahiri ayanamsa, a sign behind, its drekkana and nakshatra', () => {
    expect(boards.sidereal?.value).toBe('21° Libra')
    expect(boards.sidereal?.facts[0]).toEqual({ label: 'Ayanamsa', value: 'Lahiri, 24°13′' })
    expect(facts(boards.sidereal)).toMatchObject({ Rashi: 'Tula, तुला', Drekkana: 'III, of Mithuna, ruled by Mercury', Nakshatra: 'Vishakha, pada 1' })
    expect(boards.sidereal?.views?.[0].sections[0]?.offset).toBe(0)
    expect(next(boards.sidereal)[0]).toEqual(['Vrishchika Sankranti', '2026-11-16', 8])
  })

  it("names the gate and its line with the Earth's opposite, its lines and harmonics, the Rave Mandala by quarter, the line's colours and its centre", () => {
    expect(boards.gate).toMatchObject({ label: 'Gate 1, line 4', value: 'The Creative', meaning: 'Self-expression, creativity, uniqueness.' })
    expect(mast(boards.gate)).toEqual(['1.4', 'The Creative', ['Line 4, Opportunist', 'Heaven over Heaven', 'Earth 2.4, The Receptive']])
    expect(facts(boards.gate)).toMatchObject({
      Sun: 'Gate 1, line 4',
      Earth: 'Gate 2, line 4, The Receptive',
      Line: 'Opportunist',
      Colour: '1, Fear (motivation), Appetite (determination)',
      Tone: '2, Taste (cognition), left',
      Centre: 'G Center',
      Channel: '1-8 Inspiration',
      'Harmonic gate': '8, Contribution',
      Circuit: 'Individual, Knowing',
      Trigrams: 'Heaven over Heaven',
      'Gene Key': 'Entropy → Freshness → Beauty',
    })
    const lines = boards.gate?.views?.find((v) => v.id === 'lines')
    expect(shape(lines)).toEqual({ layout: 'ladder', name: "Gate 1's lines", caption: 'Line 4 of 6, colour 1, tone 2 at noon', cells: [6, 2] })
    expect(cellsOf(lines).slice(0, 6).map((c) => [c.key, c.state, c.note])).toEqual([
      ['6', 'ahead', 'Tue 10 Nov'],
      ['5', 'ahead', 'Mon 9 Nov'],
      ['4', 'today', 'Sun 8 Nov'],
      ['3', 'past', 'Sat 7 Nov'],
      ['2', 'past', 'Fri 6 Nov'],
      ['1', 'past', 'Thu 5 Nov'],
    ])
    const wheel = boards.gate?.views?.find((v) => v.id === 'wheel')
    expect(shape(wheel)).toMatchObject({ layout: 'grid', name: 'The Rave Mandala', caption: 'Gate 1 is 51 of 64 from gate 41, where the Rave year begins', cells: [16, 16, 16, 16] })
    expect(cellsOf(wheel).every((c) => c.mark?.kind === 'hexagram')).toBe(true)
    expect(boards.gate?.views?.map((v) => v.id)).toEqual(['lines', 'wheel', 'colours', 'centre'])
    expect(next(boards.gate)).toEqual([
      ['Line 5', '2026-11-09', 1],
      ['Gate 43, Insight', '2026-11-11', 3],
      ['Rave New Year', '2027-01-22', 75],
      ['Quarter of Initiation', '2027-02-02', 86],
    ])
  })

  it("lays the Hebrew month out by Israel's week in its own numerals, the Moon a day, Shabbat red under its portion, and dates what comes next", () => {
    expect(boards.hebrewDate?.value).toBe('28 Heshvan 5787')
    expect(mast(boards.hebrewDate)).toEqual(['כ״ח', 'Heshvan 5787', ['Sunday', 'a 30-day month']])
    expect(boards.hebrewDate?.mast?.script?.text).toBe('חשוון תשפ״ז')
    expect(facts(boards.hebrewDate)).toMatchObject({ Year: '5787 · תשפ״ז', Keviah: 'זשה: a complete leap year of 385 days', Parasha: 'Toldot, Sat 14 Nov' })
    const unit = boards.hebrewDate?.views?.[0]
    expect(shape(unit)).toEqual({ layout: 'grid', name: 'Heshvan 5787', caption: 'Day 28 of 30, Heshvan; kept as in Israel', cells: [30] })
    expect(heads(unit)).toBe('SMTWTF*S*')
    expect(cellsOf(unit).every((c) => c.mark?.kind === 'moon')).toBe(true)
    expect(todayIn(unit)[0]?.label?.text).toBe('כ״ח')
    expect(cellsOf(unit).filter((c) => c.tint === 'red').map((c) => c.title)).toEqual(['Noach', 'Lech-Lecha', 'Vayera', 'Chayei Sara'])
    const year = boards.hebrewDate?.views?.[1]
    expect(shape(year)).toEqual({ layout: 'grid', name: 'The year 5787', caption: 'זשה: Rosh Hashanah on Saturday, Pesach on Thursday; a complete leap year of 385 days', cells: [13] })
    expect(eventsIn(year)).toContainEqual(['2026-11-11', 'Hanukkah, 5 Dec'])
    expect(shape(boards.hebrewDate?.views?.[2])?.cells).toEqual([12, 11, 10, 10, 11])
    expect(next(boards.hebrewDate)).toEqual([
      ['Sigd', '2026-11-09', 1],
      ['Molad Kislev, 22:27', '2026-11-09', 1],
      ['Rosh Chodesh Kislev', '2026-11-10', 2],
      ['Parashat Toldot', '2026-11-14', 6],
      ['Erev Hanukkah', '2026-12-04', 26],
      ['Hanukkah', '2026-12-05', 27],
    ])
  })

  it('reads the other months the same way: the Hijri by the Moon and its month numbers, the Persian by the signs from Farvardin and its day names', () => {
    expect(boards.hijri?.value).toBe('28 Jumada al-Ula 1448')
    expect(mast(boards.hijri)?.[0]).toBe('٢٨')
    expect(heads(boards.hijri?.views?.[0])).toBe('SMTWTF*S*')
    expect(cellsOf(boards.hijri?.views?.[0]).every((c) => c.mark?.kind === 'moon')).toBe(true)
    expect(next(boards.hijri)[0]).toEqual(['Jumada al-Akhirah begins', '2026-11-11', 3])
    expect(boards.persian?.value).toBe('17 Aban 1405')
    expect(mast(boards.persian)?.[0]).toBe('۱۷')
    expect(heads(boards.persian?.views?.[0])).toBe('SSMTWTF*')
    expect(cellsOf(boards.persian?.views?.[0]).some((c) => c.mark)).toBe(false)
    expect(todayIn(boards.persian?.views?.[0])[0]?.title).toBe('Sorush')
    expect(cellsOf(boards.persian?.views?.[1]).map((c) => (c.mark?.kind === 'glyph' ? c.mark.src.split('/').pop() : undefined))).toEqual([
      '01-aries.svg', '02-taurus.svg', '03-gemini.svg', '04-cancer.svg', '05-leo.svg', '06-virgo.svg',
      '07-libra.svg', '08-scorpio.svg', '09-sagittarius.svg', '10-capricorn.svg', '11-aquarius.svg', '12-pisces.svg',
    ])
    expect(next(boards.persian)[0]).toEqual(['Azar begins', '2026-11-22', 14])
  })

  it("counts the Long Count's places: the winal's twenty days by their day signs, the Tzolk'in and the Haab' year, the places as a ladder that turns", () => {
    expect(boards.longCount?.value).toBe('13.0.14.1.10')
    expect(mast(boards.longCount)).toEqual(['13.0.14.1.10', '4 Ok 3 Keh', ['Day 1,877,070 of the count', 'Ok, the Dog', 'Lord of the Night G3']])
    expect(facts(boards.longCount)).toMatchObject({ 'Since creation': '1,877,070 days', "Tzolk'in": '4 Ok, the Dog: day 30 of 260', "Haab'": '3 Keh, Classic Chaksihom: day 224 of 365' })
    expect(boards.longCount?.views?.map((v) => v.tab)).toEqual(['Winal', "Tzolk'in", "Haab'", 'Count'])
    const winal = boards.longCount?.views?.[0]
    expect(shape(winal)).toMatchObject({ layout: 'grid', name: 'The winal', cells: [20] })
    expect(cellsOf(winal).every((c) => c.mark?.kind === 'glyph')).toBe(true)
    expect(cellsOf(winal).findIndex((c) => c.state === 'today')).toBe(10)
    expect(shape(boards.longCount?.views?.[1])).toMatchObject({ cells: [260] })
    expect(shape(boards.longCount?.views?.[2])).toMatchObject({ cells: [365] })
    const places = boards.longCount?.views?.[3]
    expect(cellsOf(places).map((c) => [c.key, c.label?.text])).toEqual([
      ["B'ak'tun", '13'],
      ["K'atun", '0'],
      ['Tun', '14'],
      ['Winal', '1'],
      ["K'in", '10'],
    ])
    expect(eventsIn(places)).toEqual([
      ["B'ak'tun", 'turns Mon 26 Mar 2407'],
      ["K'atun", 'turns Tue 7 Sept 2032'],
      ['Tun', 'turns Mon 4 Oct 2027'],
      ['Winal', 'turns Wed 18 Nov'],
    ])
    expect(next(boards.longCount).map(([name, , inDays]) => [name, inDays])).toEqual([
      ['A new winal', 10],
      ['The trecena of 1 Ajaw begins', 10],
      ['An 819-day station, 1 Chikchan', 75],
      ["Wayeb' begins", 137],
      ["The Haab' new year, borne by 3 Eb'", 142],
      ['A new tun', 330],
      ["A new k'atun", 2130],
      ["A new b'ak'tun", 138930],
    ])
  })

  it('lays the Chinese month in its tens by the Moon in Beijing, the terms on their ring, the turn and the sixty by phase', () => {
    expect(boards.chineseYear?.value).toBe('Yang Fire Horse')
    expect(mast(boards.chineseYear)).toEqual(['丙午', 'Yang Fire Horse', ['Bing Wu', 'Year 43 of 60', 'Day 30 of the ninth month']])
    expect(boards.chineseYear?.mast?.script?.text).toBe('丙午年九月三十')
    expect(facts(boards.chineseYear)).toMatchObject({ 'Lunar date': '九月三十, day 30 of the ninth month', 'Solar term': 'Lidong 立冬, Winter Commences, since 7 Nov' })
    expect(boards.chineseYear?.views?.map((v) => v.id)).toEqual(['month', 'terms', 'turn', 'sixty'])
    const month = boards.chineseYear?.views?.[0]
    expect(month?.sections.map((s) => [s.name, s.columns, s.rowHeads?.map((h) => h.text).join(''), s.cells[0]?.key, s.cells.length])).toEqual([
      ['九月, the ninth month, 30 days', 10, '上旬中旬下旬', '2026-10-10', 30],
      ['十月, the tenth month, 30 days', 10, '上旬中旬下旬', '2026-11-09', 30],
    ])
    expect(cellsOf(month).every((c) => c.mark?.kind === 'moon' && c.tint)).toBe(true)
    expect(todayIn(month)[0]).toMatchObject({ label: { text: '三十', lang: 'zh' } })
    expect(eventsIn(month)).toEqual(expect.arrayContaining([['2026-11-07', 'Lidong 立冬'], ['2026-11-22', 'Xiaoxue 小雪'], ['2026-10-18', 'Double Ninth 重阳节']]))
    const terms = boards.chineseYear?.views?.[1]
    expect(shape(terms)).toMatchObject({ layout: 'ring', cells: [24] })
    expect(todayIn(terms)[0]).toMatchObject({ title: 'Lidong', note: '7 Nov', tint: 'black' })
    expect(shape(boards.chineseYear?.views?.[2])).toEqual({ layout: 'grid', name: 'This turn of the animals', caption: 'Year 43 of 60', cells: [12] })
    const sixty = cellsOf(boards.chineseYear?.views?.[3])
    expect(sixty[0]).toMatchObject({ label: { text: '甲子', lang: 'zh' }, tint: 'green', mark: { kind: 'line', yang: true } })
    expect(next(boards.chineseYear)).toEqual([
      ['十月 begins, the tenth month', '2026-11-09', 1],
      ['Xiaoxue 小雪, Light Snow', '2026-11-22', 14],
      ['Daxue 大雪, Heavy Snow', '2026-12-07', 29],
      ['Laba Festival 腊八节', '2027-01-15', 68],
      ['Yin Fire Goat year begins', '2027-02-06', 90],
    ])
  })

  it('reads the Panchang at sunrise in Ujjain: the tithis by their sunrises, two months of five limbs, the nakshatras by their lords', () => {
    expect(boards.panchang?.value).toBe('Krishna Chaturdashi')
    expect(mast(boards.panchang)).toEqual(['१४', 'Krishna Chaturdashi', ['Tithi 29 of 30', 'Nakshatra Swati', 'Ravivara']])
    expect(facts(boards.panchang)).toMatchObject({ Karana: 'Shakuni', Yoga: 'Ayushman, 3 of 27', Month: 'Ashvin amanta, Kartika purnimanta' })
    expect(boards.panchang?.views?.map((v) => v.id)).toEqual(['tithis', 'months', 'nakshatras'])
    const tithis = boards.panchang?.views?.[0]
    expect(tithis?.sections.map((s) => [s.name, s.cells.length])).toEqual([
      ['Shukla paksha शुक्ल', 15],
      ['Krishna paksha कृष्ण', 15],
    ])
    expect(todayIn(tithis)[0]?.said).toBe('Krishna Chaturdashi, tithi 29 of 30 · the sunrise of Sun 8 Nov')
    const months = boards.panchang?.views?.[1]
    expect(todayIn(months)[0]?.said).toMatch(/^Sun 8 Nov · Krishna Chaturdashi · Swati · Ayushman · Shakuni · Ravivara · Amavasya from 11:2\d IST$/)
    expect(eventsIn(months).filter(([, name]) => name.includes('Ekadashi')).map(([date]) => date)).toEqual(['2026-11-05', '2026-11-20', '2026-12-04', '2026-12-20'])
    const ring = boards.panchang?.views?.[2]
    expect(shape(ring)).toMatchObject({ layout: 'ring', cells: [27] })
    expect(todayIn(ring)[0]).toMatchObject({ title: 'Swati', band: 'rahu' })
    expect(next(boards.panchang).map(([name, date]) => [String(name).replace(/, \d\d:\d\d IST$/, ''), date])).toEqual([
      ['Amavasya begins', '2026-11-08'],
      ['Kartika begins', '2026-11-09'],
      ['Vrishchika Sankranti', '2026-11-16'],
      ['Shukla Ekadashi', '2026-11-20'],
      ['Purnima begins', '2026-11-23'],
      ['Krishna Ekadashi', '2026-12-04'],
    ])
  })
})

/**
 * A row's figure and its board read one value one way (BENTO_V2.md "Rows
 * open their calendar's board"): across three months, and across the Chinese
 * new years whose new Moons fall near a Beijing midnight (2027's on 6
 * February, 2030's on 3 February).
 */
describe('a row and its board', () => {
  const days = [...Array.from({ length: 31 }, (_, i) => shiftDay('2026-11-01', i * 3)), '2027-02-05', '2027-02-06', '2030-02-02', '2030-02-03']

  it.each(days)('agree on %s', (day) => {
    const across = getTodayAcrossSystems(new Date(`${day}T12:00:00Z`))
    const figures = todayFigures(day, across)
    const built = todayBoards(day, across)
    expect(figures.moon?.small, 'moon').toBe(`lit · ${built.moon?.value}`)
    expect(`${figures.sun?.big} ${figures.sun?.small}`, 'sun').toBe(built.sun?.value)
    expect(`${figures.chineseYear?.small} ${figures.chineseYear?.big}`, 'chinese year').toBe(built.chineseYear?.value)
    expect(figures.chineseYear?.cycle?.said, 'chinese cycle').toBe(built.chineseYear?.views?.find((v) => v.id === 'turn')?.caption.toLowerCase())
    expect(built.chineseYear?.value.endsWith(` ${across.chineseYear}`), `chinese row ${across.chineseYear}`).toBe(true)
  })

  it('turns the Chinese year on the day its new Moon is dated in Beijing', () => {
    const on = (day: string) => todayBoards(day, getTodayAcrossSystems(new Date(`${day}T12:00:00Z`))).chineseYear
    expect(on('2027-02-05')?.value).toBe('Yang Fire Horse')
    expect(next(on('2027-02-05'))[0]).toEqual(['Yin Fire Goat year begins', '2027-02-06', 1])
    expect(next(on('2027-02-05')).filter(([, date]) => date === '2027-02-06')).toHaveLength(1)
    expect(on('2027-02-06')?.value).toBe('Yin Fire Goat')
    expect(next(on('2027-02-06'))).toContainEqual(['Yang Earth Monkey year begins', '2028-01-26', 354])
    expect(on('2030-02-02')?.value).toBe('Yin Earth Rooster')
    expect(on('2030-02-03')?.value).toBe('Yang Metal Dog')
  })
})
