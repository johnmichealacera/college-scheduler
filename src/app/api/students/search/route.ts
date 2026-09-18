import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-auth'

const querySchema = z.object({
  q: z.string().min(1).max(100),
  subjectId: z.string().min(1).optional(),
})

// Raw SQL, not a Prisma model — students live in bgfc-attendance-qr-webapp's
// public schema, which this app's Prisma schema deliberately never declares
// (see prisma/schema.prisma). Same pattern as src/lib/auth.ts.
interface BgfcStudentRow {
  id: string
  studentId: string
  name: string
  email: string
  course: string
  yearLevel: string
}

export async function GET(request: NextRequest) {
  const { unauthorized } = await requireSession()
  if (unauthorized) return unauthorized

  const { q, subjectId } = querySchema.parse({
    q: request.nextUrl.searchParams.get('q') ?? '',
    subjectId: request.nextUrl.searchParams.get('subjectId') ?? undefined,
  })

  const like = `%${q}%`
  const rows = await db.$queryRaw<BgfcStudentRow[]>`
    SELECT s.id, s."studentId", u.name, u.email, s.course, s."yearLevel"
    FROM public.students s
    JOIN public.users u ON u.id = s."userId"
    WHERE u.name ILIKE ${like} OR s."studentId" ILIKE ${like}
    ORDER BY u.name ASC
    LIMIT 20
  `

  let enrolledIds = new Set<string>()
  if (subjectId && rows.length > 0) {
    const enrollments = await db.enrollment.findMany({
      where: { subjectId, studentId: { in: rows.map((r) => r.id) } },
      select: { studentId: true },
    })
    enrolledIds = new Set(enrollments.map((e) => e.studentId))
  }

  const students = rows.map((r) => ({
    id: r.id,
    student_id: r.studentId,
    name: r.name,
    email: r.email,
    course: r.course,
    year_level: r.yearLevel,
    already_enrolled: enrolledIds.has(r.id),
  }))

  return NextResponse.json(students)
}
