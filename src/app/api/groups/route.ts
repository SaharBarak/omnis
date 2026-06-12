import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { listGroups, createGroup } from '@/lib/db/repositories/groups-repo'

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  personIds: z.array(z.string()).optional(),
})

export async function GET() {
  try {
    const userId = await requireUserId()
    const groups = await listGroups(userId)
    return NextResponse.json({ groups })
  } catch (error) {
    return handleApiError(error, 'GET /api/groups')
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId()
    const body = await request.json()
    const { name, description, personIds } = createSchema.parse(body)
    const group = await createGroup(
      userId,
      { name, description },
      personIds ?? []
    )
    return NextResponse.json({ group }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/groups')
  }
}
