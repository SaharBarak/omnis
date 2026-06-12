import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { getRecentBoards } from '@/lib/db/repositories/boards-repo'

export async function GET(request: Request) {
  try {
    const userId = await requireUserId()
    const limitParam = new URL(request.url).searchParams.get('limit')
    const parsed = limitParam ? Number(limitParam) : 10
    const limit = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : 10

    const boards = await getRecentBoards(userId, limit)
    return NextResponse.json({ boards })
  } catch (error) {
    return handleApiError(error, 'GET /api/boards/recent')
  }
}
