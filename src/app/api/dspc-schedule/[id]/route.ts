import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { dateToIsoDateString, dateToTimeString, isoDateToDate, timeStringToDate } from '@/lib/time'

const include = { facilitator: true, room: true } as const

const updateSchema = z.object({
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

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const body = updateSchema.parse(await request.json())
  const entry = await db.dspcSchedule.update({
    where: { id },
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
  return NextResponse.json(serialize(entry))
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  await db.dspcSchedule.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
