import { describe, expect, it } from 'vitest'
import { safeRedirect } from './safe-redirect'

describe('safeRedirect', () => {
  it('keeps same-origin paths with their query and hash', () => {
    expect(safeRedirect('/app/people?x=1#top')).toBe('/app/people?x=1#top')
    expect(safeRedirect('/lab/bento/app', '/lab/bento/app')).toBe('/lab/bento/app')
  })

  it('falls back for anything that could leave the origin', () => {
    const bad = [
      'https://evil.example',
      '//evil.example',
      '/\\evil.example',
      '/%2fevil.example',
      '/%2F%2Fevil.example',
      '/%5Cevil.example',
      '/%5c%5cevil.example',
      '/\tevil.example',
      '/app\n',
      '/%0aevil',
      '/%E0%A4%A',
      'javascript:alert(1)',
      '',
      null,
      undefined,
    ]
    for (const path of bad) expect(safeRedirect(path, '/home'), String(path)).toBe('/home')
  })
})
