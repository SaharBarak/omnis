'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Dreamspell calculation utilities
const SEALS = [
  'Dragon', 'Wind', 'Night', 'Seed', 'Serpent',
  'World-Bridger', 'Hand', 'Star', 'Moon', 'Dog',
  'Monkey', 'Human', 'Skywalker', 'Wizard', 'Eagle',
  'Warrior', 'Earth', 'Mirror', 'Storm', 'Sun'
]

const TONES = [
  'Magnetic', 'Lunar', 'Electric', 'Self-Existing', 'Overtone',
  'Rhythmic', 'Resonant', 'Galactic', 'Solar', 'Planetary',
  'Spectral', 'Crystal', 'Cosmic'
]

const COLORS = ['Red', 'White', 'Blue', 'Yellow']

const WAVESPELL_THEMES = [
  'Purpose', 'Challenge', 'Service', 'Form', 'Radiance',
  'Equality', 'Attunement', 'Integrity', 'Intention', 'Manifestation',
  'Liberation', 'Cooperation', 'Transcendence'
]

// Reference date: July 26, 2024 = Kin 1 (Red Magnetic Dragon)
const REFERENCE_DATE = new Date(2024, 6, 26) // July 26, 2024
const REFERENCE_KIN = 1

function calculateKin(date: Date): number {
  const diffTime = date.getTime() - REFERENCE_DATE.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  let kin = ((REFERENCE_KIN - 1 + diffDays) % 260)
  if (kin < 0) kin += 260
  return kin + 1
}

function kinToSealTone(kin: number): { seal: number; tone: number; sealName: string; toneName: string; color: string } {
  const seal = (kin - 1) % 20
  const tone = (kin - 1) % 13
  return {
    seal,
    tone,
    sealName: SEALS[seal],
    toneName: TONES[tone],
    color: COLORS[seal % 4]
  }
}

function getWavespellInfo(kin: number): { wavespellKin: number; dayInWavespell: number; wavespellName: string } {
  const wavespellKin = Math.floor((kin - 1) / 13) * 13 + 1
  const dayInWavespell = ((kin - 1) % 13) + 1
  const wavespellSeal = (wavespellKin - 1) % 20
  return {
    wavespellKin,
    dayInWavespell,
    wavespellName: SEALS[wavespellSeal]
  }
}

function getCastleInfo(kin: number): { castle: number; castleName: string; castleColor: string; dayInCastle: number } {
  const castle = Math.floor((kin - 1) / 52)
  const dayInCastle = ((kin - 1) % 52) + 1
  const castleNames = ['Red Eastern', 'White Northern', 'Blue Western', 'Yellow Southern', 'Green Central']
  const castleColors = ['#EF4444', '#F5F5F5', '#3B82F6', '#EAB308', '#22C55E']
  return {
    castle,
    castleName: castleNames[castle],
    castleColor: castleColors[castle],
    dayInCastle
  }
}

interface DailyPrediction {
  date: Date
  kin: number
  seal: number
  tone: number
  sealName: string
  toneName: string
  color: string
  wavespell: {
    kin: number
    day: number
    name: string
    theme: string
  }
  castle: {
    number: number
    name: string
    color: string
    day: number
  }
}

function getDailyPrediction(date: Date): DailyPrediction {
  const kin = calculateKin(date)
  const { seal, tone, sealName, toneName, color } = kinToSealTone(kin)
  const { wavespellKin, dayInWavespell, wavespellName } = getWavespellInfo(kin)
  const { castle, castleName, castleColor, dayInCastle } = getCastleInfo(kin)

  return {
    date,
    kin,
    seal,
    tone,
    sealName,
    toneName,
    color,
    wavespell: {
      kin: wavespellKin,
      day: dayInWavespell,
      name: wavespellName,
      theme: WAVESPELL_THEMES[dayInWavespell - 1]
    },
    castle: {
      number: castle,
      name: castleName,
      color: castleColor,
      day: dayInCastle
    }
  }
}

function getWeekPredictions(startDate: Date): DailyPrediction[] {
  const predictions: DailyPrediction[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    predictions.push(getDailyPrediction(date))
  }
  return predictions
}

function getMonthPredictions(year: number, month: number): DailyPrediction[] {
  const predictions: DailyPrediction[] = []
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let day = 1; day <= daysInMonth; day++) {
    predictions.push(getDailyPrediction(new Date(year, month, day)))
  }
  return predictions
}

function getColorClass(color: string): string {
  switch (color) {
    case 'Red': return 'bg-red-500 text-white'
    case 'White': return 'bg-gray-100 text-gray-900 border border-gray-300'
    case 'Blue': return 'bg-blue-500 text-white'
    case 'Yellow': return 'bg-yellow-400 text-gray-900'
    default: return 'bg-gray-500 text-white'
  }
}

