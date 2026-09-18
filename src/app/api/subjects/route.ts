import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-auth'

const createSchema = z.object({
  name: z.string().min(1),
  instructorId: z.string().nullable(),
  maxCapacity: z.number().int().min(1).default(40),
})

export async function GET() {
  const { unauthorized } = await requireSession()
  if (unauthorized) return unauthorized

  const subjects = await db.subject.findMany({
    orderBy: { name: 'asc' },
    include: {
      instructor: { select: { id: true, fullName: true, createdAt: true } },
      _count: { select: { enrollments: true } },
    },
  })
  return NextResponse.json(subjects)
}

export async function POST(request: NextRequest) {
  const { unauthorized } = await requireSession()
  if (unauthorized) return unauthorized

  const body = createSchema.parse(await request.json())
  const subject = await db.subject.create({
    data: {
      name: body.name,
      instructorId: body.instructorId,
      maxCapacity: body.maxCapacity,
    },
    include: {
      instructor: { select: { id: true, fullName: true, createdAt: true } },
      _count: { select: { enrollments: true } },
    },
  })
  return NextResponse.json(subject, { status: 201 })
}
