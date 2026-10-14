import { fail, ok, readJson } from '@/lib/api'
import { hashPassword } from '@/lib/auth/password'
import { consumeAttempt, getClientIp } from '@/lib/auth/rate-limit'
import { createUserSession } from '@/lib/auth/session'
import { formatZodError, registerSchema } from '@/lib/validation/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  const ip = getClientIp(request)

  const limit = await consumeAttempt('register', ip)
  if (!limit.allowed) {
    return fail(
      `Juda ko'p urinish. ${Math.ceil(limit.retryAfterSeconds / 60)} daqiqadan keyin qayta urinib ko'ring.`,
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    )
  }

  const body = await readJson(request)
  if (!body) return fail("So'rov formati noto'g'ri")

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    const { fieldErrors } = formatZodError(parsed.error)
    return fail("Ma'lumotlarni tekshiring", { fieldErrors })
  }

  const { phone, password, fullName } = parsed.data

  const existing = await prisma.user.findUnique({
    where: { phone },
    select: { id: true },
  })
  if (existing) {
    return fail('Bu raqam allaqachon ro\'yxatdan o\'tgan', {
      fieldErrors: { phone: "Bu raqam band. Kirishni sinab ko'ring." },
    })
  }

  const passwordHash = await hashPassword(password)

  const user = await prisma.user.create({
    data: { phone, passwordHash, fullName: fullName ?? null },
    select: { id: true, phone: true, fullName: true },
  })

  await createUserSession(user.id)

  return ok({ user }, { status: 201 })
}
