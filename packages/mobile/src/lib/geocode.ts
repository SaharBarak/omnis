/**
 * Place search — Nominatim (OpenStreetMap), the same source the web client
 * uses, so a person geocoded on one platform lands on the same coordinates on
 * the other.
 *
 * Why this exists: mobile shipped with a free-text city/country box and four
 * hardcoded timezones, which means no latitude or longitude. Houses, the
 * Ascendant and the Vertex are all functions of the birth *place* — without
 * coordinates the engine either suppresses them or (worse) leans on a default.
 * A birth chart with no place is an honest partial chart; a birth chart with a
 * guessed place is a wrong one.
 *
 * Nominatim's usage policy requires an identifying User-Agent and no more than
 * one request per second, so callers must debounce (PlaceField does).
 */

export interface PlaceResult {
  /** Full display name, e.g. "Haifa, Haifa District, Israel". */
  name: string
  city: string
  country: string
  lat: number
  lng: number
  timezone: string
}

interface NominatimResult {
  display_name?: string
  lat?: string
  lon?: string
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    state?: string
    country?: string
  }
}

/**
 * Longitude → IANA zone, 15° per hour. Deliberately crude and deliberately the
 * SAME crudeness as the web client (src/components/ui/location-picker.tsx): a
 * shared approximation is a known error, two different approximations are a
 * mystery. Political timezone borders don't follow meridians, so this can be an
 * hour off near an edge — the person can still override it from the list.
 */
export function approximateTimezone(lng: number): string {
  const offset = Math.round(lng / 15)
  if (offset === 0) return 'UTC'
  // POSIX Etc/GMT zones invert the sign: east of Greenwich is GMT-N.
  return offset > 0 ? `Etc/GMT-${offset}` : `Etc/GMT+${Math.abs(offset)}`
}

function pickCity(address: NominatimResult['address']): string {
  if (!address) return ''
  return (
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.state ??
    ''
  )
}

/** Throws on network/HTTP failure; callers surface an inline error. */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal
): Promise<PlaceResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 3) return []

  const url =
    'https://nominatim.openstreetmap.org/search' +
    `?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(trimmed)}`

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Pleiad Mobile (https://pleiad.io)',
      // Without this Nominatim localizes names to the place's own language, so
      // searching "Haifa" comes back as "חיפה" — correct, and unreadable to
      // someone who typed Latin script.
      'Accept-Language': 'en',
    },
    signal,
  })
  if (!response.ok) throw new Error(`Place search failed (${response.status})`)

  const results = (await response.json()) as NominatimResult[]

  return results.flatMap((result): PlaceResult[] => {
    const lat = Number(result.lat)
    const lng = Number(result.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return []
    return [
      {
        name: result.display_name ?? trimmed,
        city: pickCity(result.address),
        country: result.address?.country ?? '',
        lat,
        lng,
        timezone: approximateTimezone(lng),
      },
    ]
  })
}
