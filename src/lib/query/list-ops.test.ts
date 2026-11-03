import { describe, expect, it } from 'vitest'
import { ascendingBy, dropRow, newestBy, patchRow, replaceRow, sortedBy, swap, upsertRow, within } from './list-ops'

interface Row {
  readonly id: string
  readonly name: string
  readonly at: string
}

const rows: readonly Row[] = Object.freeze([
  { id: 'a', name: 'Ada', at: '2026-01-03' },
  { id: 'c', name: 'Cy', at: '2026-01-02' },
  { id: 'e', name: 'Eve', at: '2026-01-01' },
])

const ids = (list: readonly Row[]): string[] => list.map((r) => r.id)

describe('patchRow', () => {
  it('patches one row, keeps the others by identity and leaves its input alone', () => {
    const { data } = patchRow<Row>('c', { name: 'Cyd' })(rows)
    expect(data.map((r) => r.name)).toEqual(['Ada', 'Cyd', 'Eve'])
    expect(data[0]).toBe(rows[0])
    expect(rows[1].name).toBe('Cy')
  })

  it('undoes its own patch, recognising it by value', () => {
    const guess = patchRow<Row>('c', { name: 'Cyd' })(rows)
    expect(guess.undo(guess.data)[1]).toBe(rows[1])
    const copied = guess.data.map((row) => ({ ...row }))
    expect(guess.undo(copied)[1]).toBe(rows[1])
  })

  it('leaves a row another edit has since replaced', () => {
    const guess = patchRow<Row>('c', { name: 'Cyd' })(rows)
    const later = patchRow<Row>('c', { name: 'Cee' })(guess.data).data
    expect(guess.undo(later)[1].name).toBe('Cee')
  })

  it('does nothing for an unknown id', () => {
    const guess = patchRow<Row>('zz', { name: 'Z' })(rows)
    expect(guess.data).toBe(rows)
    expect(guess.undo(rows)).toBe(rows)
  })
})

describe('dropRow', () => {
  it('drops the row and puts it back where it was', () => {
    const guess = dropRow<Row>('c')(rows)
    expect(ids(guess.data)).toEqual(['a', 'e'])
    expect(ids(guess.undo(guess.data))).toEqual(['a', 'c', 'e'])
  })

  it('keeps another edit when undoing', () => {
    const guess = dropRow<Row>('c')(rows)
    const later = dropRow<Row>('a')(guess.data).data
    expect(ids(guess.undo(later))).toEqual(['c', 'e'])
  })

  it('does not double a row that came back another way', () => {
    const guess = dropRow<Row>('c')(rows)
    const back = upsertRow<Row>(rows[1])(guess.data)
    expect(ids(guess.undo(back))).toEqual(['a', 'e', 'c'])
  })
})

describe('swap', () => {
  it('replaces a record and restores it only while the guess is cached', () => {
    const before = { on: false }
    const next = { on: true }
    const guess = swap(next)(before)
    expect(guess.data).toBe(next)
    expect(guess.undo(next)).toBe(before)
    expect(guess.undo({ on: true })).toBe(before)
    const later = { on: false, hour: 9 }
    expect(guess.undo(later)).toBe(later)
  })
})

describe('replaceRow', () => {
  it('replaces a listed row and leaves out a row no longer listed', () => {
    expect(replaceRow<Row>({ id: 'c', name: 'Cyd', at: '2026-01-05' })(rows).map((r) => r.name)).toEqual(['Ada', 'Cyd', 'Eve'])
    expect(replaceRow<Row>({ id: 'gone', name: 'Ghost', at: '2026-01-05' })(rows)).toEqual(rows)
  })
})

describe('upsertRow', () => {
  it('replaces a listed row in place and appends a new one', () => {
    expect(upsertRow<Row>({ id: 'c', name: 'Cyd', at: '2026-01-05' })(rows).map((r) => r.name)).toEqual(['Ada', 'Cyd', 'Eve'])
    expect(ids(upsertRow<Row>({ id: 'n', name: 'Ned', at: '2026-01-09' })(rows))).toEqual(['a', 'c', 'e', 'n'])
  })
})

describe('within', () => {
  interface Whole {
    readonly rows: readonly Row[]
    readonly tags: readonly string[]
  }
  const inRows = within<Whole, readonly Row[]>(
    (w) => w.rows,
    (w, r) => ({ ...w, rows: r }),
  )

  it('edits one field and undoes it there, keeping the rest', () => {
    const whole: Whole = { rows, tags: ['x'] }
    const guess = inRows(dropRow<Row>('a'))(whole)
    expect(ids(guess.data.rows)).toEqual(['c', 'e'])
    expect(guess.data.tags).toBe(whole.tags)
    const retagged = { ...guess.data, tags: ['y'] }
    const undone = guess.undo(retagged)
    expect(ids(undone.rows)).toEqual(['a', 'c', 'e'])
    expect(undone.tags).toEqual(['y'])
  })
})

describe('order', () => {
  it('sorts by name, newest first, and breaks ties by id', () => {
    const tied: Row[] = [
      { id: 'b', name: 'Bo', at: '2026-01-01' },
      { id: 'a', name: 'Bo', at: '2026-01-01' },
      { id: 'c', name: 'Al', at: '2026-01-02' },
    ]
    expect(ids(sortedBy(ascendingBy<Row>((r) => r.name))(tied))).toEqual(['c', 'a', 'b'])
    expect(ids(sortedBy(newestBy<Row>((r) => r.at))(tied))).toEqual(['c', 'a', 'b'])
    expect(ids(tied)).toEqual(['b', 'a', 'c'])
  })
})
