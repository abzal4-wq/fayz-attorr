import { fail, ok, readJson } from '@/lib/api'
import { verifyPassword } from '@/lib/auth/password'
import {
  consumeAttempt,
  consumeAttemptPair,
  getClientIp,
  resetAttempts,
} from '@/lib/auth/rate-limit'
import { normalizePhone } from '@/lib/auth/phone'
import { createUserSession } from '@/lib/auth/session'
import { formatZodError, makeLoginSchema } from '@/lib/validation/auth'
import { prisma } from '@/lib/prisma'
import { getT } from '@/lib/i18n/server'

export async function POST(request) {
  const ip = getClientIp(request)

  // Xato matnlari mijoz tanlagan tilda qaytadi — formadagi xabarlar
  // sahifa tilidan farq qilib qolmasligi uchun
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
    // Buzuq so'rov ham hisoblansin, aks holda cheklovni shunday
    // so'rovlar bilan aylanib o'tsa bo'lardi
    const limit = await consumeAttempt('login-ip', ip)
    if (!limit.allowed) return tooMany(limit)
    return fail(t('errors.badRequest'))
  }

  const parsed = makeLoginSchema(t).safeParse(body)

  /*
   * Cheklov TELEFON va IP bo'yicha birdan hisoblanadi.
   *
   * Avval faqat IP bo'yicha edi. O'zbekistonda mobil operatorlar
   * CGNAT ishlatadi — bitta tashqi IP ortida minglab abonent. Ya'ni
   * bitta odam parolini 5 marta xato kiritsa, o'sha operatordagi
   * hamma 15 daqiqa kira olmasdi. Teskarisi ham yomon: bitta hisobni
   * turli IP lardan cheksiz sinab ko'rsa bo'lardi.
   *
   * Telefon xato formatda bo'lsa ham IP hisoblanadi.
   */
  const phone = parsed.success ? parsed.data.phone : normalizePhone(body?.phone)
  const limit = await consumeAttemptPair('login', phone, ip)
  if (!limit.allowed) return tooMany(limit)

  if (!parsed.success) {
    const { fieldErrors } = formatZodError(parsed.error)
    return fail(t('errors.checkData'), { fieldErrors })
  }

  const { password } = parsed.data

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

  /*
   * Faqat TELEFON hisoblagichi tozalanadi, IP niki emas.
   *
   * Aks holda hujumchi o'zining haqiqiy hisobiga kirib, IP
   * hisoblagichini qayta-qayta nolga tushirib, boshqa raqamlarni
   * cheksiz sinab ko'ra olardi.
   */
  await resetAttempts('login', phone)
  await createUserSession(user.id)

  return ok({
    user: { id: user.id, phone: user.phone, fullName: user.fullName },
  })
}
