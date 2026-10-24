import { fail, ok, readJson } from '@/lib/api'
import { verifyPassword } from '@/lib/auth/password'
import { consumeAttempt, getClientIp, resetAttempts } from '@/lib/auth/rate-limit'
import { createUserSession } from '@/lib/auth/session'
import { formatZodError, makeLoginSchema } from '@/lib/validation/auth'
import { prisma } from '@/lib/prisma'
import { getT } from '@/lib/i18n/server'

export async function POST(request) {
  const ip = getClientIp(request)

  // Xato matnlari mijoz tanlagan tilda qaytadi — formadagi xabarlar
  // sahifa tilidan farq qilib qolmasligi uchun
  const t = await getT()

  const limit = await consumeAttempt('login', ip)
  if (!limit.allowed) {
    return fail(
      t('errors.tooManyAttempts', {
        minutes: Math.ceil(limit.retryAfterSeconds / 60),
      }),
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    )
  }

  const body = await readJson(request)
  if (!body) return fail(t('errors.badRequest'))

  const parsed = makeLoginSchema(t).safeParse(body)
  if (!parsed.success) {
    const { fieldErrors } = formatZodError(parsed.error)
    return fail(t('errors.checkData'), { fieldErrors })
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
    return fail(t('errors.wrongCredentials'), { status: 401 })
  }

  await resetAttempts('login', ip)
  await createUserSession(user.id)

  return ok({
    user: { id: user.id, phone: user.phone, fullName: user.fullName },
  })
}
