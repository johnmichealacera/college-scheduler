import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-auth'
import { dateToTimeString } from '@/lib/time'

interface RouteParams {
  params: Promise<{ studentId: string }>
}

function serialize<T extends { startTime: Date; endTime: Date }>(entry: T) {
  return {
    ...entry,
    startTime: dateToTimeString(entry.startTime),
    endTime: dateToTimeString(entry.endTime),
  }
}

// studentId here is a plain scalar filter on our own scheduler.enrollments
// table — no cross-schema read needed, unlike the raw-SQL routes elsewhere.
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { unauthorized } = await requireSession()
  if (unauthorized) return unauthorized

  const { studentId } = await params

  const enrollments = await db.enrollment.findMany({
    where: { studentId },
    include: {
      subject: {
        include: {
          classSchedules: { include: { subject: true, teacher: true, room: true } },
        },
      },
    },
  })

  const entries = enrollments.flatMap((e) => e.subject.classSchedules)
  return NextResponse.json(entries.map(serialize))
}
