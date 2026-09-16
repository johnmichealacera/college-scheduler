import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const updateSchema = z.object({
  fullName: z.string().min(1),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const body = updateSchema.parse(await request.json())
  const instructor = await db.instructor.update({
    where: { id },
    data: { fullName: body.fullName },
  })
  return NextResponse.json(instructor)
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  await db.instructor.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
