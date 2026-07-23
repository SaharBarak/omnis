import { describe, expect, it } from 'vitest'

import {
  getWebInstallationPlatform,
  isStandaloneWebApp,
} from './pwa-installation-reporter'

describe('PWA installation detection', () => {
  it('recognizes Android browsers', () => {
    expect(
      getWebInstallationPlatform(
        'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/138 Mobile Safari/537.36'
      )
    ).toBe('android')
  })

  it('recognizes iOS browsers', () => {
    expect(
      getWebInstallationPlatform(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
      )
    ).toBe('ios')
  })

  it('uses web for desktop browsers', () => {
    expect(
      getWebInstallationPlatform(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/138 Safari/537.36'
      )
    ).toBe('web')
  })

  it('recognizes both display-mode and iOS standalone launches', () => {
    expect(isStandaloneWebApp(true, false)).toBe(true)
    expect(isStandaloneWebApp(false, true)).toBe(true)
    expect(isStandaloneWebApp(false, false)).toBe(false)
  })
})
