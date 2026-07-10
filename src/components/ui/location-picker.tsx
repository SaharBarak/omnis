'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from './input'
import { Button } from './button'
import { cn } from '@/lib/utils'

export interface BirthPlace {
  name: string
  city?: string
  country?: string
  lat: number
  lng: number
  timezone?: string
}

interface LocationPickerProps {
  value: BirthPlace | null
  onChange: (value: BirthPlace | null) => void
  disabled?: boolean
  className?: string
}

interface GeocodingResult {
  display_name: string
  lat: string
  lon: string
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    country?: string
  }
}

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Timezone lookup from coordinates (simple approximation)
// For accurate results, use geo-tz npm package server-side
function approximateTimezone(lat: number, lng: number): string {
  // Simple longitude-based approximation (15 degrees per hour)
  const offset = Math.round(lng / 15)
  if (offset === 0) return 'UTC'
  return `Etc/GMT${offset > 0 ? '-' : '+'}${Math.abs(offset)}`
}

export function LocationPicker({ value, onChange, disabled, className }: LocationPickerProps) {
  const [search, setSearch] = useState(value?.name || '')
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [manualLat, setManualLat] = useState(value?.lat?.toString() || '')
  const [manualLng, setManualLng] = useState(value?.lng?.toString() || '')
  const containerRef = useRef<HTMLDivElement>(null)

  const debouncedSearch = useDebounce(search, 300)

  // Search for locations using Nominatim
  const searchLocations = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
        {
          headers: {
            'User-Agent': 'Pleiad App (https://omnis.app)',
          },
        }
      )
      const data: GeocodingResult[] = await response.json()
      setResults(data)
      setShowResults(data.length > 0)
    } catch (error) {
      console.error('Geocoding error:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    if (debouncedSearch && !value?.name) {
      searchLocations(debouncedSearch)
    }
  }, [debouncedSearch, searchLocations, value?.name])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectLocation = (result: GeocodingResult) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    const city = result.address?.city || result.address?.town || result.address?.village || result.address?.municipality

    const place: BirthPlace = {
      name: result.display_name,
      city,
      country: result.address?.country,
      lat,
      lng,
      timezone: approximateTimezone(lat, lng),
    }

    onChange(place)
    setSearch(result.display_name)
    setShowResults(false)
    setShowManual(false)
  }

  const handleManualSave = () => {
    const lat = parseFloat(manualLat)
    const lng = parseFloat(manualLng)

    if (isNaN(lat) || isNaN(lng)) {
      return
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return
    }

    const place: BirthPlace = {
      name: search || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      lat,
      lng,
      timezone: approximateTimezone(lat, lng),
    }

    onChange(place)
    setShowManual(false)
  }

  const clearLocation = () => {
    onChange(null)
    setSearch('')
    setManualLat('')
    setManualLng('')
    setShowResults(false)
  }

  return (
    <div ref={containerRef} className={cn('space-y-2', className)}>
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                if (value) onChange(null) // Clear when typing new search
              }}
              onFocus={() => {
                if (results.length > 0) setShowResults(true)
              }}
              disabled={disabled}
              placeholder="Search for a city..."
              className={cn(isSearching && 'pr-8')}
            />
            {isSearching && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
          </div>
          {value && (
            <Button type="button" variant="outline" size="sm" onClick={clearLocation} disabled={disabled}>
              Clear
            </Button>
          )}
        </div>

        {/* Search results dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
            <ul className="max-h-60 overflow-auto py-1">
              {results.map((result, index) => (
                <li key={index}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                    onClick={() => selectLocation(result)}
                  >
                    {result.display_name}
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t px-3 py-2">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setShowResults(false)
                  setShowManual(true)
                }}
              >
                Enter coordinates manually
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected location display */}
      {value && !showManual && (
        <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
          <div className="font-medium">{value.city || value.name}</div>
          <div className="text-xs text-muted-foreground">
            {value.lat.toFixed(4)}°N, {value.lng.toFixed(4)}°E
            {value.timezone && ` • ${value.timezone}`}
          </div>
        </div>
      )}

      {/* Manual entry mode */}
      {showManual && (
        <div className="space-y-3 rounded-md border p-3">
          <p className="text-sm font-medium">Manual Coordinates</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Latitude</label>
              <Input
                type="number"
                step="0.0001"
                min="-90"
                max="90"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="-90 to 90"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Longitude</label>
              <Input
                type="number"
                step="0.0001"
                min="-180"
                max="180"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                placeholder="-180 to 180"
                disabled={disabled}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleManualSave} disabled={disabled}>
              Save
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowManual(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* No results + manual entry option */}
      {!showManual && search.length >= 2 && !isSearching && results.length === 0 && !value && (
        <div className="text-sm text-muted-foreground">
          No results found.{' '}
          <button
            type="button"
            className="text-primary underline"
            onClick={() => setShowManual(true)}
          >
            Enter coordinates manually
          </button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Birth place is needed for accurate Astrology and Human Design charts.
      </p>
    </div>
  )
}
