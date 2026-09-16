import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider } from '../components/providers/query-provider'
import { SessionProvider } from '../components/providers/session-provider'

export const metadata: Metadata = {
  title: 'ClassSync — School Scheduler',
  description: 'Manage teachers, subjects, rooms, and class schedules.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <QueryProvider>{children}</QueryProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
