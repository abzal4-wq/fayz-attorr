import { fail, ok, readJson } from '@/lib/api'
import { verifyPassword } from '@/lib/auth/password'
import { consumeAttempt, getClientIp, resetAttempts } from '@/lib/auth/rate-limit'
import { createUserSession } from '@/lib/auth/session'
import { formatZodError, loginSchema } from '@/lib/validation/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  const ip = getClientIp(request)

  const limit = await consumeAttempt('login', ip)
  if (!limit.allowed) {
    return fail(
      `Juda ko'p urinish. ${Math.ceil(limit.retryAfterSeconds / 60)} daqiqadan keyin qayta urinib ko'ring.`,
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    )
  }

  const body = await readJson(request)
  if (!body) return fail("So'rov formati noto'g'ri")

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    const { fieldErrors } = formatZodError(parsed.error)
    return fail("Ma'lumotlarni tekshiring", { fieldErrors })
  }

  const { phone, password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { phone },
    select: { id: true, phone: true, fullName: true, passwordHash: true },
  })

  // Raqam topilmasa ham verifyPassword chaqiriladi — javob vaqti bo'yicha
  // raqamning bazada bor-yo'qligini aniqlab bo'lmasligi uchun.
  const valid = await verifyPassword(password, user?.passwordHash)

  if (!user || !valid) {
    return fail("Telefon raqami yoki parol noto'g'ri", { status: 401 })
  }

  await resetAttempts('login', ip)
  await createUserSession(user.id)

  return ok({
    user: { id: user.id, phone: user.phone, fullName: user.fullName },
  })
}
