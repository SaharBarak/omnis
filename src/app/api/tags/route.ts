import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { listTags, createTag } from '@/lib/db/repositories/people-repo'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  hebrew_name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
})

export async function GET() {
  try {
    const userId = await requireUserId()
    const tags = await listTags(userId)
    return NextResponse.json({ tags })
  } catch (error) {
    return handleApiError(error, 'GET /api/tags')
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId()
    const body = await request.json()
    const tag = createSchema.parse(body)
    const created = await createTag(userId, tag)
    return NextResponse.json({ tag: created }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/tags')
  }
}
