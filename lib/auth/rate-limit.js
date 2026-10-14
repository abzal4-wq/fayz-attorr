import { prisma } from '@/lib/prisma'

/**
 * Bazaga tayangan rate limiting.
 *
 * Nega xotirada emas: Vercel'da har bir so'rov boshqa instansiyaga
 * tushishi mumkin, xotiradagi hisoblagich esa instansiya bilan birga
 * yo'qoladi — ya'ni cheklov amalda ishlamaydi.
 */

export const LIMITS = {
  login: { limit: 5, windowSeconds: 15 * 60 }, // 5 ta xato urinish -> 15 daqiqa
  register: { limit: 5, windowSeconds: 15 * 60 },
  order: { limit: 10, windowSeconds: 10 * 60 },
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
