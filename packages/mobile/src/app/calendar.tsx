import { useRouter } from 'expo-router'
import { CaretLeftIcon, CaretRightIcon } from 'phosphor-react-native'
import { useCallback, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import {
  thirteenMoonDate,
  thirteenMoonYear,
} from '@pleiad/engine/calculations/thirteen-moon'
import { getWavespellPosition } from '@pleiad/engine/calculations/wavespell'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import {
  Button,
  Card,
  Divider,
  IconButton,
  SegmentedButton,
  Text,
  TopAppBar,
  Touchable,
} from '@/components/m3'
import { SEAL_COLOR_HEX } from '@/theme/tokens'
import { SHAPE, SPACE, alpha, useTheme } from '@/theme/m3'

/**
 * The Dreamspell calendar (#59) — the mobile port of /app/calendar: the
 * month-at-a-glance kin grid and the 13-Moon (13 × 28) year ring, sharing
 * one selected-day detail. Same engine calls as the web page; the 28-day
 * moons wrap to four radial weeks of seven, which is the calendar's own
 * native grouping.
 */

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

function localIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

interface DayCell {
  readonly iso: string
  readonly day: number
  readonly kin: number
  readonly sealColor: string
  readonly inMonth: boolean
}

function monthGrid(anchor: Date): DayCell[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const start = new Date(first)
  start.setDate(1 - first.getDay())
  const cells: DayCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    const iso = localIso(d)
    const kin = dateToKin(iso)
    cells.push({
      iso,
      day: d.getDate(),
      kin,
      sealColor: getSeal(kinToSeal(kin)).color,
      inMonth: d.getMonth() === anchor.getMonth(),
    })
  }
  const lastWeek = cells.slice(35)
  return lastWeek.every((c) => !c.inMonth) ? cells.slice(0, 35) : cells
}

function SealDot({ color }: { color: string }) {
  return (
    <View
      style={[
        styles.sealDot,
        { backgroundColor: SEAL_COLOR_HEX[color] ?? SEAL_COLOR_HEX.red },
      ]}
    />
  )
}

function GridCell({
  iso,
  primaryText,
  secondaryText,
  sealColor,
  isToday,
  isSelected,
  dimmed,
  accessibilityLabel,
  onSelect,
}: {
  iso: string
  primaryText: string
  secondaryText?: string
  sealColor: string
  isToday: boolean
  isSelected: boolean
  dimmed?: boolean
  accessibilityLabel: string
  onSelect: (iso: string) => void
}) {
  const theme = useTheme()
  return (
    <View style={styles.cellSlot}>
      <Touchable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected: isSelected }}
        stateLayerColor={theme.colors.primary}
        onPress={() => onSelect(iso)}
      >
        <View
          style={[
            styles.cell,
            { borderColor: alpha(theme.colors.outline, 0.25) },
            isToday && { borderColor: theme.colors.primary },
            isSelected && {
              borderColor: theme.colors.primary,
              backgroundColor: alpha(theme.colors.primary, 0.14),
            },
            dimmed === true && styles.cellDimmed,
          ]}
        >
          <Text
            variant="labelMedium"
            color={isSelected || isToday ? 'primary' : 'onSurface'}
          >
            {primaryText}
          </Text>
          <View style={styles.cellMeta}>
            <SealDot color={sealColor} />
            {secondaryText !== undefined && (
              <Text variant="labelSmall" color="onSurfaceVariant">
                {secondaryText}
              </Text>
            )}
          </View>
        </View>
      </Touchable>
    </View>
  )
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <>
      <View style={styles.detailRow}>
        <Text variant="labelMedium" color="onSurfaceVariant">
          {label}
        </Text>
        <Text variant="dataSmall" color="onSurface" style={styles.detailValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
      {last !== true && <Divider />}
    </>
  )
}

