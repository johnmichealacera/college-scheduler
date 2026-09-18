import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-auth'

interface RouteParams {
  params: Promise<{ id: string; enrollmentId: string }>
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { unauthorized } = await requireSession()
  if (unauthorized) return unauthorized

  const { enrollmentId } = await params
  await db.enrollment.delete({ where: { id: enrollmentId } })
  return new NextResponse(null, { status: 204 })
}
