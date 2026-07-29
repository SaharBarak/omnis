import { NextRequest, NextResponse } from 'next/server'
import { getDailyPrediction, getPersonalDailyPrediction } from '@pleiad/engine/services/predictions'
import { isAuthorizedCron } from '@/lib/api/cron-auth'
import {
  systemListPeopleWithBirthDate,
  systemListPredictionKeysForPeople,
  systemInsertPredictions,
  systemDeleteExpiredPredictions,
  type UpsertPredictionInput,
} from '@/lib/db/repositories/predictions-repo'

export const dynamic = 'force-dynamic'

// This endpoint is called by Vercel Cron at 4am UTC daily
// Configure in vercel.json: {"crons": [{"path": "/api/cron/daily-predictions", "schedule": "0 4 * * *"}]}
//
// SYSTEM CONTEXT: authorized solely by CRON_SECRET. It generates predictions
// across every owner's people, so it deliberately does NOT call requireUserId().
// Owner isolation is preserved by persisting each prediction's owner_id from the
// originating person row (never from request input).

export async function GET(request: NextRequest) {
  // Verify cron secret — fail closed regardless of environment.
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date().toISOString().split('T')[0]

    // Get today's base prediction
    const dailyPrediction = getDailyPrediction(today)

    // Get all people with birth dates (system-wide).
    let people: { id: string; owner_id: string; birth_date: string; name: string }[]
    try {
      people = await systemListPeopleWithBirthDate()
    } catch (peopleError) {
      console.error('Error fetching people:', peopleError)
      return NextResponse.json(
        { error: 'Failed to fetch people' },
        { status: 500 }
      )
    }

    let predictionsGenerated = 0
    let errors = 0

    // Predictions are pure engine computations — run them all first, then talk
    // to the database twice: one query for the existing (person, type, start)
    // keys, one bulk insert of whatever is new. The previous shape did an
    // existence check + insert PER EVENT PER PERSON, which is N×M round trips
    // to a far-away database and would outgrow the cron window with the user
    // base.
    const candidates: UpsertPredictionInput[] = []
    for (const person of people) {
      if (!person.birth_date) continue
      try {
        const personalPrediction = getPersonalDailyPrediction(
          today,
          person.birth_date,
          person.id
        )
        for (const event of personalPrediction.events) {
          candidates.push({
            person_id: person.id,
            owner_id: person.owner_id,
            system: event.system,
            type: event.type,
            start_date: event.startDate,
            end_date: event.endDate,
            intensity: event.intensity,
            themes: event.themes,
            data: event.data as Record<string, unknown>,
            computed_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 86400000), // 30 days
          })
        }
      } catch (err) {
        console.error(`Error processing person ${person.id}:`, err)
        errors++
      }
    }

    const existingKeys = await systemListPredictionKeysForPeople(
      Array.from(new Set(candidates.map((c) => c.person_id)))
    )
    const fresh = candidates.filter(
      (c) => !existingKeys.has(`${c.person_id}|${c.type}|${c.start_date}`)
    )

    // Chunked bulk inserts: bounded statement size, and one failing chunk
    // doesn't void the rest.
    const CHUNK = 100
    for (let i = 0; i < fresh.length; i += CHUNK) {
      const chunk = fresh.slice(i, i + CHUNK)
      try {
        await systemInsertPredictions(chunk)
        predictionsGenerated += chunk.length
      } catch (insertError) {
        console.error('Error inserting prediction chunk:', insertError)
        errors += chunk.length
      }
    }

    // Clean up expired predictions
    try {
      await systemDeleteExpiredPredictions()
    } catch (deleteError) {
      console.error('Error cleaning up expired predictions:', deleteError)
    }

    return NextResponse.json({
      success: true,
      date: today,
      kin: dailyPrediction.kin,
      predictionsGenerated,
      errors,
      peopleProcessed: people.length,
    })
  } catch (error) {
    console.error('Daily predictions cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
