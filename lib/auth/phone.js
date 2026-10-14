/**
 * O'zbekiston telefon raqamlari bilan ishlash.
 *
 * Bazada HAR DOIM E.164 formatida saqlanadi: +998XXXXXXXXX
 * Foydalanuvchiga HAR DOIM maskalangan ko'rinishda ko'rsatiladi: +998 (90) 123-45-67
 */

const UZ_PREFIX = '998'
const NATIONAL_LENGTH = 9 // 998 dan keyingi raqamlar soni

/**
 * Har qanday kiritilgan ko'rinishdan E.164 ga keltiradi.
 * Qabul qiladi: "+998901234567", "998901234567", "901234567",
 *               "+998 (90) 123-45-67", "90 123 45 67"
 *
 * @returns {string|null} "+998901234567" yoki noto'g'ri bo'lsa null
 */
export function normalizePhone(input) {
  if (typeof input !== 'string') return null

  // Faqat raqamlarni qoldiramiz
  let digits = input.replace(/\D/g, '')

  // Foydalanuvchi mamlakat kodisiz kiritgan bo'lishi mumkin
  if (digits.length === NATIONAL_LENGTH) {
    digits = UZ_PREFIX + digits
  }

  // "00998..." ko'rinishi
  if (digits.startsWith('00' + UZ_PREFIX)) {
    digits = digits.slice(2)
  }

  if (digits.length !== UZ_PREFIX.length + NATIONAL_LENGTH) return null
  if (!digits.startsWith(UZ_PREFIX)) return null

  // Operator kodi 0 bilan boshlanmaydi
  if (digits[UZ_PREFIX.length] === '0') return null

  return '+' + digits
}

/**
 * E.164 raqamni ko'rsatish uchun formatlaydi.
 * "+998901234567" -> "+998 (90) 123-45-67"
 */
export function formatPhone(e164) {
  const normalized = normalizePhone(e164)
  if (!normalized) return typeof e164 === 'string' ? e164 : ''

  const n = normalized.slice(4) // 998 dan keyingi 9 raqam
  return `+998 (${n.slice(0, 2)}) ${n.slice(2, 5)}-${n.slice(5, 7)}-${n.slice(7, 9)}`
}

/**
 * Input mask uchun: foydalanuvchi yozayotgan paytda qisman formatlash.
 * Har bir bosilgan tugmadan keyin chaqiriladi.
 */
export function maskPhoneInput(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '')

  // Boshidagi mamlakat kodini olib tashlaymiz — mask uni o'zi qo'yadi
  if (digits.startsWith(UZ_PREFIX)) digits = digits.slice(UZ_PREFIX.length)
  digits = digits.slice(0, NATIONAL_LENGTH)

  if (digits.length === 0) return ''

  let out = '+998 (' + digits.slice(0, 2)
  if (digits.length >= 2) out += ')'
  if (digits.length > 2) out += ' ' + digits.slice(2, 5)
  if (digits.length > 5) out += '-' + digits.slice(5, 7)
  if (digits.length > 7) out += '-' + digits.slice(7, 9)

  return out
}

export function isValidUzPhone(input) {
  return normalizePhone(input) !== null
}
