import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const createSchema = z.object({
  name: z.string().min(1),
  instructorId: z.string().nullable(),
})

export async function GET() {
  const subjects = await db.subject.findMany({
    orderBy: { name: 'asc' },
    include: {
      instructor: { select: { id: true, fullName: true, createdAt: true } },
    },
  })
  return NextResponse.json(subjects)
}

export async function POST(request: NextRequest) {
  const body = createSchema.parse(await request.json())
  const subject = await db.subject.create({
    data: {
      name: body.name,
      instructorId: body.instructorId,
      maxCapacity: 40,
    },
    include: {
      instructor: { select: { id: true, fullName: true, createdAt: true } },
    },
  })
  return NextResponse.json(subject, { status: 201 })
}
