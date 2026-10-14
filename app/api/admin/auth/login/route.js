import { fail, ok, readJson } from '@/lib/api'
import { verifyPassword } from '@/lib/auth/password'
import { consumeAttempt, getClientIp, resetAttempts } from '@/lib/auth/rate-limit'
import { createAdminSession } from '@/lib/auth/session'
import { adminLoginSchema, formatZodError } from '@/lib/validation/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  const ip = getClientIp(request)

  const limit = await consumeAttempt('login', `admin:${ip}`)
  if (!limit.allowed) {
    return fail(
      `Juda ko'p urinish. ${Math.ceil(limit.retryAfterSeconds / 60)} daqiqadan keyin qayta urinib ko'ring.`,
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    )
  }

  const body = await readJson(request)
  if (!body) return fail("So'rov formati noto'g'ri")

  const parsed = adminLoginSchema.safeParse(body)
  if (!parsed.success) {
    const { fieldErrors } = formatZodError(parsed.error)
    return fail("Ma'lumotlarni tekshiring", { fieldErrors })
  }

  const { username, password } = parsed.data

  const admin = await prisma.adminUser.findUnique({
    where: { username },
    select: { id: true, username: true, role: true, passwordHash: true },
  })

  const valid = await verifyPassword(password, admin?.passwordHash)

  if (!admin || !valid) {
    return fail("Login yoki parol noto'g'ri", { status: 401 })
  }

  await resetAttempts('login', `admin:${ip}`)
  await createAdminSession(admin.id, admin.role)

  return ok({ admin: { id: admin.id, username: admin.username, role: admin.role } })
}
