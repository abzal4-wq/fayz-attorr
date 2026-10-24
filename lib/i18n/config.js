/**
 * Tillar ro'yxati va umumiy sozlamalar.
 *
 * Til URL'da emas, cookie'da saqlanadi: shunday qilib `/katalog` manzili
 * uch tilda ham bir xil qoladi — havolalarni ulashganda til almashib
 * ketmaydi va mavjud barcha `href`larni qayta yozish kerak emas.
 */

export const DEFAULT_LOCALE = 'uz'

/** Birinchisi — asosiy til. Tartib til almashtirgichda ham shu. */
export const LOCALES = ['uz', 'ru', 'en']

export const LOCALE_COOKIE = 'til'

/** Bir yil: til tanlovi seans tugagach ham eslab qolinadi. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/**
 * Til almashtirgichdagi nomlar. Har bir til O'ZINING tilida yoziladi —
 * ruscha bilgan odam "Ruscha" degan o'zbekcha so'zni qidirmasligi kerak.
 */
export const LOCALE_LABELS = {
  uz: { short: 'UZ', native: "O'zbekcha" },
  ru: { short: 'RU', native: 'Русский' },
  en: { short: 'EN', native: 'English' },
}

/** `<html lang>` va Open Graph uchun. */
export const OG_LOCALES = {
  uz: 'uz_UZ',
  ru: 'ru_RU',
  en: 'en_US',
}

/**
 * Har qanday kirish qiymatini (cookie, `Accept-Language`, qo'l bilan
 * yozilgan matn) ruxsat etilgan tilga keltiradi. Noma'lum qiymat —
 * asosiy til, hech qachon xato tashlamaydi.
 */
export function normalizeLocale(value) {
  if (typeof value !== 'string') return DEFAULT_LOCALE

  const lower = value.trim().toLowerCase()
  if (LOCALES.includes(lower)) return lower

  // "ru-RU", "en-US" kabi qiymatlar ham tushunilsin
  const base = lower.split(/[-_]/)[0]
  return LOCALES.includes(base) ? base : DEFAULT_LOCALE
}
