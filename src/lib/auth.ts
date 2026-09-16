import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required')
}

// Reuses bgfc-attendance-qr-webapp's own login (public.users) instead of a
// separate scheduler.users table, since it's the same physical database.
// This is a raw SQL read, not a Prisma model — see the note in schema.prisma
// for why public.users is deliberately never declared as a model here.
const ALLOWED_ROLES = ['ADMIN', 'FACULTY'] as const

interface BgfcUserRow {
  id: string
  name: string
  email: string
  passwordHash: string
  role: string
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const rows = await db.$queryRaw<BgfcUserRow[]>`
          SELECT id, name, email, "passwordHash", role::text as role
          FROM public.users
          WHERE email = ${credentials.email}
          LIMIT 1
        `
        const user = rows[0]

        if (!user) {
          return null
        }

        if (!ALLOWED_ROLES.includes(user.role as (typeof ALLOWED_ROLES)[number])) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/sign-in',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
