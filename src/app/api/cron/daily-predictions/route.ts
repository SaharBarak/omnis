import { NextRequest, NextResponse } from 'next/server'
import { getDailyPrediction, getPersonalDailyPrediction } from '@/lib/services/predictions'
import {
  systemListPeopleWithBirthDate,
  systemPredictionExists,
  systemInsertPrediction,
  systemDeleteExpiredPredictions,
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
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
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

    // Generate personalized predictions for each person
    for (const person of people) {
      if (!person.birth_date) continue

      try {
        // Get personalized prediction
        const personalPrediction = getPersonalDailyPrediction(
          today,
          person.birth_date,
          person.id
        )

        // If there are events, store them in the predictions table
        for (const event of personalPrediction.events) {
          // Check if prediction already exists
          const exists = await systemPredictionExists(
            person.id,
            event.type,
            event.startDate
          )

          if (exists) {
            continue // Skip if already exists
          }

          // Insert prediction (owner_id taken from the person row)
          try {
            await systemInsertPrediction({
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
            predictionsGenerated++
          } catch (insertError) {
            console.error(`Error inserting prediction for person ${person.id}:`, insertError)
            errors++
          }
        }
      } catch (err) {
        console.error(`Error processing person ${person.id}:`, err)
        errors++
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
