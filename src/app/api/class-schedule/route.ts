import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { dateToTimeString, timeStringToDate } from '@/lib/time'
import { requireSession } from '@/lib/api-auth'

const include = { subject: true, teacher: true, room: true } as const

const createSchema = z.object({
  subjectId: z.string().min(1),
  teacherId: z.string().min(1),
  roomId: z.string().min(1),
  day: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
})

function serialize<T extends { startTime: Date; endTime: Date }>(entry: T) {
  return {
    ...entry,
    startTime: dateToTimeString(entry.startTime),
    endTime: dateToTimeString(entry.endTime),
  }
}

export async function GET() {
  const { unauthorized } = await requireSession()
  if (unauthorized) return unauthorized

  const entries = await db.classSchedule.findMany({
    orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    include,
  })
  return NextResponse.json(entries.map(serialize))
}

export async function POST(request: NextRequest) {
  const { unauthorized } = await requireSession()
  if (unauthorized) return unauthorized

  const body = createSchema.parse(await request.json())
  const entry = await db.classSchedule.create({
    data: {
      subjectId: body.subjectId,
      teacherId: body.teacherId,
      roomId: body.roomId,
      day: body.day,
      startTime: timeStringToDate(body.startTime),
      endTime: timeStringToDate(body.endTime),
    },
    include,
  })
  return NextResponse.json(serialize(entry), { status: 201 })
}
