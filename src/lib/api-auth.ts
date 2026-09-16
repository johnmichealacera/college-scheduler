import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

// Page-level redirects (in the (dashboard) layout) stop a browser from
// rendering protected pages without a session, but they do nothing to stop a
// direct request to an API route. Every API route handler that reads or
// writes scheduler data must call this first.
export async function requireSession() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return { session: null, unauthorized: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { session, unauthorized: null }
}
