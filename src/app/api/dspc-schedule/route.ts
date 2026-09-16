import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { dateToIsoDateString, dateToTimeString, isoDateToDate, timeStringToDate } from '@/lib/time'

const include = { facilitator: true, room: true } as const

const createSchema = z.object({
  contest: z.string().min(1),
  language: z.string().min(1),
  level: z.string().min(1),
  facilitatorId: z.string().nullable(),
  roomId: z.string().min(1),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
})

function serialize<T extends { eventDate: Date; startTime: Date; endTime: Date }>(entry: T) {
  return {
    ...entry,
    eventDate: dateToIsoDateString(entry.eventDate),
    startTime: dateToTimeString(entry.startTime),
    endTime: dateToTimeString(entry.endTime),
  }
}

export async function GET() {
  const entries = await db.dspcSchedule.findMany({
    orderBy: [{ eventDate: 'asc' }, { startTime: 'asc' }],
    include,
  })
  return NextResponse.json(entries.map(serialize))
}

export async function POST(request: NextRequest) {
  const body = createSchema.parse(await request.json())
  const entry = await db.dspcSchedule.create({
    data: {
      contest: body.contest,
      language: body.language,
      level: body.level,
      facilitatorId: body.facilitatorId,
      roomId: body.roomId,
      eventDate: isoDateToDate(body.eventDate),
      startTime: timeStringToDate(body.startTime),
      endTime: timeStringToDate(body.endTime),
    },
    include,
  })
  return NextResponse.json(serialize(entry), { status: 201 })
}
