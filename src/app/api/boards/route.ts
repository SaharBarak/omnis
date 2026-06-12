import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { listBoards, createBoard } from '@/lib/db/repositories/boards-repo'

const templateEnum = z.enum([
  'blank',
  'relationship-map',
  'family-tree',
  'yearly-overview',
  'personal-profile',
  'group-analysis',
])

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  template: templateEnum.nullable().optional(),
  canvas: z.record(z.string(), z.unknown()).optional(),
  layers: z.array(z.record(z.string(), z.unknown())).optional(),
})

export async function GET() {
  try {
    const userId = await requireUserId()
    const boards = await listBoards(userId)
    return NextResponse.json({ boards })
  } catch (error) {
    return handleApiError(error, 'GET /api/boards')
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId()
    const body = await request.json()
    const input = createSchema.parse(body)
    const board = await createBoard(userId, input)
    return NextResponse.json({ board }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/boards')
  }
}
