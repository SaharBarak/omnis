'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import {
  getDailyPrediction,
  getWeeklyPrediction,
  getMonthlyPrediction,
  getPersonalTimeline,
  getPersonalDailyPrediction,
} from '@pleiad/engine/services/predictions'
import type { PersonalTimeline, PredictionEvent } from '@pleiad/engine/types/prediction'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader, EmptyState } from '@/components/dashboard'
import { Eyebrow, MeterBar, PageSection, SkeletonCard, getFlavor } from '@/components/app-kit'
import { SEAL_COLORS, type SealColor } from '@/components/app-kit/seal-colors'
import { cn } from '@/lib/utils'
import {
  AIInterpretation,
  PredictionCard,
  IntensityBadge,
  IntensityDot,
  PredictionTimeline,
  CalendarExport,
  NotificationSettings,
} from '@/components/predictions'
import { sealTileClasses } from '@/components/predictions/seal-style'

const SEAL_ORDER: readonly SealColor[] = ['red', 'white', 'blue', 'yellow'] as const

/** Mono micro-caps tab trigger — the contract's eyebrow voice. */
const TAB_TRIGGER =
  'rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-white/70 data-[state=active]:bg-brand/15 data-[state=active]:text-brand-soft data-[state=active]:shadow-none'

const TAB_LIST = 'h-auto rounded-full border border-white/[0.07] bg-transparent p-1'

