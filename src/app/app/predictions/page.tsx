'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/dashboard'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import {
  PredictionCard,
  PredictionTimeline,
  IntensityBadge,
  CalendarExport,
  NotificationSettings,
} from '@/components/predictions'
import {
  getDailyPrediction,
  getWeeklyPrediction,
  getMonthlyPrediction,
  getPersonalTimeline,
  getPersonalDailyPrediction,
} from '@/lib/services/predictions'
import type { PersonalTimeline, PredictionEvent } from '@/lib/types/prediction'

const colorClasses: Record<string, string> = {
  red: 'bg-red-500 text-white',
  white: 'bg-gray-100 text-gray-900 border border-gray-300',
  blue: 'bg-blue-500 text-white',
  yellow: 'bg-yellow-400 text-gray-900',
}

export default function PredictionsPage() {
  const { profile } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [mainTab, setMainTab] = useState<'forecast' | 'timeline' | 'settings'>('forecast')
  const [forecastView, setForecastView] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [timeline, setTimeline] = useState<PersonalTimeline | null>(null)

  // Get user's birth date from profile
  const userBirthDate = profile?.birth_date || null
  const userName = profile?.display_name || 'You'

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

  // Load personal timeline
  useEffect(() => {
    if (userBirthDate && profile?.user_id) {
      const tl = getPersonalTimeline(profile.user_id, userName, userBirthDate)
      setTimeline(tl)
    }
  }, [userBirthDate, profile?.user_id, userName])

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Predictions"
        subtitle={userBirthDate
          ? 'Personalized forecasts based on your birth date'
          : 'Daily, weekly, and monthly forecasts based on Dreamspell calendar'}
      />

      {/* Today's Quick View */}
      <div className="surface-card p-6 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading text-foreground">Today - {formatDate(new Date())}</h2>
          {today.events.length > 0 && (
            <IntensityBadge intensity={today.intensity} />
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold ${colorClasses[today.color]}`}>
            {today.kin}
          </div>
          <div className="flex-1">
            <p className="text-lg font-heading text-foreground">{today.toneName} {today.sealName}</p>
            <p className="text-sm text-muted-foreground">
              Kin {today.kin} - Day {today.wavespell.day} of {today.wavespell.name} Wavespell
            </p>
            <p className="text-sm text-muted-foreground">
              Theme: {today.wavespell.role}
            </p>
          </div>
        </div>
        {today.events.length > 0 && (
          <div className="mt-4 space-y-2">
            {today.events.map((event, i) => (
              <div key={i} className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{event.title}</span>
                  <IntensityBadge intensity={event.intensity} size="sm" />
                </div>
                <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as typeof mainTab)}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="timeline" disabled={!userBirthDate}>
            Timeline {!userBirthDate && '(Add birth date)'}
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          <div className="flex items-center justify-between">
            <Tabs value={forecastView} onValueChange={(v) => setForecastView(v as typeof forecastView)}>
              <TabsList className="bg-muted/50">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              {allEvents.length > 0 && (
                <CalendarExport events={allEvents} title="Export" />
              )}
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                <Calendar className="w-4 h-4 mr-1" />
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Daily View */}
          {forecastView === 'daily' && (
            <PredictionCard prediction={dailyPrediction} />
          )}

          {/* Weekly View */}
          {forecastView === 'weekly' && (
            <div className="surface-card p-6">
              <div className="mb-4">
                <h3 className="text-xl font-heading text-foreground">
                  Week of {formatShortDate(new Date(weeklyPrediction.startDate))} - {formatShortDate(new Date(weeklyPrediction.endDate))}
                </h3>
                {weeklyPrediction.events.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
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
                      className={`p-3 rounded-lg text-center transition-all hover:scale-105 ${
                        isToday ? 'ring-2 ring-primary ring-offset-2' : ''
                      } ${isSelected ? 'bg-primary/10' : ''}`}
                    >
                      <p className="text-xs text-muted-foreground mb-1">
                        {new Date(prediction.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className="text-sm font-medium text-foreground mb-2">
                        {new Date(prediction.date).getDate()}
                      </p>
                      <div className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-sm font-bold ${colorClasses[prediction.color]}`}>
                        {prediction.kin}
                      </div>
                      <p className="text-xs mt-1 truncate text-muted-foreground">{prediction.sealName}</p>
                      {prediction.events.length > 0 && (
                        <div className="mt-1 flex justify-center">
                          <IntensityBadge intensity={prediction.intensity} size="sm" showLabel={false} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Wavespell Progress */}
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2">Wavespell Progress</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{weeklyPrediction.days[0].wavespell.name}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(weeklyPrediction.days[0].wavespell.day / 13) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">Day {weeklyPrediction.days[0].wavespell.day}/13</span>
                </div>
              </div>
            </div>
          )}

          {/* Monthly View */}
          {forecastView === 'monthly' && (
            <div className="surface-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-heading text-foreground">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                {monthlyPrediction.highlights.length > 0 && (
                  <IntensityBadge intensity={monthlyPrediction.intensity} />
                )}
              </div>
              {monthlyPrediction.highlights.length > 0 && (
                <p className="text-sm text-muted-foreground mb-4">
                  {monthlyPrediction.highlights.length} significant event{monthlyPrediction.highlights.length > 1 ? 's' : ''} this month
                </p>
              )}

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
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
                      className={`aspect-square p-1 rounded-lg transition-all hover:bg-muted/50 relative ${
                        isToday ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <p className="text-xs text-muted-foreground">{new Date(prediction.date).getDate()}</p>
                      <div className={`w-6 h-6 mx-auto rounded flex items-center justify-center text-xs font-bold mt-0.5 ${colorClasses[prediction.color]}`}>
                        {prediction.kin}
                      </div>
                      {prediction.events.length > 0 && (
                        <div className="absolute top-0.5 right-0.5">
                          <IntensityBadge intensity={prediction.intensity} size="sm" showLabel={false} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Highlights */}
              {monthlyPrediction.highlights.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-heading text-foreground">Month Highlights</h4>
                  {monthlyPrediction.highlights.map((event, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border bg-card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{event.title}</span>
                          <IntensityBadge intensity={event.intensity} size="sm" />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Legend */}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-red-500" />
                  <span className="text-muted-foreground">Red</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-gray-100 border" />
                  <span className="text-muted-foreground">White</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-blue-500" />
                  <span className="text-muted-foreground">Blue</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-yellow-400" />
                  <span className="text-muted-foreground">Yellow</span>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          {timeline ? (
            <div className="space-y-6">
              {/* Current Personal Year */}
              <div className="surface-card p-6">
                <h3 className="text-xl font-heading text-foreground mb-2">Current Personal Year</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Age {timeline.currentPersonalYear.age} - {new Date(timeline.currentPersonalYear.startDate).toLocaleDateString()} to {new Date(timeline.currentPersonalYear.endDate).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold bg-primary text-primary-foreground">
                    {timeline.currentPersonalYear.kin}
                  </div>
                  <div>
                    <p className="text-lg font-heading text-foreground">
                      Kin {timeline.currentPersonalYear.kin}
                    </p>
                    <p className="text-muted-foreground">
                      Your galactic signature for this personal year
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <PredictionTimeline timeline={timeline} maxItems={15} />
            </div>
          ) : (
            <div className="surface-card p-8 text-center">
              <p className="text-muted-foreground">
                Add your birth date in your profile to see your personal timeline.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <NotificationSettings />
        </TabsContent>
      </Tabs>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center">
        Predictions are based on the Dreamspell calendar system. Use them for inspiration and self-awareness.
      </p>
    </div>
  )
}
