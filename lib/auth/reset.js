import { createHash, randomBytes, randomInt } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { normalizePhone } from '@/lib/auth/phone'
import {
  RESET_CODE_LENGTH,
  RESET_MAX_ATTEMPTS,
  RESET_TTL_SECONDS,
} from '@/lib/auth/reset-constants'

/**
 * Parolni telefon raqami orqali tiklash.
 *
 * NEGA TELEGRAM: email yo'q, SMS shlyuzi ham yo'q. Shunchaki havola
 * yuborish esa raqamga egalikni isbotlamaydi. Telegram'da "Raqamni
 * yuborish" tugmasi bor — bosilganda Telegram O'ZI ro'yxatdan o'tish
 * paytida tekshirgan raqamni yuboradi. Ya'ni raqam egasi haqiqatan
 * tasdiqlanadi.
 *
 * Jarayon:
 *  1. Sayt: raqam kiritiladi -> `createResetRequest` token yaratadi,
 *     brauzerga cookie qo'yiladi va Telegram havolasi beriladi
 *  2. Telegram: /start tiklash_<token> -> bot raqam so'raydi
 *  3. Telegram: raqam mos kelsa -> `issueCode` 6 xonali kod beradi
 *  4. Sayt: kod + yangi parol -> `completeReset`
 *
 * Ikkala sir ham faqat hash ko'rinishida saqlanadi.
 */

export const RESET_COOKIE = 'fa_reset'

// O'lchamlar brauzer bilan birgalikda ishlatiladi — `reset-constants.js`
export { RESET_CODE_LENGTH, RESET_MAX_ATTEMPTS, RESET_TTL_SECONDS }

/** Telegram `/start` parametrining boshlanishi. */
export const RESET_START_PREFIX = 'tiklash_'

/*
 * Havoladagi token uchun bcrypt emas, sha256 ishlatiladi.
 *
 * Sabab: token 24 bayt tasodifiy ma'lumot, ya'ni uni lug'at bo'yicha
 * tanlab bo'lmaydi — bcrypt ning sekinligi bu yerda keraksiz. Bundan
 * tashqari hash bo'yicha IZLASH kerak (`requestHash` unikal indeks),
 * bcrypt esa har chaqiruvda boshqa natija beradi, shuning uchun
 * indeks bilan ishlamaydi.
 *
 * 6 xonali kod esa aksincha — faqat million variant, shuning uchun
 * u bcrypt bilan hashlanadi.
 */
function hashRequestToken(token) {
  return createHash('sha256').update(String(token)).digest('hex')
}

/** URL va Telegram `/start` parametriga xavfsiz token. */
function newRequestToken() {
  return randomBytes(24).toString('base64url')
}

/**
 * 6 xonali kod.
 *
 * `randomInt` kriptografik — `Math.random` bilan kodni oldindan
 * taxmin qilish mumkin bo'lardi.
 *
 * `padStart` SHART: 0..999999 oralig'idagi son "1234" bo'lib
 * chiqishi mumkin. Busiz kodlarning bir qismi 6 xonali bo'lmay,
 * forma validatsiyasidan o'tmasdi — ya'ni tiklash tasodifiy
 * ravishda ishlamay qolardi.
 */
export function generateResetCode() {
  const max = 10 ** RESET_CODE_LENGTH
  return String(randomInt(0, max)).padStart(RESET_CODE_LENGTH, '0')
}

function expiry() {
  return new Date(Date.now() + RESET_TTL_SECONDS * 1000)
}

/**
 * 1-bosqich: tiklash urinishini ochadi.
 *
 * Raqam bazada bo'lmasa ham token QAYTARILADI (lekin baza yozuvi
 * yaratilmaydi). Shunda sayt javobi ikki holatda bir xil bo'ladi va
 * shu orqali kimning ro'yxatda borligini aniqlab bo'lmaydi. Nomuvofiq
 * token bilan botga kirilsa, bot "havola eskirgan" deb javob beradi.
 *
 * @returns {Promise<string>} Telegram havolasiga qo'yiladigan token
 */
export async function createResetRequest(phone) {
  const token = newRequestToken()

  const user = await prisma.user.findUnique({
    where: { phone },
    select: { id: true },
  })

  if (!user) return token

  /*
   * Bitta foydalanuvchining tugallanmagan urinishlari o'chiriladi.
   *
   * Nega: raqam tasdiqlangandan keyin kod chatId bo'yicha topiladi.
   * Bir foydalanuvchida bir vaqtda ikkita ochiq urinish bo'lsa,
   * qaysi biriga kod berilgani noaniq bo'lib qolardi.
   */
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  })

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      requestHash: hashRequestToken(token),
      expiresAt: expiry(),
    },
  })

  return token
}

/** Muddati o'tgan yozuvlarni tozalaydi — jadval cheksiz o'smasligi uchun. */
export async function purgeExpiredResets() {
  await prisma.passwordResetToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
}

