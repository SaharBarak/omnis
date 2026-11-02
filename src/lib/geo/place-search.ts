/**
 * Place search through OpenStreetMap Nominatim. One request per explicit
 * search: Nominatim's usage policy allows at most one request a second and
 * forbids client-side autocomplete, so callers search on submit, not on
 * every keystroke.
 */

const ENDPOINT = 'https://nominatim.openstreetmap.org/search'
const RESULT_LIMIT = 5

export interface GeocodingResult {
  readonly display_name: string
  readonly lat: string
  readonly lon: string
  readonly address?: {
    readonly city?: string
    readonly town?: string
    readonly village?: string
    readonly municipality?: string
    readonly country?: string
  }
}

export interface PlaceHit {
  readonly label: string
  readonly city: string | null
  readonly country: string | null
  readonly lat: number
  readonly lng: number
}

export const toPlaceHit = (r: GeocodingResult): PlaceHit => ({
  label: r.display_name,
  city: r.address?.city ?? r.address?.town ?? r.address?.village ?? r.address?.municipality ?? null,
  country: r.address?.country ?? null,
  lat: Number.parseFloat(r.lat),
  lng: Number.parseFloat(r.lon),
})

export async function searchPlacesRaw(query: string, signal?: AbortSignal): Promise<GeocodingResult[]> {
  const url = `${ENDPOINT}?format=json&addressdetails=1&limit=${RESULT_LIMIT}&q=${encodeURIComponent(query)}`
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Place search failed (${response.status})`)
  return (await response.json()) as GeocodingResult[]
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceHit[]> {
  return (await searchPlacesRaw(query, signal)).map(toPlaceHit).filter((h) => Number.isFinite(h.lat) && Number.isFinite(h.lng))
}
