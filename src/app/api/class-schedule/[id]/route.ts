import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { dateToTimeString, timeStringToDate } from '@/lib/time'

const include = { subject: true, teacher: true, room: true } as const

const updateSchema = z.object({
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

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const body = updateSchema.parse(await request.json())
  const entry = await db.classSchedule.update({
    where: { id },
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
  return NextResponse.json(serialize(entry))
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  await db.classSchedule.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
