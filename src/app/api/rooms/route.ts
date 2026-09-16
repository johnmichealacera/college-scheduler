import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-auth'

const createSchema = z.object({
  name: z.string().min(1),
})

export async function GET() {
  const { unauthorized } = await requireSession()
  if (unauthorized) return unauthorized

  const rooms = await db.room.findMany({
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(rooms)
}

export async function POST(request: NextRequest) {
  const { unauthorized } = await requireSession()
  if (unauthorized) return unauthorized

  const body = createSchema.parse(await request.json())
  const room = await db.room.create({ data: { name: body.name } })
  return NextResponse.json(room, { status: 201 })
}
