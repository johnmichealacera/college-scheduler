import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider } from '../components/providers/query-provider'
import { Layout } from '../components/layout/Layout'

export const metadata: Metadata = {
  title: 'ClassSync — School Scheduler',
  description: 'Manage teachers, subjects, rooms, and class schedules.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <Layout>{children}</Layout>
        </QueryProvider>
      </body>
    </html>
  )
}
