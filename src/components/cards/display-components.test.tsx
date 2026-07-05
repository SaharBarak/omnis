import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { WavespellDisplay, WavespellMini, WavespellProgress } from './WavespellDisplay'
import { CastleDisplay, CastleMini } from './CastleDisplay'
import { DreamspellYearDisplay, GalacticBirthdayDisplay, PersonalYearDisplay } from './YearlyDisplay'
import { asKin } from '@/core/types'

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

describe('WavespellDisplay Components', () => {
  describe('WavespellDisplay', () => {
    it('renders wavespell header with seal name', () => {
      render(<WavespellDisplay kin={asKin(34)} />)
      expect(screen.getByText(/Wavespell/)).toBeInTheDocument()
    })

    it('displays all 13 positions in wavespell', () => {
      render(<WavespellDisplay kin={asKin(34)} />)
      const icons = screen.getAllByTestId('seal-icon')
      expect(icons.length).toBe(13)
    })

    it('shows wavespell kin range', () => {
      render(<WavespellDisplay kin={asKin(1)} />)
      expect(screen.getByText(/Kin 1-13/)).toBeInTheDocument()
    })

    it('highlights current position when highlightCurrent is true', () => {
      const { container } = render(<WavespellDisplay kin={asKin(34)} highlightCurrent={true} />)
      expect(screen.getByText(/You are here/)).toBeInTheDocument()
    })

    it('shows position labels when showLabels is true', () => {
      render(<WavespellDisplay kin={asKin(1)} showLabels={true} />)
      expect(screen.getByText('Magnetic')).toBeInTheDocument()
    })

    it('hides labels in compact mode', () => {
      render(<WavespellDisplay kin={asKin(1)} compact={true} showLabels={false} />)
      const magneticText = screen.queryByText('Magnetic')
      expect(magneticText).not.toBeInTheDocument()
    })

    it('displays Mayan seal name in wavespell header', () => {
      const { container } = render(<WavespellDisplay kin={asKin(34)} />)
      // Kin 34 sits in the Hand wavespell (seal 7, Mayan name Manik)
      expect(container.textContent).toMatch(/\(Manik\)/)
      expect(container.textContent).not.toMatch(/[֐-׿]/)
    })
  })

  describe('WavespellMini', () => {
    it('renders seal icon', () => {
      render(<WavespellMini kin={asKin(34)} />)
      expect(screen.getByTestId('seal-icon')).toBeInTheDocument()
    })

    it('shows position as X/13', () => {
      render(<WavespellMini kin={asKin(1)} />)
      expect(screen.getByText(/\/13/)).toBeInTheDocument()
    })

    it('displays role', () => {
      render(<WavespellMini kin={asKin(1)} />)
      expect(screen.getByText(/Purpose|Set|Activate|Define|Command|Balance|Attune|Model|Solar|Manifest|Free|Cooperate|Transcend/i)).toBeInTheDocument()
    })
  })

  describe('WavespellProgress', () => {
    it('shows start and end kin', () => {
      const { container } = render(<WavespellProgress kin={asKin(1)} />)
      const spans = container.querySelectorAll('span')
      const kinTexts = Array.from(spans).map(s => s.textContent).join(' ')
      expect(kinTexts).toMatch(/Kin\s*1/)
      expect(kinTexts).toMatch(/Kin\s*13/)
    })

    it('displays day count', () => {
      render(<WavespellProgress kin={asKin(1)} />)
      expect(screen.getByText(/Day 1 of 13/)).toBeInTheDocument()
    })

    it('renders progress bar', () => {
      const { container } = render(<WavespellProgress kin={asKin(7)} />)
      const progressBar = container.querySelector('.bg-primary')
      expect(progressBar).toBeInTheDocument()
    })
  })
})

describe('CastleDisplay Components', () => {
  describe('CastleDisplay', () => {
    it('renders castle name', () => {
      render(<CastleDisplay kin={asKin(1)} />)
      expect(screen.getByText(/Castle of Turning|Castle of Burning/)).toBeInTheDocument()
    })

    it('does not render Hebrew castle name', () => {
      const { container } = render(<CastleDisplay kin={asKin(1)} />)
      expect(container.textContent).not.toMatch(/[֐-׿]/)
    })

    it('displays current kin position in castle', () => {
      render(<CastleDisplay kin={asKin(1)} />)
      expect(screen.getByText(/Day/)).toBeInTheDocument()
      expect(screen.getByText(/of 52/)).toBeInTheDocument()
    })

    it('shows all 5 castles when showAllCastles is true', () => {
      render(<CastleDisplay kin={asKin(1)} showAllCastles={true} />)
      expect(screen.getByText('Castle of Turning')).toBeInTheDocument()
      expect(screen.getByText('Castle of Crossing')).toBeInTheDocument()
      expect(screen.getByText('Castle of Burning')).toBeInTheDocument()
      expect(screen.getByText('Castle of Giving')).toBeInTheDocument()
      expect(screen.getByText('Castle of Enchantment')).toBeInTheDocument()
    })

    it('displays five castles header when showAllCastles is true', () => {
      render(<CastleDisplay kin={asKin(1)} showAllCastles={true} />)
      expect(screen.getByText(/The Five Castles/)).toBeInTheDocument()
    })

    it('shows wavespell numbers in detailed view', () => {
      render(<CastleDisplay kin={asKin(1)} showAllCastles={false} />)
      expect(screen.getByText(/Wavespells/)).toBeInTheDocument()
    })

    it('highlights current castle when showing all', () => {
      render(<CastleDisplay kin={asKin(1)} showAllCastles={true} />)
      expect(screen.getByText(/You are here/)).toBeInTheDocument()
    })
  })

  describe('CastleMini', () => {
    it('renders castle name', () => {
      render(<CastleMini kin={asKin(1)} />)
      expect(screen.getByText(/Castle of Turning/)).toBeInTheDocument()
    })

    it('shows position as X/52', () => {
      render(<CastleMini kin={asKin(1)} />)
      expect(screen.getByText(/\/52/)).toBeInTheDocument()
    })

    it('shows color indicator', () => {
      const { container } = render(<CastleMini kin={asKin(1)} />)
      const colorDot = container.querySelector('.rounded-full')
      expect(colorDot).toBeInTheDocument()
    })
  })
})

