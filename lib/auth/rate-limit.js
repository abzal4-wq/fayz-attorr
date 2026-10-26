import { prisma } from '@/lib/prisma'

/**
 * Bazaga tayangan rate limiting.
 *
 * Nega xotirada emas: Vercel'da har bir so'rov boshqa instansiyaga
 * tushishi mumkin, xotiradagi hisoblagich esa instansiya bilan birga
 * yo'qoladi — ya'ni cheklov amalda ishlamaydi.
 */

/*
 * Cheklovlar IKKI o'lchovda: hisob bo'yicha va IP bo'yicha.
 *
 * NEGA: O'zbekistonda mobil operatorlar CGNAT ishlatadi — bitta
 * tashqi IP ortida yuzlab, ba'zan minglab abonent bo'ladi. Faqat IP
 * bo'yicha cheklasak:
 *   - bitta odam parolini 5 marta xato kiritsa, o'sha operatordagi
 *     HAMMA 15 daqiqa kira olmaydi;
 *   - ayni paytda bitta hisobni ko'p IP dan buzishga to'sqinlik yo'q.
 *
 * Shuning uchun hisob bo'yicha qattiqroq (5), IP bo'yicha yumshoqroq
 * (30) cheklov qo'yiladi. Ikkalasidan biri to'lsa, urinish rad etiladi.
 */
export const LIMITS = {
  login: { limit: 5, windowSeconds: 15 * 60 }, // telefon bo'yicha
  'login-ip': { limit: 30, windowSeconds: 15 * 60 }, // CGNAT'ni hisobga olib
  register: { limit: 5, windowSeconds: 15 * 60 },
  'register-ip': { limit: 20, windowSeconds: 60 * 60 },
  order: { limit: 10, windowSeconds: 10 * 60 },
  'order-ip': { limit: 40, windowSeconds: 10 * 60 },

  /*
   * Parolni tiklash so'rovi. Login'dan qattiqroq: har so'rov Telegram
   * havolasi yaratadi, ya'ni arzon spam vositasi bo'lib qolmasligi
   * kerak. Odatda odam bir marta tiklaydi, 3 ta urinish yetarli.
   */
  reset: { limit: 3, windowSeconds: 30 * 60 },
  'reset-ip': { limit: 15, windowSeconds: 30 * 60 },

  /*
   * Kodni kiritish alohida hisoblanadi. Tokendagi `attempts` 5 ta
   * xato kodda tokenni bekor qiladi, lekin u faqat BITTA tokenga
   * tegishli — bu cheklov esa bir IP dan ketma-ket yangi tokenlar
   * bilan kod tanlashni to'xtatadi.
   */
  'reset-confirm-ip': { limit: 30, windowSeconds: 30 * 60 },

  /*
   * Profilda parolni o'zgartirish. Joriy parol so'ralgani uchun bu
   * ham parol tanlash nuqtasi — login bilan bir xil qattiqlikda.
   */
  'password-change': { limit: 5, windowSeconds: 15 * 60 },
  'password-change-ip': { limit: 20, windowSeconds: 15 * 60 },
}

/**
 * So'rov yuborgan IP manzili.
 * Vercel `x-forwarded-for` ni o'zi qo'yadi; birinchi qiymat — haqiqiy mijoz.
 */
export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0].trim()
    if (first) return first
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

/**
 * Urinishni hisobga oladi.
 * @returns {Promise<{allowed: boolean, retryAfterSeconds: number}>}
 */
export async function consumeAttempt(action, identifier) {
  const config = LIMITS[action]
  if (!config) throw new Error(`Noma'lum rate limit amali: ${action}`)

  const key = `${action}:${identifier}`
  const now = new Date()

  const existing = await prisma.rateLimit.findUnique({ where: { key } })

  // Yozuv yo'q yoki muddati o'tgan -> hisobni yangidan boshlaymiz
  if (!existing || existing.expiresAt <= now) {
    const expiresAt = new Date(now.getTime() + config.windowSeconds * 1000)
    await prisma.rateLimit.upsert({
      where: { key },
      update: { count: 1, expiresAt },
      create: { key, count: 1, expiresAt },
    })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (existing.count >= config.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000)
      ),
    }
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  })

  return { allowed: true, retryAfterSeconds: 0 }
}

/**
 * Hisob VA IP bo'yicha birdan tekshiradi.
 *
 * Qaysi biri to'lgani javobda aytilmaydi — aks holda hujumchi
 * "bu raqam bloklangan" degan ma'lumotni olardi.
 *
 * @param action `login` | `register` | `order`
 * @param subject telefon raqami yoki boshqa hisob belgisi
 * @param ip so'rov yuborilgan IP
 */
export async function consumeAttemptPair(action, subject, ip) {
  // Avval IP: u kengroq va arzonroq filtr
  const byIp = await consumeAttempt(`${action}-ip`, ip)
  if (!byIp.allowed) return byIp

  // Subject bo'lmasa (masalan telefon kiritilmagan) faqat IP qoladi
  if (!subject) return byIp

  return consumeAttempt(action, subject)
}

/** Muvaffaqiyatli kirishdan keyin hisoblagichni tozalaydi. */
export async function resetAttempts(action, identifier) {
  await prisma.rateLimit
    .delete({ where: { key: `${action}:${identifier}` } })
    .catch(() => {
      // Yozuv yo'q bo'lsa — muammo emas
    })
}

/** Muddati o'tgan yozuvlarni tozalaydi (vaqti-vaqti bilan chaqiriladi). */
export async function purgeExpired() {
  const { count } = await prisma.rateLimit.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  })
  return count
}
