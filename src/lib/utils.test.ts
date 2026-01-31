import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('should merge multiple class names', () => {
      const result = cn('foo', 'bar', 'baz')
      expect(result).toBe('foo bar baz')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const isDisabled = false

      const result = cn(
        'base-class',
        isActive && 'active',
        isDisabled && 'disabled'
      )

      expect(result).toBe('base-class active')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['foo', 'bar'], 'baz')
      expect(result).toBe('foo bar baz')
    })

    it('should handle objects with conditional classes', () => {
      const result = cn({
        'always-on': true,
        'never-on': false,
        'also-on': 1,
      })

      expect(result).toBe('always-on also-on')
    })

    it('should resolve Tailwind class conflicts', () => {
      // twMerge should resolve conflicting utilities
      const result = cn('px-2', 'px-4')
      expect(result).toBe('px-4')
    })

    it('should resolve background color conflicts', () => {
      const result = cn('bg-red-500', 'bg-blue-500')
      expect(result).toBe('bg-blue-500')
    })

    it('should handle empty inputs', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle null and undefined inputs', () => {
      const result = cn('valid', null, undefined, 'also-valid')
      expect(result).toBe('valid also-valid')
    })

    it('should handle mixed input types', () => {
      const result = cn(
        'base',
        ['array-class'],
        { 'object-class': true },
        false && 'falsy-class'
      )

      expect(result).toBe('base array-class object-class')
    })

    it('should handle responsive Tailwind classes', () => {
      const result = cn('text-sm', 'md:text-base', 'lg:text-lg')
      expect(result).toBe('text-sm md:text-base lg:text-lg')
    })

    it('should merge padding and margin correctly', () => {
      const result = cn('p-2 m-4', 'p-4')
      expect(result).toBe('m-4 p-4')
    })

    it('should preserve non-conflicting classes', () => {
      const result = cn('text-red-500', 'bg-blue-500', 'font-bold')
      expect(result).toBe('text-red-500 bg-blue-500 font-bold')
    })
  })
})
