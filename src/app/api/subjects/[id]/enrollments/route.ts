import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-auth'
import { dateToTimeString } from '@/lib/time'
import { detectStudentConflicts } from '@/lib/utils'
import type { ClassSchedule } from '@/generated/prisma'
import type { ScheduleEntry } from '@/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

const createSchema = z.object({
  studentId: z.string().min(1),
})

// Raw SQL cross-schema join — scheduler.enrollments joined against bgfc's
// public.students/public.users. A LEFT JOIN so a student later removed from
// bgfc doesn't break the roster; it just comes back as `orphaned: true`.
interface RosterRow {
  id: string
  studentId: string
  enrolledAt: Date
  studentNumber: string | null
  course: string | null
  yearLevel: string | null
  name: string | null
  email: string | null
}

function toEntry(cs: ClassSchedule): ScheduleEntry {
  return {
    id: cs.id,
    subject_id: cs.subjectId,
    teacher_id: cs.teacherId,
    room_id: cs.roomId,
    day: cs.day as ScheduleEntry['day'],
    start_time: dateToTimeString(cs.startTime),
    end_time: dateToTimeString(cs.endTime),
    created_at: cs.createdAt.toISOString(),
  }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { unauthorized } = await requireSession()
  if (unauthorized) return unauthorized

  const { id } = await params

  const rows = await db.$queryRaw<RosterRow[]>`
    SELECT e.id, e.student_id as "studentId", e.enrolled_at as "enrolledAt",
           s."studentId" as "studentNumber", s.course, s."yearLevel",
           u.name, u.email
    FROM scheduler.enrollments e
    LEFT JOIN public.students s ON s.id = e.student_id
    LEFT JOIN public.users u ON u.id = s."userId"
    WHERE e.subject_id = ${id}
    ORDER BY u.name ASC NULLS LAST
  `

  const enrollments = rows.map((r) => ({
    id: r.id,
    subject_id: id,
    student_id: r.studentId,
    enrolled_at: r.enrolledAt.toISOString(),
    orphaned: r.name === null,
    student:
      r.name === null
        ? undefined
        : {
            id: r.studentId,
            student_id: r.studentNumber ?? '',
            name: r.name,
            email: r.email ?? '',
            course: r.course ?? '',
            year_level: r.yearLevel ?? '',
          },
  }))

  return NextResponse.json(enrollments)
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { unauthorized } = await requireSession()
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = createSchema.parse(await request.json())

  const subject = await db.subject.findUnique({
    where: { id },
    include: { classSchedules: true, _count: { select: { enrollments: true } } },
  })
  if (!subject) {
    return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
  }
  if (subject._count.enrollments >= subject.maxCapacity) {
    return NextResponse.json({ error: 'This subject is at full capacity' }, { status: 409 })
  }

  const otherEnrollments = await db.enrollment.findMany({
    where: { studentId: body.studentId, NOT: { subjectId: id } },
    include: { subject: { include: { classSchedules: true } } },
  })

  const proposedEntries = subject.classSchedules.map(toEntry)
  const existingEntries: ScheduleEntry[] = otherEnrollments.flatMap((enrollment) =>
    enrollment.subject.classSchedules.map((cs) => ({
      ...toEntry(cs),
      subject: {
        id: enrollment.subject.id,
        name: enrollment.subject.name,
        teacher_id: enrollment.subject.instructorId,
        max_capacity: enrollment.subject.maxCapacity,
        created_at: enrollment.subject.createdAt.toISOString(),
      },
    }))
  )

  const conflicts = detectStudentConflicts(proposedEntries, existingEntries)
  if (conflicts.length > 0) {
    return NextResponse.json({ error: 'Scheduling conflict', conflicts }, { status: 409 })
  }

  try {
    const enrollment = await db.enrollment.create({
      data: { subjectId: id, studentId: body.studentId },
    })
    return NextResponse.json(enrollment, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Student is already enrolled in this subject' }, { status: 409 })
    }
    throw error
  }
}