export default function PredictionsPage() {
  const { profile, loading } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [mainTab, setMainTab] = useState<'forecast' | 'timeline' | 'settings'>('forecast')
  const [forecastView, setForecastView] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  const flavor = getFlavor('dreamspell')

  // Get user's birth date from profile
  const userBirthDate = profile?.birth_date || null
  const userName = profile?.display_name || 'You'
  const userId = profile?.user_id

  // Calculate predictions
  const today = useMemo(() => {
    const dateStr = new Date().toISOString().split('T')[0]
    return userBirthDate
      ? getPersonalDailyPrediction(dateStr, userBirthDate)
      : getDailyPrediction(dateStr)
  }, [userBirthDate])

  const dailyPrediction = useMemo(() => {
    const dateStr = selectedDate.toISOString().split('T')[0]
    return userBirthDate
      ? getPersonalDailyPrediction(dateStr, userBirthDate)
      : getDailyPrediction(dateStr)
  }, [selectedDate, userBirthDate])

  const weeklyPrediction = useMemo(() => {
    const dateStr = selectedDate.toISOString().split('T')[0]
    return getWeeklyPrediction(dateStr)
  }, [selectedDate])

  const monthlyPrediction = useMemo(() => {
    return getMonthlyPrediction(selectedDate.getFullYear(), selectedDate.getMonth())
  }, [selectedDate])

  // Personal timeline — derived, no effect needed
  const timeline: PersonalTimeline | null = useMemo(() => {
    if (!userBirthDate || !userId) return null
    return getPersonalTimeline(userId, userName, userBirthDate)
  }, [userBirthDate, userId, userName])

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    if (forecastView === 'daily') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    } else if (forecastView === 'weekly') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    }
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatShortDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Collect all events for calendar export
  const allEvents: PredictionEvent[] = useMemo(() => {
    const events: PredictionEvent[] = []
    if (forecastView === 'weekly') {
      weeklyPrediction.days.forEach((day) => events.push(...day.events))
    } else if (forecastView === 'monthly') {
      monthlyPrediction.days.forEach((day) => events.push(...day.events))
    } else {
      events.push(...dailyPrediction.events)
    }
    return events
  }, [forecastView, dailyPrediction, weeklyPrediction, monthlyPrediction])

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Predictions"
          subtitle="Daily, weekly, and monthly forecasts based on the Dreamspell calendar"
        />
        <SkeletonCard className="h-44" />
        <SkeletonCard className="h-72" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Predictions"
        meta={formatDate(new Date())}
        subtitle={userBirthDate
          ? 'Personalized forecasts based on your birth date'
          : 'Daily, weekly, and monthly forecasts based on Dreamspell calendar'}
      />

      {/* Today's set piece */}
      <PageSection index={0} accent={flavor.accent} eyebrow="Today">
        <div className="feature-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow accent={flavor.accent}>Kin {today.kin}</Eyebrow>
            {today.events.length > 0 && (
              <IntensityBadge intensity={today.intensity} />
            )}
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div
              className={cn(
                'flex size-16 shrink-0 items-center justify-center rounded-xl',
                'font-mono text-2xl [font-variant-numeric:tabular-nums]',
                sealTileClasses(today.color)
              )}
            >
              {today.kin}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl font-semibold tracking-tight text-white/90 md:text-2xl">
                {today.toneName} {today.sealName}
              </h2>
              <p className="mt-1 text-sm text-white/70">
                Day {today.wavespell.day} of {today.wavespell.name} Wavespell
              </p>
              <p className="text-sm text-white/50">{today.wavespell.role}</p>
            </div>
          </div>
          {today.events.length > 0 && (
            <div className="mt-4 divide-y divide-white/[0.07] border-t border-white/[0.07]">
              {today.events.map((event, i) => (
                <div key={i} className="py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white/90">{event.title}</span>
                    <IntensityBadge intensity={event.intensity} size="sm" />
                  </div>
                  <p className="mt-1 text-sm text-white/70">{event.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageSection>

      {/* Forecast / timeline / settings */}
      <PageSection
        index={1}
        accent={flavor.accent}
        eyebrow={
          mainTab === 'forecast'
            ? 'Forecast'
            : mainTab === 'timeline'
              ? 'Personal timeline'
              : 'Settings'
        }
      >
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as typeof mainTab)}>
          <TabsList className={TAB_LIST}>
            <TabsTrigger value="forecast" className={TAB_TRIGGER}>
              Forecast
            </TabsTrigger>
            <TabsTrigger value="timeline" disabled={!userBirthDate} className={TAB_TRIGGER}>
              Timeline {!userBirthDate && '(Add birth date)'}
            </TabsTrigger>
            <TabsTrigger value="settings" className={TAB_TRIGGER}>
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Forecast Tab */}
          <TabsContent value="forecast" className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Tabs value={forecastView} onValueChange={(v) => setForecastView(v as typeof forecastView)}>
                <TabsList className={TAB_LIST}>
                  <TabsTrigger value="daily" className={TAB_TRIGGER}>Daily</TabsTrigger>
                  <TabsTrigger value="weekly" className={TAB_TRIGGER}>Weekly</TabsTrigger>
                  <TabsTrigger value="monthly" className={TAB_TRIGGER}>Monthly</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2">
                {allEvents.length > 0 && (
                  <CalendarExport events={allEvents} title="Export" />
                )}
                <Button variant="outline" size="sm" className="active:scale-[0.98]" onClick={() => navigateDate('prev')}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="sm" className="active:scale-[0.98]" onClick={goToToday}>
                  <Calendar className="mr-1 size-4" />
                  Today
                </Button>
                <Button variant="outline" size="sm" className="active:scale-[0.98]" onClick={() => navigateDate('next')}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            {/* Daily View */}
            {forecastView === 'daily' && (
              <>
                <PredictionCard prediction={dailyPrediction} />
                {dailyPrediction.events.map((event, i) => (
                  <AIInterpretation key={`${event.title}-${i}`} prediction={event} />
                ))}
              </>
            )}

            {/* Weekly View */}
            {forecastView === 'weekly' && (
              <div className="surface-card p-6">
                <div className="mb-4 flex flex-col gap-1">
                  <Eyebrow>Week</Eyebrow>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-white/90">
                    {formatShortDate(new Date(weeklyPrediction.startDate))} – {formatShortDate(new Date(weeklyPrediction.endDate))}
                  </h3>
                  {weeklyPrediction.events.length > 0 && (
                    <p className="text-sm text-white/50">
                      {weeklyPrediction.wavespellTransitions > 0 && (
                        <span>{weeklyPrediction.wavespellTransitions} wavespell transition{weeklyPrediction.wavespellTransitions > 1 ? 's' : ''}</span>
                      )}
                      {weeklyPrediction.castleTransitions > 0 && (
                        <span className="ml-2">{weeklyPrediction.castleTransitions} castle transition{weeklyPrediction.castleTransitions > 1 ? 's' : ''}</span>
                      )}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {weeklyPrediction.days.map((prediction, index) => {
                    const isToday = prediction.date === new Date().toISOString().split('T')[0]
                    const isSelected = prediction.date === selectedDate.toISOString().split('T')[0]
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedDate(new Date(prediction.date))
                          setForecastView('daily')
                        }}
                        className={cn(
                          'rounded-xl border border-transparent p-2 text-center sm:p-3',
                          'transition-colors hover:border-white/[0.12] active:scale-[0.98]',
                          isToday && 'ring-1 ring-brand/60',
                          isSelected && 'bg-brand/10'
                        )}
                      >
                        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/35">
                          {new Date(prediction.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className="mb-2 font-mono text-sm text-white/90 [font-variant-numeric:tabular-nums]">
                          {new Date(prediction.date).getDate()}
                        </p>
                        <div
                          className={cn(
                            'mx-auto flex size-10 items-center justify-center rounded-lg',
                            'font-mono text-sm [font-variant-numeric:tabular-nums]',
                            sealTileClasses(prediction.color)
                          )}
                        >
                          {prediction.kin}
                        </div>
                        <p className="mt-1 truncate text-[10px] text-white/50">{prediction.sealName}</p>
                        {prediction.events.length > 0 && (
                          <div className="mt-1.5 flex justify-center">
                            <IntensityDot intensity={prediction.intensity} size="sm" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Wavespell Progress */}
                <div className="mt-6 border-t border-white/[0.07] pt-4">
                  <MeterBar
                    label={weeklyPrediction.days[0].wavespell.name}
                    value={weeklyPrediction.days[0].wavespell.day}
                    max={13}
                    accent={flavor.accent}
                    displayValue={`${weeklyPrediction.days[0].wavespell.day}/13`}
                  />
                </div>
              </div>
            )}

            {/* Monthly View */}
            {forecastView === 'monthly' && (
              <div className="surface-card p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <Eyebrow>Month</Eyebrow>
                    <h3 className="font-display text-lg font-semibold tracking-tight text-white/90">
                      {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                  </div>
                  {monthlyPrediction.highlights.length > 0 && (
                    <IntensityBadge intensity={monthlyPrediction.intensity} />
                  )}
                </div>
                {monthlyPrediction.highlights.length > 0 && (
                  <p className="mb-4 text-sm text-white/50">
                    {monthlyPrediction.highlights.length} significant event{monthlyPrediction.highlights.length > 1 ? 's' : ''} this month
                  </p>
                )}

                {/* Day headers */}
                <div className="mb-2 grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div
                      key={day}
                      className="py-2 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-white/35"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                  {monthlyPrediction.days.map((prediction, index) => {
                    const isToday = prediction.date === new Date().toISOString().split('T')[0]
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedDate(new Date(prediction.date))
                          setForecastView('daily')
                        }}
                        className={cn(
                          'relative aspect-square rounded-lg border border-transparent p-1',
                          'transition-colors hover:border-white/[0.12] active:scale-[0.98]',
                          isToday && 'ring-1 ring-brand/60'
                        )}
                      >
                        <p className="font-mono text-[10px] text-white/50 [font-variant-numeric:tabular-nums]">
                          {new Date(prediction.date).getDate()}
                        </p>
                        <div
                          className={cn(
                            'mx-auto mt-0.5 flex size-6 items-center justify-center rounded',
                            'font-mono text-[10px] [font-variant-numeric:tabular-nums]',
                            sealTileClasses(prediction.color)
                          )}
                        >
                          {prediction.kin}
                        </div>
                        {prediction.events.length > 0 && (
                          <span className="absolute right-1 top-1">
                            <IntensityDot intensity={prediction.intensity} size="sm" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Highlights */}
                {monthlyPrediction.highlights.length > 0 && (
                  <div className="mt-6">
                    <Eyebrow>Month highlights</Eyebrow>
                    <div className="mt-1 divide-y divide-white/[0.07]">
                      {monthlyPrediction.highlights.map((event, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 py-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-sm font-medium text-white/90">{event.title}</span>
                            <IntensityBadge intensity={event.intensity} size="sm" />
                          </div>
                          <span className="shrink-0 font-mono text-xs text-white/50 [font-variant-numeric:tabular-nums]">
                            {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legend — seal tokens only */}
                <div className="mt-4 flex items-center justify-center gap-4">
                  {SEAL_ORDER.map((seal) => (
                    <div key={seal} className="flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className={cn(
                          'size-3 rounded-[4px] border border-white/[0.12]',
                          SEAL_COLORS[seal].bg
                        )}
                      />
                      <Eyebrow className="text-[10px]">{seal}</Eyebrow>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="mt-4">
            {timeline ? (
              <div className="space-y-6">
                {/* Current Personal Year */}
                <div className="surface-card p-6">
                  <div className="flex flex-col gap-1">
                    <Eyebrow accent={flavor.accent}>Current personal year</Eyebrow>
                    <p className="font-mono text-xs text-white/50 [font-variant-numeric:tabular-nums]">
                      Age {timeline.currentPersonalYear.age} · {new Date(timeline.currentPersonalYear.startDate).toLocaleDateString()} – {new Date(timeline.currentPersonalYear.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-brand font-mono text-2xl text-white [font-variant-numeric:tabular-nums]">
                      {timeline.currentPersonalYear.kin}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-lg font-semibold tracking-tight text-white/90">
                        Kin {timeline.currentPersonalYear.kin}
                      </p>
                      <p className="text-sm text-white/50">
                        Your galactic signature for this personal year
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <PredictionTimeline timeline={timeline} maxItems={15} />
              </div>
            ) : (
              <div className="surface-card">
                <EmptyState
                  icon="predictions"
                  title="Your timeline needs a birth date"
                  description="Add your birth date in your profile to see galactic returns, tun birthdays, and other personal milestones."
                  action={{ label: 'Complete profile', href: '/app/profile' }}
                />
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-4">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </PageSection>

      {/* Disclaimer */}
      <p className="text-center text-xs text-white/35">
        Predictions are based on the Dreamspell calendar system. Use them for inspiration and self-awareness.
      </p>
    </div>
  )
}