describe('YearlyDisplay Components', () => {
  describe('DreamspellYearDisplay', () => {
    it('renders year header', () => {
      render(<DreamspellYearDisplay year={2024} />)
      expect(screen.getByText(/Dreamspell Year/)).toBeInTheDocument()
    })

    it('does not render Hebrew text', () => {
      const { container } = render(<DreamspellYearDisplay year={2024} />)
      expect(container.textContent).not.toMatch(/[֐-׿]/)
    })

    it('displays year bearer seal', () => {
      render(<DreamspellYearDisplay year={2024} />)
      expect(screen.getByTestId('seal-icon')).toBeInTheDocument()
    })

    it('shows year bearer kin number', () => {
      render(<DreamspellYearDisplay year={2024} />)
      expect(screen.getByText(/Kin \d+/)).toBeInTheDocument()
    })

    it('displays date range', () => {
      render(<DreamspellYearDisplay year={2024} />)
      expect(screen.getByText(/\d{4}-\d{2}-\d{2}/)).toBeInTheDocument()
    })
  })

  describe('GalacticBirthdayDisplay', () => {
    it('renders galactic birthday header', () => {
      render(<GalacticBirthdayDisplay birthDate="1987-07-26" targetYear={2024} />)
      expect(screen.getByText(/Galactic Birthday/)).toBeInTheDocument()
    })

    it('does not render Hebrew text', () => {
      const { container } = render(<GalacticBirthdayDisplay birthDate="1987-07-26" targetYear={2024} />)
      expect(container.textContent).not.toMatch(/[֐-׿]/)
    })

    it('displays seal icon', () => {
      render(<GalacticBirthdayDisplay birthDate="1987-07-26" targetYear={2024} />)
      expect(screen.getByTestId('seal-icon')).toBeInTheDocument()
    })

    it('shows kin number', () => {
      render(<GalacticBirthdayDisplay birthDate="1987-07-26" targetYear={2024} />)
      expect(screen.getByText(/Kin \d+/)).toBeInTheDocument()
    })

    it('shows date for galactic birthday', () => {
      render(<GalacticBirthdayDisplay birthDate="1987-07-26" targetYear={2024} />)
      expect(screen.getByText(/Date:/)).toBeInTheDocument()
    })
  })

  describe('PersonalYearDisplay', () => {
    it('renders personal year header', () => {
      render(<PersonalYearDisplay birthDate="1987-07-26" currentDate="2024-01-15" />)
      expect(screen.getByText(/Personal Year/)).toBeInTheDocument()
    })

    it('does not render Hebrew text', () => {
      const { container } = render(<PersonalYearDisplay birthDate="1987-07-26" currentDate="2024-01-15" />)
      expect(container.textContent).not.toMatch(/[֐-׿]/)
    })

    it('displays seal icon', () => {
      render(<PersonalYearDisplay birthDate="1987-07-26" currentDate="2024-01-15" />)
      expect(screen.getByTestId('seal-icon')).toBeInTheDocument()
    })

    it('shows age', () => {
      render(<PersonalYearDisplay birthDate="1987-07-26" currentDate="2024-01-15" />)
      expect(screen.getByText(/Age \d+/)).toBeInTheDocument()
    })

    it('displays 13-year cycle information', () => {
      render(<PersonalYearDisplay birthDate="1987-07-26" currentDate="2024-01-15" />)
      expect(screen.getByText(/13-Year Cycle/)).toBeInTheDocument()
      expect(screen.getByText(/Year \d+ of 13/)).toBeInTheDocument()
    })

    it('shows complete cycles count', () => {
      render(<PersonalYearDisplay birthDate="1987-07-26" currentDate="2024-01-15" />)
      expect(screen.getByText(/Complete Cycles/)).toBeInTheDocument()
    })

    it('displays progress bar', () => {
      const { container } = render(<PersonalYearDisplay birthDate="1987-07-26" currentDate="2024-01-15" />)
      const progressBar = container.querySelector('.bg-primary')
      expect(progressBar).toBeInTheDocument()
    })
  })
})

describe('Display Component Integration', () => {
  describe('Validation dates', () => {
    it('epoch date (1987-07-26) calculates correct wavespell', () => {
      render(<WavespellDisplay kin={asKin(34)} />)
      expect(screen.getByText(/Kin 27-39/)).toBeInTheDocument()
    })

    it('epoch date shows correct castle (Red Castle)', () => {
      render(<CastleDisplay kin={asKin(34)} />)
      expect(screen.getByText('Castle of Turning')).toBeInTheDocument()
    })
  })

  describe('Kin boundary tests', () => {
    it('Kin 1 is first day of first wavespell', () => {
      render(<WavespellMini kin={asKin(1)} />)
      expect(screen.getByText(/1\/13/)).toBeInTheDocument()
    })

    it('Kin 260 is in last castle', () => {
      render(<CastleMini kin={asKin(260)} />)
      expect(screen.getByText(/Castle of Enchantment/)).toBeInTheDocument()
    })

    it('Kin 53 is first kin of White Castle', () => {
      render(<CastleDisplay kin={asKin(53)} />)
      expect(screen.getByText('Castle of Crossing')).toBeInTheDocument()
    })
  })
})
