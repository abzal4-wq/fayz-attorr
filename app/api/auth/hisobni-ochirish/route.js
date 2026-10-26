import { cookies } from 'next/headers'
import { fail, ok, readJson } from '@/lib/api'
import { verifyPassword } from '@/lib/auth/password'
import { consumeAttemptPair, getClientIp } from '@/lib/auth/rate-limit'
import { USER_COOKIE, getCurrentUser } from '@/lib/auth/session'
import { formatZodError, makeAccountDeleteSchema } from '@/lib/validation/auth'
import { getT } from '@/lib/i18n/server'
import { prisma } from '@/lib/prisma'

/**
 * Hisobni o'chirish.
 *
 * BUYURTMALAR O'CHMAYDI. `Order.userId` FK'si `ON DELETE SET NULL`,
 * ya'ni buyurtma bog'lanishini yo'qotadi, lekin o'zi qoladi.
 *
 * Nega shunday: buyurtmada mijozning ismi, telefoni va manzili
 * NUSXA bo'lib saqlanadi, do'konda esa hisob-kitob va yetkazib
 * berish tarixi kerak. Yetkazilmagan buyurtma hisob o'chgani uchun
 * yo'q bo'lib ketsa, do'kon uni bajarib ham, topib ham bo'lmasdi.
 */
export async function POST(request) {
  const ip = getClientIp(request)
  const t = await getT()

  const user = await getCurrentUser()
  if (!user) return fail(t('errors.loginRequired'), { status: 401 })

  const limit = await consumeAttemptPair('account-delete', user.id, ip)
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

  const parsed = makeAccountDeleteSchema(t).safeParse(body)
  if (!parsed.success) {
    const { fieldErrors } = formatZodError(parsed.error)
    return fail(t('errors.checkData'), { fieldErrors })
  }

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  })

  const valid = await verifyPassword(parsed.data.password, row?.passwordHash)
  if (!valid) {
    return fail(t('errors.wrongCurrentPassword'), {
      status: 400,
      fieldErrors: { password: t('errors.wrongCurrentPassword') },
    })
  }

  /*
   * Tiklash tokenlari `onDelete: Cascade` bilan o'zi o'chadi.
   * Buyurtmalardagi `userId` esa NULL bo'ladi (SET NULL).
   */
  await prisma.user.delete({ where: { id: user.id } })

  /*
   * Cookie qo'lda o'chiriladi, `destroyUserSession()` ishlatilmaydi:
   * u bazadagi `tokenVersion` ni oshirishga urinadi, foydalanuvchi
   * esa endi yo'q.
   */
  const store = await cookies()
  store.set(USER_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return ok()
}
