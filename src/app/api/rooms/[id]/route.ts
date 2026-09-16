import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const updateSchema = z.object({
  name: z.string().min(1),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const body = updateSchema.parse(await request.json())
  const room = await db.room.update({ where: { id }, data: { name: body.name } })
  return NextResponse.json(room)
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  await db.room.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
