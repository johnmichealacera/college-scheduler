import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-auth'

const updateSchema = z.object({
  name: z.string().min(1),
  instructorId: z.string().nullable(),
  maxCapacity: z.number().int().min(1),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { unauthorized } = await requireSession()
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = updateSchema.parse(await request.json())
  const subject = await db.subject.update({
    where: { id },
    data: { name: body.name, instructorId: body.instructorId, maxCapacity: body.maxCapacity },
    include: {
      instructor: { select: { id: true, fullName: true, createdAt: true } },
      _count: { select: { enrollments: true } },
    },
  })
  return NextResponse.json(subject)
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { unauthorized } = await requireSession()
  if (unauthorized) return unauthorized

  const { id } = await params
  await db.subject.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
