import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { getRelationshipGraph } from '@/lib/db/repositories/relationships-repo'

export async function GET() {
  try {
    const userId = await requireUserId()
    const graph = await getRelationshipGraph(userId)
    return NextResponse.json(graph)
  } catch (error) {
    return handleApiError(error, 'GET /api/relationships/graph')
  }
}
