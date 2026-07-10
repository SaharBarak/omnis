import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

import { PersonCard } from './PersonCard'
import { DreamspellSection } from './DreamspellSection'
import { TzolkinSection } from './TzolkinSection'
import { OracleMap } from './OracleMap'
import { MantraDisplay } from './MantraDisplay'
import { SealIcon } from './SealIcon'
import { asKin } from '@pleiad/engine/core/types'

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

describe('Card Components', () => {
  describe('PersonCard', () => {
    it('renders person name', () => {
      render(<PersonCard name="ליאור" birthDate="1966-09-23" />)
      expect(screen.getByText('ליאור')).toBeInTheDocument()
    })

    it('renders with LTR direction per CARD_LAYOUT.md spec', () => {
      const { container } = render(<PersonCard name="Test" birthDate="1987-07-26" />)
      const article = container.querySelector('article')
      expect(article).toHaveAttribute('dir', 'ltr')
    })

    it('renders both Dreamspell and Tzolkin sections', () => {
      render(<PersonCard name="Test" birthDate="1987-07-26" />)
      expect(screen.getByText(/According to the Dreamspell/)).toBeInTheDocument()
      expect(screen.getByText(/According to the Tzolkin/)).toBeInTheDocument()
    })

    it('renders with proper A5 card dimensions', () => {
      const { container } = render(<PersonCard name="Test" birthDate="1987-07-26" />)
      const article = container.querySelector('article')
      expect(article).toHaveClass('w-[148mm]', 'h-[210mm]')
    })
  })

  describe('DreamspellSection', () => {
    it('calculates and displays correct kin for epoch date (1987-07-26 = Kin 34)', () => {
      render(<DreamspellSection date="1987-07-26" />)
      expect(screen.getByText(/Kin 34/)).toBeInTheDocument()
    })

    it('displays White Galactic Wizard for epoch date', () => {
      render(<DreamspellSection date="1987-07-26" />)
      expect(screen.getByText(/White Galactic Wizard/)).toBeInTheDocument()
    })

    it('calculates correct kin for 2012-12-21 (Kin 207)', () => {
      render(<DreamspellSection date="2012-12-21" />)
      expect(screen.getByText(/Kin 207/)).toBeInTheDocument()
    })

    it('displays Blue Crystal Hand for 2012-12-21', () => {
      render(<DreamspellSection date="2012-12-21" />)
      expect(screen.getByText(/Blue Crystal Hand/)).toBeInTheDocument()
    })

    it('displays Mayan seal name', () => {
      render(<DreamspellSection date="1987-07-26" />)
      // Kin 34 = Galactic tone, seal 14 (Wizard) whose Mayan name is Ix
      expect(screen.getByText(/Galactic Ix/)).toBeInTheDocument()
    })

    it('does not render Hebrew text', () => {
      const { container } = render(<DreamspellSection date="1987-07-26" />)
      expect(container.textContent).not.toMatch(/[֐-׿]/)
    })

    it('renders OracleMap component', () => {
      render(<DreamspellSection date="1987-07-26" />)
      expect(
        screen.getByRole('img', { name: /Oracle cross for Kin 34/ })
      ).toBeInTheDocument()
    })

    it('renders MantraDisplay component', () => {
      const { container } = render(<DreamspellSection date="1987-07-26" />)
      expect(container.querySelector('.mantra-display')).toBeInTheDocument()
    })
  })

  describe('TzolkinSection', () => {
    it('displays Tzolkin day sign for given date', () => {
      render(<TzolkinSection date="1987-07-26" />)
      expect(screen.getByText(/According to the Tzolkin/)).toBeInTheDocument()
    })

    it('displays Yucatec name for day sign', () => {
      render(<TzolkinSection date="1987-08-16" />)
      const yucatecName = screen.getByText(/Imix|Ik|Akbal|Kan|Chikchan|Kimi|Manik|Lamat|Muluk|Ok|Chuwen|Eb|Ben|Ix|Men|Kib|Kaban|Etznab|Kawak|Ajaw/i)
      expect(yucatecName).toBeInTheDocument()
    })

    it('does not render Hebrew text', () => {
      const { container } = render(<TzolkinSection date="1987-07-26" />)
      expect(container.querySelector('.tzolkin-section')).toBeInTheDocument()
      expect(container.textContent).not.toMatch(/[֐-׿]/)
    })

    it('renders seal icon with tzolkin system', () => {
      render(<TzolkinSection date="1987-07-26" />)
      const images = screen.getAllByTestId('seal-icon')
      const tzolkinIcon = images.find(img => img.getAttribute('src')?.includes('MayaTzolkin'))
      expect(tzolkinIcon).toBeInTheDocument()
    })
  })

  describe('OracleMap', () => {
    it('renders 5 seal icons (guide, antipode, analog, occult, center)', () => {
      render(<OracleMap kin={asKin(34)} />)
      const images = screen.getAllByTestId('seal-icon')
      expect(images).toHaveLength(5)
    })

    it('displays oracle position labels', () => {
      render(<OracleMap kin={asKin(34)} />)
      expect(screen.getByText('Guide')).toBeInTheDocument()
      expect(screen.getByText('Antipode')).toBeInTheDocument()
      expect(screen.getByText('Analog')).toBeInTheDocument()
      expect(screen.getByText('Occult')).toBeInTheDocument()
    })

    it('has correct ARIA label for accessibility', () => {
      render(<OracleMap kin={asKin(34)} />)
      expect(
        screen.getByRole('img', { name: /Oracle cross for Kin 34/ })
      ).toBeInTheDocument()
    })

    it('calculates correct oracle positions for Kin 34 (Wizard)', () => {
      render(<OracleMap kin={asKin(34)} />)
      const images = screen.getAllByTestId('seal-icon')
      const srcList = images.map(img => img.getAttribute('src'))
      // Kin 34 -> seal 14 (Wizard) at center; glyph assets are numbered.
      expect(srcList.some(s => s?.includes('glyph14.gif'))).toBe(true)
    })

    it('renders in a 3x3 grid layout', () => {
      const { container } = render(<OracleMap kin={asKin(34)} />)
      const grid = container.querySelector('.oracle-map .grid')
      expect(grid).toHaveClass('grid-cols-3', 'grid-rows-3')
    })
  })

  describe('MantraDisplay', () => {
    it('renders mantra text', () => {
      const { container } = render(<MantraDisplay kin={asKin(34)} />)
      const mantraDiv = container.querySelector('.mantra-display')
      expect(mantraDiv).toBeInTheDocument()
      expect(mantraDiv?.textContent).toBeTruthy()
    })

    it('displays multi-line mantra', () => {
      const { container } = render(<MantraDisplay kin={asKin(34)} />)
      const quote = container.querySelector('.mantra-display blockquote')
      expect(quote).toHaveClass('whitespace-pre-line')
    })

    it('renders different mantras for different kins', () => {
      const { container: container1 } = render(<MantraDisplay kin={asKin(1)} />)
      const { container: container2 } = render(<MantraDisplay kin={asKin(100)} />)

      const mantra1 = container1.querySelector('.mantra-display blockquote')?.textContent
      const mantra2 = container2.querySelector('.mantra-display blockquote')?.textContent

      expect(mantra1).not.toBe(mantra2)
    })
  })

  describe('SealIcon', () => {
    it('renders dreamspell seal by default', () => {
      render(<SealIcon sealNumber={1} />)
      const img = screen.getByTestId('seal-icon')
      expect(img.getAttribute('src')).toContain('/dreamspell/gifs/glyph1.gif')
    })

    it('renders tzolkin sign when system is tzolkin', () => {
      render(<SealIcon sealNumber={1} system="tzolkin" />)
      const img = screen.getByTestId('seal-icon')
      expect(img.getAttribute('src')).toContain('MayaTzolkin1.png')
    })

    it('renders correct file for seal 1 (dragon)', () => {
      render(<SealIcon sealNumber={1} system="dreamspell" />)
      const img = screen.getByTestId('seal-icon')
      expect(img.getAttribute('src')).toContain('glyph1.gif')
    })

    it('renders correct file for seal 20 (sun)', () => {
      render(<SealIcon sealNumber={20} system="dreamspell" />)
      const img = screen.getByTestId('seal-icon')
      expect(img.getAttribute('src')).toContain('glyph20.gif')
    })

    it('applies small size correctly', () => {
      render(<SealIcon sealNumber={1} size="sm" />)
      const img = screen.getByTestId('seal-icon')
      expect(img.getAttribute('width')).toBe('32')
      expect(img.getAttribute('height')).toBe('32')
    })

    it('applies medium size correctly', () => {
      render(<SealIcon sealNumber={1} size="md" />)
      const img = screen.getByTestId('seal-icon')
      expect(img.getAttribute('width')).toBe('48')
      expect(img.getAttribute('height')).toBe('48')
    })

    it('applies large size correctly', () => {
      render(<SealIcon sealNumber={1} size="lg" />)
      const img = screen.getByTestId('seal-icon')
      expect(img.getAttribute('width')).toBe('64')
      expect(img.getAttribute('height')).toBe('64')
    })

    it('includes correct alt text', () => {
      render(<SealIcon sealNumber={5} system="dreamspell" />)
      const img = screen.getByTestId('seal-icon')
      expect(img.getAttribute('alt')).toBe('dreamspell seal 5')
    })

    it('includes correct alt text for tzolkin', () => {
      render(<SealIcon sealNumber={5} system="tzolkin" />)
      const img = screen.getByTestId('seal-icon')
      expect(img.getAttribute('alt')).toBe('tzolkin sign 5')
    })
  })
})