export default function PredictionsPage() {
  const { profile } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  const today = useMemo(() => getDailyPrediction(new Date()), [])

  const dailyPrediction = useMemo(() => getDailyPrediction(selectedDate), [selectedDate])

  const weekPredictions = useMemo(() => {
    const startOfWeek = new Date(selectedDate)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    return getWeekPredictions(startOfWeek)
  }, [selectedDate])

  const monthPredictions = useMemo(() => {
    return getMonthPredictions(selectedDate.getFullYear(), selectedDate.getMonth())
  }, [selectedDate])

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    if (view === 'daily') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    } else if (view === 'weekly') {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Predictions</h1>
        <p className="text-muted-foreground">
          Daily, weekly, and monthly forecasts based on Dreamspell calendar
        </p>
      </div>

      {/* Today's Quick View */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Today - {formatDate(new Date())}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold ${getColorClass(today.color)}`}>
              {today.kin}
            </div>
            <div>
              <p className="text-lg font-semibold">{today.toneName} {today.color} {today.sealName}</p>
              <p className="text-sm text-muted-foreground">
                Kin {today.kin} - Day {today.wavespell.day} of {today.wavespell.name} Wavespell
              </p>
              <p className="text-sm text-muted-foreground">
                Theme: {today.wavespell.theme}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as 'daily' | 'weekly' | 'monthly')}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
              Next
            </Button>
          </div>
        </div>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>{formatDate(selectedDate)}</CardTitle>
              <CardDescription>Kin {dailyPrediction.kin}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Kin Display */}
              <div className="flex items-start gap-6">
                <div className={`w-24 h-24 rounded-xl flex items-center justify-center text-4xl font-bold shadow-lg ${getColorClass(dailyPrediction.color)}`}>
                  {dailyPrediction.kin}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">
                    {dailyPrediction.toneName} {dailyPrediction.color} {dailyPrediction.sealName}
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Tone {dailyPrediction.tone + 1} - Seal {dailyPrediction.seal + 1}
                  </p>
                </div>
              </div>

              {/* Wavespell Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Wavespell</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">{dailyPrediction.wavespell.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Day {dailyPrediction.wavespell.day} of 13
                    </p>
                    <div className="w-full h-2 bg-muted rounded-full mt-2">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(dailyPrediction.wavespell.day / 13) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm mt-2">
                      <span className="font-medium">Theme:</span> {dailyPrediction.wavespell.theme}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Castle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">{dailyPrediction.castle.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Day {dailyPrediction.castle.day} of 52
                    </p>
                    <div className="w-full h-2 bg-muted rounded-full mt-2">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(dailyPrediction.castle.day / 52) * 100}%`,
                          backgroundColor: dailyPrediction.castle.color
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle>
                Week of {formatShortDate(weekPredictions[0].date)} - {formatShortDate(weekPredictions[6].date)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weekPredictions.map((prediction, index) => {
                  const isToday = prediction.date.toDateString() === new Date().toDateString()
                  const isSelected = prediction.date.toDateString() === selectedDate.toDateString()
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedDate(prediction.date)
                        setView('daily')
                      }}
                      className={`p-3 rounded-lg text-center transition-all hover:scale-105 ${
                        isToday ? 'ring-2 ring-primary ring-offset-2' : ''
                      } ${isSelected ? 'bg-primary/10' : ''}`}
                    >
                      <p className="text-xs text-muted-foreground mb-1">
                        {prediction.date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className="text-sm font-medium mb-2">
                        {prediction.date.getDate()}
                      </p>
                      <div className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-sm font-bold ${getColorClass(prediction.color)}`}>
                        {prediction.kin}
                      </div>
                      <p className="text-xs mt-1 truncate">{prediction.sealName}</p>
                    </button>
                  )
                })}
              </div>

              {/* Wavespell Progress */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Wavespell Progress</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs">{weekPredictions[0].wavespell.name}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(weekPredictions[0].wavespell.day / 13) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs">Day {weekPredictions[0].wavespell.day}/13</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
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

                {monthPredictions.map((prediction, index) => {
                  const isToday = prediction.date.toDateString() === new Date().toDateString()
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedDate(prediction.date)
                        setView('daily')
                      }}
                      className={`aspect-square p-1 rounded-lg transition-all hover:bg-muted/50 ${
                        isToday ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <p className="text-xs text-muted-foreground">{prediction.date.getDate()}</p>
                      <div className={`w-6 h-6 mx-auto rounded flex items-center justify-center text-xs font-bold mt-0.5 ${getColorClass(prediction.color)}`}>
                        {prediction.kin}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-red-500" />
                  <span>Red</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-gray-100 border" />
                  <span>White</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-blue-500" />
                  <span>Blue</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-yellow-400" />
                  <span>Yellow</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center">
        Predictions are based on the Dreamspell calendar system. Use them for inspiration and self-awareness.
      </p>
    </div>
  )
}