/**
 * 2-bosqich: botda `/start tiklash_<token>` bosilganda.
 *
 * Tokenni tekshiradi va urinishni shu chatga bog'laydi.
 *
 * @returns {Promise<{ok: true}|{ok: false, reason: string}>}
 */
export async function attachChatToRequest(token, chatId) {
  if (typeof token !== 'string' || token.length === 0) {
    return { ok: false, reason: 'invalid' }
  }

  const row = await prisma.passwordResetToken.findUnique({
    where: { requestHash: hashRequestToken(token) },
    select: { id: true, usedAt: true, expiresAt: true },
  })

  if (!row || row.usedAt) return { ok: false, reason: 'invalid' }
  if (row.expiresAt < new Date()) return { ok: false, reason: 'expired' }

  await prisma.passwordResetToken.update({
    where: { id: row.id },
    data: { chatId: String(chatId) },
  })

  return { ok: true }
}

/**
 * 3-bosqich: Telegram tasdiqlagan raqam kelganda kod beradi.
 *
 * `verifiedPhone` ni Telegram'ning O'ZI yuboradi (`message.contact`),
 * shuning uchun unga ishonish mumkin — lekin faqat chaqiruvchi
 * `contact.user_id === message.from.id` ni tekshirgan bo'lsa.
 * Busiz birovning kontakt kartasini yuborib qo'yish mumkin edi.
 *
 * @returns {Promise<{ok: true, code: string}|{ok: false, reason: string}>}
 */
export async function issueCode(chatId, verifiedPhone) {
  const phone = normalizePhone(verifiedPhone)
  if (!phone) return { ok: false, reason: 'invalid-phone' }

  const row = await prisma.passwordResetToken.findFirst({
    where: {
      chatId: String(chatId),
      usedAt: null,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, user: { select: { phone: true } } },
  })

  if (!row) return { ok: false, reason: 'no-request' }

  /*
   * Telegram tasdiqlagan raqam hisobdagi raqam bilan bir xil
   * bo'lishi SHART. Aks holda istalgan odam birovning raqami uchun
   * tiklash boshlab, o'z Telegram raqamini yuborib, kodni olib
   * qo'yardi.
   */
  if (row.user.phone !== phone) {
    return { ok: false, reason: 'phone-mismatch' }
  }

  const code = generateResetCode()

  await prisma.passwordResetToken.update({
    where: { id: row.id },
    data: {
      codeHash: await bcrypt.hash(code, 12),
      verifiedAt: new Date(),
      // Kod yangi berildi — urinishlar nolga qaytadi
      attempts: 0,
    },
  })

  return { ok: true, code }
}

/**
 * 4-bosqich: kod va yangi parol.
 *
 * @returns {Promise<{ok: true, userId: string}|{ok: false, reason: string}>}
 */
export async function completeReset(token, code, passwordHash) {
  if (typeof token !== 'string' || token.length === 0) {
    return { ok: false, reason: 'invalid' }
  }

  const row = await prisma.passwordResetToken.findUnique({
    where: { requestHash: hashRequestToken(token) },
    select: {
      id: true,
      userId: true,
      codeHash: true,
      verifiedAt: true,
      usedAt: true,
      expiresAt: true,
      attempts: true,
    },
  })

  if (!row || row.usedAt) return { ok: false, reason: 'invalid' }
  if (row.expiresAt < new Date()) return { ok: false, reason: 'expired' }
  if (!row.verifiedAt || !row.codeHash) return { ok: false, reason: 'not-verified' }

  if (row.attempts >= RESET_MAX_ATTEMPTS) {
    return { ok: false, reason: 'too-many' }
  }

  const valid = await bcrypt.compare(String(code ?? ''), row.codeHash)

  if (!valid) {
    const updated = await prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    })

    return {
      ok: false,
      reason: 'wrong-code',
      attemptsLeft: Math.max(0, RESET_MAX_ATTEMPTS - updated.attempts),
    }
  }

  /*
   * Parol almashtirish va tokenni ishlatilgan deb belgilash BIR
   * tranzaksiyada. Aks holda parol almashib, token ochiq qolishi
   * mumkin edi — ya'ni bitta kod bilan ikki marta parol qo'yish.
   */
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: {
        passwordHash,
        /*
         * Barcha eski sessiyalar uziladi.
         *
         * Odam parolni aynan shuning uchun tiklaydi: hisobiga birov
         * kirib qolgan deb o'ylaydi. Yangi parol qo'yilsa-da, eski
         * token hamon 30 kun ishlayverganda tiklashning ma'nosi
         * qolmaydi.
         */
        tokenVersion: { increment: 1 },
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
    // Boshqa ochiq urinishlar ham kuchini yo'qotadi
    prisma.passwordResetToken.deleteMany({
      where: { userId: row.userId, usedAt: null },
    }),
  ])

  return { ok: true, userId: row.userId }
}