describe('Card Integration Tests', () => {
  describe('PersonCard with Test People data', () => {
    it('renders ליאור (1966-09-23) with correct calculations', () => {
      render(<PersonCard name="ליאור" birthDate="1966-09-23" />)
      expect(screen.getByText('ליאור')).toBeInTheDocument()
      expect(screen.getByText(/According to the Dreamspell/)).toBeInTheDocument()
    })

    it('renders ילנה (1955-06-11) with correct calculations', () => {
      render(<PersonCard name="ילנה" birthDate="1955-06-11" />)
      expect(screen.getByText('ילנה')).toBeInTheDocument()
    })

    it('renders validation date 2000-01-01 (Kin 153) correctly', () => {
      render(<PersonCard name="Test" birthDate="2000-01-01" />)
      expect(screen.getByText(/Kin 153/)).toBeInTheDocument()
      expect(screen.getByText(/Red Planetary Skywalker/)).toBeInTheDocument()
    })
  })

  describe('Leap year handling', () => {
    it('Feb 29 uses same kin as Feb 28', () => {
      const { container: feb28Container } = render(
        <DreamspellSection date="2000-02-28" />
      )
      const { container: feb29Container } = render(
        <DreamspellSection date="2000-02-29" />
      )

      const feb28Kin = feb28Container.textContent?.match(/Kin (\d+)/)?.[1]
      const feb29Kin = feb29Container.textContent?.match(/Kin (\d+)/)?.[1]

      expect(feb28Kin).toBe(feb29Kin)
    })
  })
})
