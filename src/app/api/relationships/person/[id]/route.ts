import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { getPersonRelationships } from '@/lib/db/repositories/relationships-repo'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const relationships = await getPersonRelationships(userId, id)
    return NextResponse.json({ relationships })
  } catch (error) {
    return handleApiError(error, 'GET /api/relationships/person/[id]')
  }
}
