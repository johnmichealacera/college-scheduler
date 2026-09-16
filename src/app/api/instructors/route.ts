import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const createSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().min(1),
})

export async function GET() {
  const instructors = await db.instructor.findMany({
    orderBy: { fullName: 'asc' },
  })
  return NextResponse.json(instructors)
}

export async function POST(request: NextRequest) {
  const body = createSchema.parse(await request.json())
  const instructor = await db.instructor.create({
    data: { fullName: body.fullName, email: body.email },
  })
  return NextResponse.json(instructor, { status: 201 })
}
