import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

import { TextField } from '@/components/ui/text-field'
import { searchPlaces, type PlaceResult } from '@/lib/geocode'
import { COLORS, RADII, SPACE, TYPE } from '@/theme/tokens'

/**
 * Birth-place search. Selecting a result yields real coordinates — the thing
 * houses and the Ascendant are computed from. Typing alone yields nothing:
 * a place we cannot locate is left unset rather than half-saved, because the
 * engine would rather have no place than a place it has to guess at.
 *
 * Nominatim allows one request per second; the debounce below is that budget.
 */
const DEBOUNCE_MS = 600

export function PlaceField({
  selected,
  onSelect,
  onClear,
}: {
  selected: PlaceResult | null
  onSelect: (place: PlaceResult) => void
  onClear: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const trimmed = query.trim()

    const timer = setTimeout(() => {
      abortRef.current?.abort()

      // Too short to search, or a place is already chosen: nothing to show.
      if (selected !== null || trimmed.length < 3) {
        setResults([])
        setSearching(false)
        return
      }

      const controller = new AbortController()
      abortRef.current = controller
      setSearching(true)
      setError(undefined)

      searchPlaces(trimmed, controller.signal)
        .then((found) => {
          setResults(found)
          setSearching(false)
        })
        .catch((cause: unknown) => {
          if (controller.signal.aborted) return
          setSearching(false)
          setResults([])
          setError("Couldn't reach place search. You can skip this.")
          void cause
        })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query, selected])

  useEffect(() => () => abortRef.current?.abort(), [])

  if (selected !== null) {
    return (
      <View style={styles.selectedRow}>
        <View style={styles.selectedText}>
          <Text style={styles.selectedName} numberOfLines={2}>
            {selected.name}
          </Text>
          <Text style={styles.selectedCoords}>
            {selected.lat.toFixed(3)}, {selected.lng.toFixed(3)} · {selected.timezone}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            setQuery('')
            setResults([])
            onClear()
          }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Change birth place"
        >
          <Text style={styles.change}>CHANGE</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.block}>
      <TextField
        label="BIRTH PLACE"
        value={query}
        onChangeText={setQuery}
        placeholder="Search a city"
        autoCapitalize="words"
        autoCorrect={false}
        error={error}
      />
      {searching && <ActivityIndicator size="small" color={COLORS.brandSoft} />}
      {results.map((place) => (
        <Pressable
          key={`${place.lat},${place.lng}`}
          onPress={() => {
            setResults([])
            setQuery('')
            onSelect(place)
          }}
          style={styles.resultRow}
          accessibilityRole="button"
        >
          <Text style={styles.resultName} numberOfLines={2}>
            {place.name}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  block: {
    gap: 8,
  },
  resultRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADII.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface2,
  },
  resultName: {
    ...TYPE.bodySm,
    color: COLORS.text70,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.cardPad,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RADII.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface2,
  },
  selectedText: {
    flex: 1,
    gap: 2,
  },
  selectedName: {
    ...TYPE.bodySm,
    color: COLORS.text70,
  },
  selectedCoords: {
    ...TYPE.statLabel,
    color: COLORS.text50,
  },
  change: {
    ...TYPE.statLabel,
    color: COLORS.brandSoft,
  },
})
