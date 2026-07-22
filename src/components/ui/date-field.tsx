'use client'

/**
 * DateField — segmented day / month / year birth-date input.
 *
 * Replaces `<input type="date">` on the marketing calculators: the native
 * control opens an OS calendar popup that ignores the dark v2 idiom and
 * varies per platform. Three numeric segments stay keyboard-first (type,
 * auto-advance, Backspace to go back, ArrowUp/Down to step) and validate
 * real calendar dates (leap years included) without ever constructing a
 * Date from a string — parsing stays pure arithmetic, so it is UTC-safe.
 *
 * Emits the same value shape the pages already use: `'YYYY-MM-DD'` when
 * the date is complete and real, `''` otherwise. Page-level submit
 * validation ("Enter a birth date first.") keeps working unchanged.
 */

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface DateFieldProps {
  readonly id?: string
  /** `''` or `'YYYY-MM-DD'` — mirrors what `<input type="date">` emitted. */
  readonly value: string
  readonly onChange: (value: string) => void
  readonly className?: string
  /** Announced group name for screen readers. Defaults to "Birth date". */
  readonly label?: string
}

type SegmentKey = 'day' | 'month' | 'year'

interface Segments {
  readonly day: string
  readonly month: string
  readonly year: string
}

const EMPTY: Segments = { day: '', month: '', year: '' }

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function daysInMonth(month: number, year: number): number {
  const lengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return lengths[month - 1] ?? 31
}

/** All three segments have enough digits to be judged. */
function isComplete(s: Segments): boolean {
  return s.day.length >= 1 && s.month.length >= 1 && s.year.length === 4
}

/** A complete segment set that names a real calendar date. */
function isRealDate(s: Segments): boolean {
  const day = Number(s.day)
  const month = Number(s.month)
  const year = Number(s.year)
  if (year < 1000) return false
  if (month < 1 || month > 12) return false
  return day >= 1 && day <= daysInMonth(month, year)
}

function toIso(s: Segments): string {
  return `${s.year}-${s.month.padStart(2, '0')}-${s.day.padStart(2, '0')}`
}

function fromIso(value: string): Segments {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return EMPTY
  return { year: match[1], month: match[2], day: match[3] }
}

const SEGMENT_ORDER: readonly SegmentKey[] = ['day', 'month', 'year']

const SEGMENT_META: Record<
  SegmentKey,
  { placeholder: string; maxLength: number; ariaLabel: string; autoComplete: string }
> = {
  day: { placeholder: 'DD', maxLength: 2, ariaLabel: 'Day', autoComplete: 'bday-day' },
  month: { placeholder: 'MM', maxLength: 2, ariaLabel: 'Month', autoComplete: 'bday-month' },
  year: { placeholder: 'YYYY', maxLength: 4, ariaLabel: 'Year', autoComplete: 'bday-year' },
}

/** Typing this digit already rules out any longer valid entry — jump ahead. */
function fillsSegment(key: SegmentKey, digits: string): boolean {
  if (digits.length >= SEGMENT_META[key].maxLength) return true
  if (key === 'day') return digits.length === 1 && Number(digits) > 3
  if (key === 'month') return digits.length === 1 && Number(digits) > 1
  return false
}

export function DateField({ id, value, onChange, className, label = 'Birth date' }: DateFieldProps) {
  const [segments, setSegments] = useState<Segments>(() => fromIso(value))
  const lastEmitted = useRef(value)
  const inputRefs = useRef<Record<SegmentKey, HTMLInputElement | null>>({
    day: null,
    month: null,
    year: null,
  })

  // Adopt external resets/prefills (e.g. "Calculate another" clearing the
  // form) without clobbering in-progress typing: only re-seed when the prop
  // moves away from what this field last reported.
  useEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value
      setSegments(fromIso(value))
    }
  }, [value])

  const emit = (next: Segments) => {
    const iso = isComplete(next) && isRealDate(next) ? toIso(next) : ''
    if (iso !== lastEmitted.current) {
      lastEmitted.current = iso
      onChange(iso)
    }
  }

  const setSegment = (key: SegmentKey, raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, SEGMENT_META[key].maxLength)
    const next = { ...segments, [key]: digits }
    setSegments(next)
    emit(next)
    if (digits.length > 0 && fillsSegment(key, digits)) {
      const at = SEGMENT_ORDER.indexOf(key)
      const nextKey = SEGMENT_ORDER[at + 1]
      if (nextKey) inputRefs.current[nextKey]?.focus()
    }
  }

  const stepSegment = (key: SegmentKey, delta: number) => {
    const bounds: Record<SegmentKey, { min: number; max: number }> = {
      day: { min: 1, max: 31 },
      month: { min: 1, max: 12 },
      year: { min: 1, max: 9999 },
    }
    const { min, max } = bounds[key]
    const current = Number(segments[key]) || (delta > 0 ? min - 1 : min + 1)
    const stepped = Math.min(max, Math.max(min, current + delta))
    const padded = String(stepped).padStart(key === 'year' ? 4 : 2, '0')
    const next = { ...segments, [key]: key === 'year' ? String(stepped) : padded }
    setSegments(next)
    emit(next)
  }

  const handleKeyDown = (key: SegmentKey) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    const at = SEGMENT_ORDER.indexOf(key)
    if (e.key === 'Backspace' && segments[key] === '' && at > 0) {
      e.preventDefault()
      inputRefs.current[SEGMENT_ORDER[at - 1]]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      stepSegment(key, 1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      stepSegment(key, -1)
    }
  }

  const invalid = isComplete(segments) && !isRealDate(segments)

  return (
    <div className={className}>
      <div
        role="group"
        aria-label={label}
        className={cn(
          'flex h-12 items-center rounded-xl border bg-white/[0.04] px-3 transition-colors',
          invalid
            ? 'border-red-400/60'
            : 'border-white/15 focus-within:border-white/35'
        )}
      >
        {SEGMENT_ORDER.map((key, i) => {
          const meta = SEGMENT_META[key]
          return (
            <span key={key} className="flex items-center">
              {i > 0 && (
                <span aria-hidden className="px-1.5 text-white/25">
                  /
                </span>
              )}
              <input
                ref={(el) => {
                  inputRefs.current[key] = el
                }}
                id={i === 0 ? id : undefined}
                type="text"
                inputMode="numeric"
                autoComplete={meta.autoComplete}
                placeholder={meta.placeholder}
                aria-label={meta.ariaLabel}
                aria-invalid={invalid || undefined}
                maxLength={meta.maxLength}
                value={segments[key]}
                onChange={(e) => setSegment(key, e.target.value)}
                onKeyDown={handleKeyDown(key)}
                onFocus={(e) => e.target.select()}
                className={cn(
                  'bg-transparent text-center text-base text-white placeholder:text-white/30',
                  'focus:outline-none',
                  key === 'year' ? 'w-14' : 'w-8'
                )}
              />
            </span>
          )
        })}
      </div>
      {invalid && (
        <p className="mt-1.5 text-xs text-red-400/90">
          That date doesn&apos;t exist: check the day and month.
        </p>
      )}
    </div>
  )
}
