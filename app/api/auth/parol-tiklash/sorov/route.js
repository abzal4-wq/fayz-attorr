import { cookies } from 'next/headers'
import { fail, ok, readJson } from '@/lib/api'
import { consumeAttempt, consumeAttemptPair, getClientIp } from '@/lib/auth/rate-limit'
import { normalizePhone } from '@/lib/auth/phone'
import {
  RESET_COOKIE,
  RESET_START_PREFIX,
  RESET_TTL_SECONDS,
  createResetRequest,
  purgeExpiredResets,
} from '@/lib/auth/reset'
import { getBotUsername } from '@/lib/telegram'
import { formatZodError, makeResetRequestSchema } from '@/lib/validation/auth'
import { getT } from '@/lib/i18n/server'

/**
 * Parolni tiklash — 1-bosqich.
 *
 * Telefon raqamini qabul qiladi va Telegram havolasini qaytaradi.
 * Kod BU YERDA berilmaydi: avval Telegram raqam egasini tasdiqlashi
 * kerak (`/api/telegram/webhook`).
 */
export async function POST(request) {
  const ip = getClientIp(request)
  const t = await getT()

  const tooMany = (limit) =>
    fail(
      t('errors.tooManyAttempts', {
        minutes: Math.ceil(limit.retryAfterSeconds / 60),
      }),
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    )

  const body = await readJson(request)
  if (!body) {
    // Buzuq so'rov ham hisoblansin — aks holda cheklovni aylanib o'tsa bo'lardi
    const limit = await consumeAttempt('reset-ip', ip)
    if (!limit.allowed) return tooMany(limit)
    return fail(t('errors.badRequest'))
  }

  const parsed = makeResetRequestSchema(t).safeParse(body)

  // Login'dagi kabi: telefon xato formatda bo'lsa ham IP hisoblanadi
  const phone = parsed.success ? parsed.data.phone : normalizePhone(body?.phone)
  const limit = await consumeAttemptPair('reset', phone, ip)
  if (!limit.allowed) return tooMany(limit)

  if (!parsed.success) {
    const { fieldErrors } = formatZodError(parsed.error)
    return fail(t('errors.checkData'), { fieldErrors })
  }

  /*
   * Bot username'i havola uchun shart. Telegram javob bermasa,
   * jarayonni boshlashdan ma'no yo'q — foydalanuvchi kodni
   * olmaydi. Shuning uchun token ham yaratilmaydi.
   */
  const botUsername = await getBotUsername()
  if (!botUsername) {
    return fail(t('errors.resetUnavailable'), { status: 503 })
  }

  // Keraksiz yozuvlardan tozalash — alohida cron kerak bo'lmasligi uchun
  await purgeExpiredResets()

  const token = await createResetRequest(phone)

  /*
   * Token cookie'ga yoziladi, javobga EMAS.
   *
   * Shu orqali kodni faqat jarayonni BOSHLAGAN brauzer ishlatadi.
   * Ya'ni hujumchi kodni bilib qolsa ham (masalan telefonni
   * qarzga olgan odam), uni o'z brauzerida kiritib bo'lmaydi.
   */
  const store = await cookies()
  store.set(RESET_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: RESET_TTL_SECONDS,
  })

  /*
   * Javob raqam bazada bor-yo'qligidan QAT'I NAZAR bir xil.
   * Aks holda bu yer raqamlarni tekshirish vositasiga aylanardi.
   */
  return ok({
    telegramUrl: `https://t.me/${botUsername}?start=${RESET_START_PREFIX}${token}`,
  })
}
