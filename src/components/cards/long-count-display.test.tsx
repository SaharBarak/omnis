import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import {
  LongCountDisplay,
  LongCountMini,
  BaktunProgress,
  HaabDisplay,
  CalendarRoundDisplay,
} from './LongCountDisplay'

vi.mock('next/image', () => ({
  default: function MockImage({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string
    alt: string
    width: number
    height: number
    className?: string
    loading?: 'lazy' | 'eager'
  }) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        data-testid="seal-icon"
      />
    )
  },
}))

// Test date: July 26, 1987 (Dreamspell epoch)
const EPOCH_DATE = '1987-07-26'
// Test date: December 21, 2012 (end of Baktun 13)
const BAKTUN_13_END = '2012-12-21'
// A recent date for testing
const RECENT_DATE = '2024-01-15'

describe('LongCountDisplay Components', () => {
  describe('LongCountDisplay', () => {
    it('renders header', () => {
      render(<LongCountDisplay dateStr={EPOCH_DATE} />)
      expect(screen.getByText(/Long Count Date/)).toBeInTheDocument()
    })

    it('displays formatted Long Count string', () => {
      render(<LongCountDisplay dateStr={BAKTUN_13_END} />)
      // 2012-12-21 is 13.0.0.0.0 in Long Count
      expect(screen.getByText(/13\.0\.0\.0\.0/)).toBeInTheDocument()
    })

    it('shows unit labels when showLabels is true (default)', () => {
      render(<LongCountDisplay dateStr={EPOCH_DATE} />)
      expect(screen.getByText("B'ak'tun")).toBeInTheDocument()
      expect(screen.getByText("K'atun")).toBeInTheDocument()
      expect(screen.getByText('Tun')).toBeInTheDocument()
      expect(screen.getByText('Winal')).toBeInTheDocument()
      expect(screen.getByText("K'in")).toBeInTheDocument()
    })

    it('does not render Hebrew unit names', () => {
      const { container } = render(<LongCountDisplay dateStr={EPOCH_DATE} compact={false} />)
      expect(container.textContent).not.toMatch(/[֐-׿]/)
    })

    it('displays days since creation when showDaysSinceCreation is true (default)', () => {
      render(<LongCountDisplay dateStr={EPOCH_DATE} />)
      expect(screen.getByText(/days since creation/)).toBeInTheDocument()
    })

    it('hides days since creation when showDaysSinceCreation is false', () => {
      render(<LongCountDisplay dateStr={EPOCH_DATE} showDaysSinceCreation={false} />)
      expect(screen.queryByText(/days since creation/)).not.toBeInTheDocument()
    })

    it('shows Calendar Round section when showCalendarRound is true (default)', () => {
      render(<LongCountDisplay dateStr={EPOCH_DATE} />)
      expect(screen.getByText(/Calendar Round/)).toBeInTheDocument()
    })

    it('hides Calendar Round section when showCalendarRound is false', () => {
      render(<LongCountDisplay dateStr={EPOCH_DATE} showCalendarRound={false} />)
      // Only one occurrence (in header), not the section
      const calendarRoundTexts = screen.queryAllByText(/Calendar Round/)
      expect(calendarRoundTexts.length).toBeLessThanOrEqual(1)
    })

    it('hides labels when showLabels is false', () => {
      render(<LongCountDisplay dateStr={EPOCH_DATE} showLabels={false} />)
      expect(screen.queryByText("B'ak'tun")).not.toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(<LongCountDisplay dateStr={EPOCH_DATE} className="custom-class" />)
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('LongCountMini', () => {
    it('renders formatted Long Count inline', () => {
      render(<LongCountMini dateStr={BAKTUN_13_END} />)
      expect(screen.getByText(/13\.0\.0\.0\.0/)).toBeInTheDocument()
    })

    it('renders as inline-flex', () => {
      const { container } = render(<LongCountMini dateStr={EPOCH_DATE} />)
      expect(container.firstChild).toHaveClass('inline-flex')
    })

    it('applies custom className', () => {
      const { container } = render(<LongCountMini dateStr={EPOCH_DATE} className="custom-mini" />)
      expect(container.firstChild).toHaveClass('custom-mini')
    })

    it('displays monospace text', () => {
      const { container } = render(<LongCountMini dateStr={EPOCH_DATE} />)
      const textEl = container.querySelector('.font-mono')
      expect(textEl).toBeInTheDocument()
    })
  })

  describe('BaktunProgress', () => {
    it('shows current baktun number', () => {
      render(<BaktunProgress dateStr={RECENT_DATE} />)
      expect(screen.getByText(/Baktun \d+/)).toBeInTheDocument()
    })

    it('displays percentage', () => {
      render(<BaktunProgress dateStr={RECENT_DATE} />)
      expect(screen.getByText(/%/)).toBeInTheDocument()
    })

    it('shows day count out of 144,000', () => {
      render(<BaktunProgress dateStr={RECENT_DATE} />)
      expect(screen.getByText(/\/ 144,000 days/)).toBeInTheDocument()
    })

    it('renders progress bar', () => {
      const { container } = render(<BaktunProgress dateStr={RECENT_DATE} />)
      const progressBar = container.querySelector('.bg-primary')
      expect(progressBar).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(<BaktunProgress dateStr={EPOCH_DATE} className="progress-custom" />)
      expect(container.firstChild).toHaveClass('progress-custom')
    })

    it('has rounded progress bar container', () => {
      const { container } = render(<BaktunProgress dateStr={EPOCH_DATE} />)
      const progressContainer = container.querySelector('.rounded-full')
      expect(progressContainer).toBeInTheDocument()
    })
  })

  describe('HaabDisplay', () => {
    it('renders Haab header', () => {
      render(<HaabDisplay dateStr={EPOCH_DATE} />)
      expect(screen.getByText(/Haab/)).toBeInTheDocument()
    })

    it('displays Haab day and month name', () => {
      const { container } = render(<HaabDisplay dateStr={EPOCH_DATE} />)
      // Should contain day number and month information
      expect(container.textContent).toMatch(/\d+/)
    })

    it('does not render Hebrew month name', () => {
      const { container } = render(<HaabDisplay dateStr={EPOCH_DATE} />)
      expect(container.textContent).not.toMatch(/[֐-׿]/)
    })

    it('shows month index when showMonthIndex is true', () => {
      render(<HaabDisplay dateStr={EPOCH_DATE} showMonthIndex={true} />)
      expect(screen.getByText(/Month \d+/)).toBeInTheDocument()
    })

    it('hides month index by default', () => {
      render(<HaabDisplay dateStr={EPOCH_DATE} />)
      expect(screen.queryByText(/Month \d+/)).not.toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(<HaabDisplay dateStr={EPOCH_DATE} className="haab-custom" />)
      expect(container.firstChild).toHaveClass('haab-custom')
    })
  })

  describe('CalendarRoundDisplay', () => {
    it('renders Calendar Round header', () => {
      render(<CalendarRoundDisplay dateStr={EPOCH_DATE} />)
      expect(screen.getByText(/Calendar Round/)).toBeInTheDocument()
    })

    it('displays Tzolkin section', () => {
      render(<CalendarRoundDisplay dateStr={EPOCH_DATE} />)
      expect(screen.getByText(/Tzolk'in/)).toBeInTheDocument()
    })

    it('displays Haab section', () => {
      render(<CalendarRoundDisplay dateStr={EPOCH_DATE} />)
      expect(screen.getByText(/Haab'/)).toBeInTheDocument()
    })

    it('shows combined format at bottom', () => {
      const { container } = render(<CalendarRoundDisplay dateStr={EPOCH_DATE} />)
      // The combined format should include tone + day sign + haab date
      expect(container.textContent).toMatch(/\d+/)
    })

    it('has two-column grid layout', () => {
      const { container } = render(<CalendarRoundDisplay dateStr={EPOCH_DATE} />)
      const grid = container.querySelector('.grid-cols-2')
      expect(grid).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(<CalendarRoundDisplay dateStr={EPOCH_DATE} className="cr-custom" />)
      expect(container.firstChild).toHaveClass('cr-custom')
    })
  })

  describe('Long Count Validation Tests', () => {
    it('Baktun 13 end date (2012-12-21) is 13.0.0.0.0', () => {
      render(<LongCountMini dateStr="2012-12-21" />)
      expect(screen.getByText(/13\.0\.0\.0\.0/)).toBeInTheDocument()
    })

    it('handles dates before Baktun 13', () => {
      render(<LongCountMini dateStr="1987-07-26" />)
      // Epoch should be around 12.18.x.x.x
      const text = screen.getByText(/12\.\d+\.\d+\.\d+\.\d+/)
      expect(text).toBeInTheDocument()
    })

    it('handles dates after Baktun 13', () => {
      render(<LongCountMini dateStr="2024-01-15" />)
      // Should be in Baktun 13
      expect(screen.getByText(/13\.\d+\.\d+\.\d+\.\d+/)).toBeInTheDocument()
    })

    it('days since creation is a positive number', () => {
      const { container } = render(<LongCountDisplay dateStr={EPOCH_DATE} />)
      const daysText = container.textContent || ''
      // Extract the number from "X days since creation"
      const match = daysText.match(/([\d,]+)\s*days since creation/)
      expect(match).toBeTruthy()
      if (match) {
        const days = parseInt(match[1].replace(/,/g, ''), 10)
        expect(days).toBeGreaterThan(0)
      }
    })

    it('BaktunProgress shows valid percentage', () => {
      // Test that BaktunProgress renders with percentage display
      const { container } = render(<BaktunProgress dateStr="2024-01-15" />)

      // Find the progress bar element (the inner div with bg-primary class)
      const progressBar = container.querySelector('.bg-primary')
      expect(progressBar).toBeInTheDocument()

      // Check that the progress bar has a valid width style (0-100%)
      const style = progressBar?.getAttribute('style')
      expect(style).toContain('width:')

      // Verify the days display shows "/ 144,000 days"
      expect(container.textContent).toContain('/ 144,000 days')
    })
  })

  describe('Edge Cases', () => {
    it('handles January 1st dates', () => {
      render(<LongCountDisplay dateStr="2024-01-01" />)
      expect(screen.getByText(/Long Count Date/)).toBeInTheDocument()
    })

    it('handles December 31st dates', () => {
      render(<LongCountDisplay dateStr="2024-12-31" />)
      expect(screen.getByText(/Long Count Date/)).toBeInTheDocument()
    })

    it('handles leap year dates', () => {
      render(<LongCountDisplay dateStr="2024-02-29" />)
      expect(screen.getByText(/Long Count Date/)).toBeInTheDocument()
    })

    it('handles all props disabled', () => {
      render(
        <LongCountDisplay
          dateStr={EPOCH_DATE}
          showLabels={false}
          showDaysSinceCreation={false}
          showCalendarRound={false}
          compact={true}
        />
      )
      // Should still show the main formatted Long Count
      expect(screen.getByText(/\d+\.\d+\.\d+\.\d+\.\d+/)).toBeInTheDocument()
    })
  })
})
