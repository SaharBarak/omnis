import { useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { Button, Card, ListItem, Surface, Text, TextField } from '@/components/m3'
import { searchPlaces, type PlaceResult } from '@/lib/geocode'
import { SHAPE, SPACE } from '@/theme/m3'

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
      <Card variant="outlined">
        <View style={styles.selectedRow}>
          <View style={styles.selectedText}>
            <Text variant="bodyLarge" numberOfLines={2}>
              {selected.name}
            </Text>
            <Text variant="dataSmall" color="onSurfaceVariant">
              {selected.lat.toFixed(3)}, {selected.lng.toFixed(3)} · {selected.timezone}
            </Text>
          </View>
          <Button
            variant="text"
            onPress={() => {
              setQuery('')
              setResults([])
              onClear()
            }}
          >
            Change
          </Button>
        </View>
      </Card>
    )
  }

  return (
    <View style={styles.block}>
      <TextField
        label="Birth place"
        value={query}
        onChangeText={setQuery}
        supportingText="Search a city"
        autoCapitalize="words"
        autoCorrect={false}
        error={error}
      />

      {/* Quiet mono search state — never a spinner (MOTION spec). */}
      {searching && (
        <Text variant="labelMedium" color="onSurfaceVariant" style={styles.searching}>
          Searching…
        </Text>
      )}

      {results.length > 0 && (
        <Surface level={2} radius={SHAPE.extraSmall} shadow style={styles.menu}>
          {results.map((place) => (
            <ListItem
              key={`${place.lat},${place.lng}`}
              headline={place.name}
              onPress={() => {
                setResults([])
                setQuery('')
                onSelect(place)
              }}
            />
          ))}
        </Surface>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  block: {
    gap: SPACE.sm,
  },
  searching: {
    marginHorizontal: SPACE.lg,
  },
  /** A menu — one of the few M3 components that genuinely floats. */
  menu: {
    overflow: 'hidden',
    paddingVertical: SPACE.sm,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  selectedText: {
    flex: 1,
    gap: 2,
  },
})
