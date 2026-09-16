import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Layout } from '@/components/layout/Layout'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/sign-in')

  return <Layout email={session.user.email ?? session.user.name ?? ''}>{children}</Layout>
}
