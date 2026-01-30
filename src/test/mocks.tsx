import { vi } from 'vitest'

export function mockNextImage() {
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
          data-testid="mock-image"
        />
      )
    },
  }))
}
