import { NextResponse } from 'next/server'
import { z } from 'zod'
import { connectMongo } from '@/lib/db/connection'
import { Profile } from '@/lib/db/models'
import { requireUserId, UnauthorizedError } from '@/lib/auth-server'

const birthPlaceSchema = z
  .object({
    lat: z.number().optional(),
    lng: z.number().optional(),
    name: z.string().optional(),
  })
  .nullable()

const updateSchema = z.object({
  display_name: z.string().min(1).max(200).optional(),
  birth_date: z.string().optional().nullable(),
  birth_time: z.string().optional().nullable(),
  birth_place: birthPlaceSchema.optional(),
  hebrew_name: z.string().optional().nullable(),
  avatar_url: z.string().optional().nullable(),
  locale: z.enum(['he', 'en']).optional(),
  timezone: z.string().optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
  onboarding_completed: z.boolean().optional(),
})

export async function GET() {
  try {
    const userId = await requireUserId()
    await connectMongo()
    const profile = await Profile.findOne({ user_id: userId }).lean()
    return NextResponse.json({ profile: profile ?? null })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('GET /api/profile failed:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await requireUserId()
    const body = await request.json()
    const updates = updateSchema.parse(body)

    await connectMongo()
    const profile = await Profile.findOneAndUpdate(
      { user_id: userId },
      { $set: updates },
      { new: true, upsert: false }
    ).lean()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    return NextResponse.json({ profile })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }
    console.error('PATCH /api/profile failed:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
