import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { boardEntitlement } from '@/lib/api/board-entitlement'
import { listBoards, createBoard } from '@/lib/db/repositories/boards-repo'
import { PLANS } from '@/lib/services/billing'

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

    const { plan, limits, refusal } = await boardEntitlement(userId)
    if (refusal) return refusal

    // People on the board are capped by the same per-tier profiles limit that
    // governs the map — a board is the map re-arranged, not a way around it.
    const peopleOnBoard = new Set(
      (input.canvas?.nodes as Array<{ type?: string; personId?: string }> | undefined)
        ?.filter((n) => n.type === 'person' && typeof n.personId === 'string')
        .map((n) => n.personId as string) ?? []
    ).size
    if (limits.profiles !== Infinity && peopleOnBoard > limits.profiles) {
      return NextResponse.json(
        {
          error: `This board holds ${peopleOnBoard} people, but ${PLANS[plan].name} covers ${limits.profiles}. Upgrade to map more people together.`,
          code: 'limit_exceeded',
        },
        { status: 403 }
      )
    }

    const board = await createBoard(userId, input)
    return NextResponse.json({ board }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/boards')
  }
}
