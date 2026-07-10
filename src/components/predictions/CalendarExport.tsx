'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { PredictionEvent, CalendarEvent, ICSEvent } from '@pleiad/engine/types/prediction'

interface CalendarExportProps {
  events: PredictionEvent[]
  title?: string
}

function generateICS(events: ICSEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pleiad//Predictions//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Pleiad Predictions',
  ]

  for (const event of events) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${event.uid}`)
    lines.push(`DTSTAMP:${formatICSDate(new Date())}`)
    lines.push(`DTSTART;VALUE=DATE:${event.dtstart}`)
    lines.push(`DTEND;VALUE=DATE:${event.dtend}`)
    lines.push(`SUMMARY:${escapeICSText(event.summary)}`)
    lines.push(`DESCRIPTION:${escapeICSText(event.description)}`)
    if (event.categories) {
      lines.push(`CATEGORIES:${event.categories.join(',')}`)
    }
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function formatICSDateOnly(dateStr: string): string {
  return dateStr.replace(/-/g, '')
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@pleiad.io`
}

export function CalendarExport({ events, title = 'Export to Calendar' }: CalendarExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = () => {
    setIsExporting(true)

    try {
      // Convert prediction events to ICS events
      const icsEvents: ICSEvent[] = events.map((event) => ({
        uid: generateUID(),
        summary: event.title,
        description: `${event.description}\n\nIntensity: ${event.intensity}\nSystem: ${event.system}\nType: ${event.type}`,
        dtstart: formatICSDateOnly(event.startDate),
        dtend: formatICSDateOnly(event.endDate),
        categories: event.themes,
      }))

      // Generate ICS content
      const icsContent = generateICS(icsEvents)

      // Create and download the file
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `pleiad-predictions-${new Date().toISOString().split('T')[0]}.ics`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting calendar:', error)
    } finally {
      setIsExporting(false)
    }
  }

  if (events.length === 0) {
    return null
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? 'Exporting...' : title}
    </Button>
  )
}

interface SingleEventExportProps {
  event: PredictionEvent
}

export function SingleEventExport({ event }: SingleEventExportProps) {
  const handleExport = () => {
    const icsEvent: ICSEvent = {
      uid: generateUID(),
      summary: event.title,
      description: `${event.description}\n\nIntensity: ${event.intensity}\nSystem: ${event.system}\nType: ${event.type}`,
      dtstart: formatICSDateOnly(event.startDate),
      dtend: formatICSDateOnly(event.endDate),
      categories: event.themes,
    }

    const icsContent = generateICS([icsEvent])
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pleiad-${event.type}-${event.startDate}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleExport}>
      Add to Calendar
    </Button>
  )
}
