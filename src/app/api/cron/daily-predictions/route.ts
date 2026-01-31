import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getDailyPrediction, getPersonalDailyPrediction } from '@/lib/services/predictions'
import type { PredictionEvent } from '@/lib/types/prediction'

export const dynamic = 'force-dynamic'

// This endpoint is called by Vercel Cron at 4am UTC daily
// Configure in vercel.json: {"crons": [{"path": "/api/cron/daily-predictions", "schedule": "0 4 * * *"}]}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(url, serviceKey)
}

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const supabase = getSupabaseAdmin()
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

    // Get today's base prediction
    const dailyPrediction = getDailyPrediction(today)

    // Get all people with birth dates
    const { data: people, error: peopleError } = await supabase
      .from('people')
      .select('id, owner_id, birth_date, first_name')
      .not('birth_date', 'is', null)

    if (peopleError) {
      console.error('Error fetching people:', peopleError)
      return NextResponse.json(
        { error: 'Failed to fetch people' },
        { status: 500 }
      )
    }

    let predictionsGenerated = 0
    let errors = 0

    // Generate personalized predictions for each person
    for (const person of people || []) {
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
          const { data: existing } = await supabase
            .from('predictions')
            .select('id')
            .eq('person_id', person.id)
            .eq('type', event.type)
            .eq('start_date', event.startDate)
            .single()

          if (existing) {
            continue // Skip if already exists
          }

          // Insert prediction
          const { error: insertError } = await supabase
            .from('predictions')
            .insert({
              person_id: person.id,
              owner_id: person.owner_id,
              system: event.system,
              type: event.type,
              start_date: event.startDate,
              end_date: event.endDate,
              intensity: event.intensity,
              themes: event.themes,
              data: event.data,
              computed_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), // 30 days
            })

          if (insertError) {
            console.error(`Error inserting prediction for person ${person.id}:`, insertError)
            errors++
          } else {
            predictionsGenerated++
          }
        }
      } catch (err) {
        console.error(`Error processing person ${person.id}:`, err)
        errors++
      }
    }

    // Clean up expired predictions
    const { error: deleteError } = await supabase
      .from('predictions')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (deleteError) {
      console.error('Error cleaning up expired predictions:', deleteError)
    }

    return NextResponse.json({
      success: true,
      date: today,
      kin: dailyPrediction.kin,
      predictionsGenerated,
      errors,
      peopleProcessed: people?.length || 0,
    })
  } catch (error) {
    console.error('Daily predictions cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
