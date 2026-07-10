/**
 * Static IANA timezone shortlist for the birth-place onboarding step.
 * TODO(geocoding): replace with a place search that resolves lat/lng and the
 * exact timezone from the chosen city (F2 spec: place search → lat/lng/tz).
 */

export interface TimezoneOption {
  id: string
  label: string
}

export const TIMEZONES: readonly TimezoneOption[] = [
  { id: 'Asia/Jerusalem', label: 'Jerusalem' },
  { id: 'Europe/London', label: 'London' },
  { id: 'Europe/Paris', label: 'Paris' },
  { id: 'Europe/Berlin', label: 'Berlin' },
  { id: 'Europe/Moscow', label: 'Moscow' },
  { id: 'America/New_York', label: 'New York' },
  { id: 'America/Chicago', label: 'Chicago' },
  { id: 'America/Denver', label: 'Denver' },
  { id: 'America/Los_Angeles', label: 'Los Angeles' },
  { id: 'America/Sao_Paulo', label: 'Sao Paulo' },
  { id: 'America/Mexico_City', label: 'Mexico City' },
  { id: 'Africa/Cairo', label: 'Cairo' },
  { id: 'Asia/Dubai', label: 'Dubai' },
  { id: 'Asia/Kolkata', label: 'Kolkata' },
  { id: 'Asia/Bangkok', label: 'Bangkok' },
  { id: 'Asia/Shanghai', label: 'Shanghai' },
  { id: 'Asia/Tokyo', label: 'Tokyo' },
  { id: 'Australia/Sydney', label: 'Sydney' },
  { id: 'Pacific/Auckland', label: 'Auckland' },
  { id: 'UTC', label: 'UTC' },
] as const
