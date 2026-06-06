import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Sanitize Turso connection env values defensively. Two distinct corruptions
// show up depending on how the env is loaded:
//   1. Real trailing whitespace/newline — Vercel's runtime injects the stored
//      secret verbatim (the Turso token is stored with a trailing newline), so
//      a plain .trim() is required.
//   2. A LITERAL `\n`/`\r` escape — `vercel env pull` serializes that same
//      trailing-newline secret as the two-character escape `\n` inside a quoted
//      value. When that `.env.production.local` is `source`d into a shell (as
//      the CLI sync scripts do) the escape stays literal, so the token reaches
//      us as `...Cg\n` (backslash + n). .trim() does NOT remove it, leaving a
//      malformed bearer token that Turso rejects with HTTP 401 / SERVER_ERROR.
// base64url tokens never contain backslashes, so stripping trailing literal
// escape sequences is safe.
function sanitizeTursoEnv(v: string | undefined): string | undefined {
  if (v == null) return undefined
  return v.trim().replace(/(\\[rn])+$/g, '').trim()
}

function createPrismaClient() {
  // Use Turso in production (when TURSO_DATABASE_URL is set).
  const tursoUrl = sanitizeTursoEnv(process.env.TURSO_DATABASE_URL)
  const tursoToken = sanitizeTursoEnv(process.env.TURSO_AUTH_TOKEN)
  if (tursoUrl) {
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: tursoToken,
    })
    return new PrismaClient({ adapter } as any)
  }
  // Fall back to local SQLite for development
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
