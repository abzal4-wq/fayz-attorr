import { fail, ok, readJson } from '@/lib/api'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { consumeAttemptPair, getClientIp, resetAttempts } from '@/lib/auth/rate-limit'
import { createUserSession, getCurrentUser } from '@/lib/auth/session'
import { formatZodError, makePasswordChangeSchema } from '@/lib/validation/auth'
import { getT } from '@/lib/i18n/server'
import { prisma } from '@/lib/prisma'

/**
 * Profilda parolni o'zgartirish.
 *
 * Parol almashgandan keyin BOSHQA qurilmalardagi sessiyalar uziladi
 * (`tokenVersion` oshadi), joriy qurilma esa kirgan holda qoladi —
 * shuning uchun oxirida sessiya qaytadan beriladi.
 */
export async function POST(request) {
  const ip = getClientIp(request)
  const t = await getT()

  const user = await getCurrentUser()
  if (!user) return fail(t('errors.loginRequired'), { status: 401 })

  const limit = await consumeAttemptPair('password-change', user.id, ip)
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

  const parsed = makePasswordChangeSchema(t).safeParse(body)
  if (!parsed.success) {
    const { fieldErrors } = formatZodError(parsed.error)
    return fail(t('errors.checkData'), { fieldErrors })
  }

  const { currentPassword, newPassword } = parsed.data

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  })

  const valid = await verifyPassword(currentPassword, row?.passwordHash)
  if (!valid) {
    return fail(t('errors.wrongCurrentPassword'), {
      status: 400,
      fieldErrors: { currentPassword: t('errors.wrongCurrentPassword') },
    })
  }

  const passwordHash = await hashPassword(newPassword)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      /*
       * Boshqa qurilmalardagi sessiyalarni uzadi. Odam parolni
       * ko'pincha aynan shuning uchun almashtiradi — eski token
       * qolib ketsa amalning ma'nosi yo'q.
       */
      tokenVersion: { increment: 1 },
    },
  })

  /*
   * Joriy qurilma uchun yangi token. Bu SHART: yuqoridagi `increment`
   * foydalanuvchining o'z tokenini ham eskirtiradi, ya'ni busiz odam
   * parolini o'zgartirgan zahoti o'zi ham chiqib ketardi.
   */
  await createUserSession(user.id)

  // Parol to'g'ri kelgani tasdiqlandi — hisob bo'yicha hisoblagich tozalanadi
  await resetAttempts('password-change', user.id)

  return ok()
}