export default function CalendarScreen() {
  const router = useRouter()
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const todayIso = useMemo(() => localIso(new Date()), [])
  const [view, setView] = useState(0) // 0 = month, 1 = 13 moons
  const [anchor, setAnchor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [yearStart, setYearStart] = useState(() => thirteenMoonDate(todayIso).yearStart)
  const [selected, setSelected] = useState(todayIso)

  const cells = useMemo(() => monthGrid(anchor), [anchor])
  const moons = useMemo(() => {
    return thirteenMoonYear(yearStart).map((moon) => ({
      ...moon,
      cells: moon.days.map((d) => {
        const kin = dateToKin(d.iso)
        return {
          iso: d.iso,
          dayOfMoon: d.dayOfMoon,
          kin,
          sealColor: getSeal(kinToSeal(kin)).color,
        }
      }),
    }))
  }, [yearStart])

  const detail = useMemo(() => {
    const kin = dateToKin(selected)
    const seal = getSeal(kinToSeal(kin))
    const tone = getTone(kinToTone(kin))
    const ws = getWavespellPosition(kin)
    const wsSeal = getSeal(ws.wavespell.sealNumber)
    const moonDay = thirteenMoonDate(selected)
    return { kin, seal, tone, ws, wsSeal, moonDay }
  }, [selected])

  const movePeriod = useCallback(
    (delta: number) => {
      if (view === 0) {
        setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + delta, 1))
      } else {
        setYearStart((y) => y + delta)
      }
    },
    [view]
  )

  const jumpToday = useCallback(() => {
    const now = new Date()
    setAnchor(new Date(now.getFullYear(), now.getMonth(), 1))
    setYearStart(thirteenMoonDate(todayIso).yearStart)
    setSelected(todayIso)
  }, [todayIso])

  const goBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/')
  }

  const periodLabel =
    view === 0
      ? anchor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
      : `${yearStart}–${yearStart + 1} ring`

  const selectedDateLine = new Date(`${selected}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <View style={styles.screen}>
      <TopAppBar
        title="Dreamspell Calendar"
        navigationIcon={
          <IconButton
            icon={(color) => <CaretLeftIcon size={24} color={color} />}
            onPress={goBack}
            accessibilityLabel="Back"
          />
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACE.xxl }]}
      >
        <SegmentedButton
          segments={[
            { key: 'month', label: 'Month' },
            { key: 'moons', label: '13 Moons' },
          ]}
          selectedIndex={view}
          onSelect={setView}
        />

        <View style={styles.periodBar}>
          <Text variant="titleMedium" color="onSurface" style={styles.periodLabel}>
            {periodLabel}
          </Text>
          <View style={styles.periodControls}>
            <Button variant="text" onPress={jumpToday}>
              Today
            </Button>
            <IconButton
              icon={(color) => <CaretLeftIcon size={20} color={color} />}
              onPress={() => movePeriod(-1)}
              accessibilityLabel={view === 0 ? 'Previous month' : 'Previous year'}
            />
            <IconButton
              icon={(color) => <CaretRightIcon size={20} color={color} />}
              onPress={() => movePeriod(1)}
              accessibilityLabel={view === 0 ? 'Next month' : 'Next year'}
            />
          </View>
        </View>

        {view === 0 ? (
          <View>
            <View style={styles.grid}>
              {WEEKDAYS.map((d, i) => (
                <View key={`${d}-${i}`} style={styles.cellSlot}>
                  <Text
                    variant="labelSmall"
                    color="onSurfaceVariant"
                    style={styles.weekday}
                  >
                    {d}
                  </Text>
                </View>
              ))}
              {cells.map((cell) => (
                <GridCell
                  key={cell.iso}
                  iso={cell.iso}
                  primaryText={String(cell.day)}
                  secondaryText={String(cell.kin)}
                  sealColor={cell.sealColor}
                  isToday={cell.iso === todayIso}
                  isSelected={cell.iso === selected}
                  dimmed={!cell.inMonth}
                  accessibilityLabel={`${cell.iso}, Kin ${cell.kin}`}
                  onSelect={setSelected}
                />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.moons}>
            {moons.map((moon) => (
              <View key={moon.moon}>
                <View style={styles.moonHeader}>
                  <Text variant="labelLarge" color="onSurface">
                    {moon.moon} · {moon.moonName} {moon.totem} Moon
                  </Text>
                  <Text variant="labelSmall" color="onSurfaceVariant">
                    {new Date(`${moon.days[0].iso}T12:00:00`).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                    {' – '}
                    {new Date(`${moon.days[27].iso}T12:00:00`).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
                <View style={styles.grid}>
                  {moon.cells.map((cell) => (
                    <GridCell
                      key={cell.iso}
                      iso={cell.iso}
                      primaryText={String(cell.dayOfMoon)}
                      sealColor={cell.sealColor}
                      isToday={cell.iso === todayIso}
                      isSelected={cell.iso === selected}
                      accessibilityLabel={`${cell.iso}, Kin ${cell.kin}, ${moon.moonName} Moon day ${cell.dayOfMoon}`}
                      onSelect={setSelected}
                    />
                  ))}
                </View>
              </View>
            ))}
            <Text variant="bodySmall" color="onSurfaceVariant">
              July 25 — the Day Out of Time — and Feb 29 (0.0 Hunab Ku) sit outside
              the 13 × 28 count; the ring runs July 26 to July 24.
            </Text>
          </View>
        )}

        <Card variant="outlined">
          <View style={styles.detail}>
            <View style={styles.detailHead}>
              <SealDot color={detail.seal.color} />
              <Text variant="titleLarge" color="primary">
                Kin {detail.kin}
              </Text>
            </View>
            <Text variant="bodyMedium" color="onSurfaceVariant" style={styles.detailSub}>
              {detail.tone.name} {detail.seal.english}
            </Text>
            <DetailRow label="Date" value={selectedDateLine} />
            <DetailRow
              label="Wavespell"
              value={`${detail.wsSeal.english} · ${detail.ws.position} of 13`}
            />
            <DetailRow label="Role" value={detail.ws.dayName} />
            <DetailRow label="13-Moon" value={detail.moonDay.formatted} last />
          </View>
        </Card>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACE.margin,
    gap: SPACE.lg,
  },
  periodBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.md,
  },
  periodLabel: {
    flexShrink: 1,
  },
  periodControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekday: {
    textAlign: 'center',
    paddingBottom: SPACE.xs,
  },
  cellSlot: {
    width: `${100 / 7}%`,
    padding: 2,
  },
  cell: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: SHAPE.small,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: SPACE.xs,
  },
  cellDimmed: {
    opacity: 0.35,
  },
  cellMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sealDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moons: {
    gap: SPACE.lg,
  },
  moonHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: SPACE.md,
    paddingBottom: SPACE.xs,
  },
  detail: {
    padding: SPACE.lg,
  },
  detailHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  detailSub: {
    paddingBottom: SPACE.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.lg,
    paddingVertical: SPACE.md,
  },
  detailValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
})
