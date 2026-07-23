'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

import type { InstallationPlatform } from '@/lib/db/repositories/installations-repo'

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

let reported = false
let pendingReport: Promise<void> | null = null

export function getWebInstallationPlatform(userAgent: string): InstallationPlatform {
  if (/android/i.test(userAgent)) return 'android'
  if (/iPad|iPhone|iPod/i.test(userAgent)) return 'ios'
  return 'web'
}

export function isStandaloneWebApp(
  displayModeMatches: boolean,
  navigatorStandalone: boolean | undefined
): boolean {
  return displayModeMatches || navigatorStandalone === true
}

async function sendInstallationReport(): Promise<void> {
  if (reported || pendingReport) return

  pendingReport = fetch('/api/installations', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: 'pwa',
      platform: getWebInstallationPlatform(navigator.userAgent),
    }),
    keepalive: true,
  })
    .then((response) => {
      reported = response.ok
    })
    .catch(() => undefined)
    .finally(() => {
      pendingReport = null
    })

  await pendingReport
}

function reportStandaloneLaunch(): void {
  const navigatorStandalone = (navigator as NavigatorWithStandalone).standalone
  if (!isStandaloneWebApp(window.matchMedia('(display-mode: standalone)').matches, navigatorStandalone)) {
    return
  }

  void sendInstallationReport()
}

export function PwaInstallationReporter(): null {
  const pathname = usePathname()

  useEffect(() => {
    reportStandaloneLaunch()
  }, [pathname])

  useEffect(() => {
    window.addEventListener('appinstalled', sendInstallationReport)
    return () => window.removeEventListener('appinstalled', sendInstallationReport)
  }, [])

  return null
}
