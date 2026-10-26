import { cookies } from 'next/headers'
import { fail, ok, readJson } from '@/lib/api'
import { hashPassword } from '@/lib/auth/password'
import { consumeAttempt, getClientIp } from '@/lib/auth/rate-limit'
import { RESET_COOKIE, completeReset } from '@/lib/auth/reset'
import { createUserSession } from '@/lib/auth/session'
import { formatZodError, makeResetConfirmSchema } from '@/lib/validation/auth'
import { getT } from '@/lib/i18n/server'
import { prisma } from '@/lib/prisma'

/**
 * Parolni tiklash — 2-bosqich: Telegram'dan kelgan kod va yangi parol.
 */
export async function POST(request) {
  const ip = getClientIp(request)
  const t = await getT()

  /*
   * Cheklov IP bo'yicha. Telefon bo'yicha hisoblab bo'lmaydi —
   * bu bosqichda raqam so'ralmaydi (u cookie'dagi tokendan
   * kelib chiqadi), ya'ni foydalanuvchi uni kiritmaydi.
   */
  const limit = await consumeAttempt('reset-confirm-ip', ip)
  if (!limit.allowed) {
    return fail(
      t('errors.tooManyAttempts', {
        minutes: Math.ceil(limit.retryAfterSeconds / 60),
      }),
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    )
  }

  const store = await cookies()
  const token = store.get(RESET_COOKIE)?.value

  if (!token) {
    // Cookie yo'q yoki muddati o'tgan — jarayonni boshidan boshlash kerak
    return fail(t('errors.resetExpired'), { status: 400 })
  }

  const body = await readJson(request)
  if (!body) return fail(t('errors.badRequest'))

  const parsed = makeResetConfirmSchema(t).safeParse(body)
  if (!parsed.success) {
    const { fieldErrors } = formatZodError(parsed.error)
    return fail(t('errors.checkData'), { fieldErrors })
  }

  const { code, password } = parsed.data

  /*
   * Hash OLDIN hisoblanadi, natijadan qat'i nazar.
   *
   * bcrypt ~0.5 sekund oladi. Agar u faqat kod to'g'ri chiqqanda
   * hisoblansa, javob vaqti bo'yicha kodning to'g'ri-noto'g'riligini
   * ajratib olish mumkin bo'lardi.
   */
  const passwordHash = await hashPassword(password)

  const result = await completeReset(token, code, passwordHash)

  if (!result.ok) {
    // Cookie faqat tiklab bo'lmaydigan holatlarda o'chiriladi;
    // kod xato bo'lsa foydalanuvchi qaytadan kiritishi kerak
    const unrecoverable = ['invalid', 'expired', 'too-many']
    if (unrecoverable.includes(result.reason)) {
      store.set(RESET_COOKIE, '', { path: '/', maxAge: 0 })
    }

    const messages = {
      invalid: t('errors.resetExpired'),
      expired: t('errors.resetExpired'),
      'not-verified': t('errors.resetNotVerified'),
      'too-many': t('errors.resetTooManyCodes'),
      'wrong-code': t('errors.resetWrongCode', { n: result.attemptsLeft ?? 0 }),
    }

    return fail(messages[result.reason] ?? t('errors.badRequest'), {
      status: 400,
      fieldErrors:
        result.reason === 'wrong-code'
          ? { code: messages['wrong-code'] }
          : undefined,
    })
  }

  // Jarayon tugadi — token endi keraksiz
  store.set(RESET_COOKIE, '', { path: '/', maxAge: 0 })

  /*
   * Darhol kirgizib qo'yamiz: raqam Telegram orqali tasdiqlangan va
   * parol hozir qo'yildi, ya'ni yana login so'rash keraksiz qadam.
   */
  await createUserSession(result.userId)

  const user = await prisma.user.findUnique({
    where: { id: result.userId },
    select: { id: true, phone: true, fullName: true },
  })

  return ok({ user })
}
