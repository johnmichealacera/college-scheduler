import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const createSchema = z.object({
  name: z.string().min(1),
})

export async function GET() {
  const rooms = await db.room.findMany({
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(rooms)
}

export async function POST(request: NextRequest) {
  const body = createSchema.parse(await request.json())
  const room = await db.room.create({ data: { name: body.name } })
  return NextResponse.json(room, { status: 201 })
}
