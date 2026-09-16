import { PrismaClient } from '../generated/prisma'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

// Vercel runs each request as a short-lived serverless function, each opening
// its own Postgres connection — without pgbouncer transaction pooling this
// exhausts Neon's connection limit under concurrent traffic. Mirrors the same
// fix already in use by bgfc-attendance-qr-webapp against this same database.
function withNeonServerlessParams(databaseUrl: string) {
  const isNeon = databaseUrl.includes('neon.tech') || databaseUrl.includes('-pooler.')
  if (!isNeon) return databaseUrl

  const [base, query = ''] = databaseUrl.split('?')
  const params = new URLSearchParams(query)
  params.set('pgbouncer', 'true')
  params.set('connection_limit', '5')
  params.set('pool_timeout', '20')
  params.set('connect_timeout', '15')
  return `${base}?${params.toString()}`
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL ? withNeonServerlessParams(process.env.DATABASE_URL) : undefined
  return new PrismaClient({
    ...(url ? { datasources: { db: { url } } } : {}),
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
