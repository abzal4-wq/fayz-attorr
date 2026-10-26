/**
 * Parolni tiklashning umumiy o'lchamlari.
 *
 * NEGA ALOHIDA FAYL: bu qiymatlar ham serverda (`lib/auth/reset.js`),
 * ham brauzerda (forma validatsiyasi) kerak. `reset.js` esa Prisma'ni
 * import qiladi — undan import qilinsa, butun baza klienti brauzer
 * bundle'iga tushib qolardi. Shuning uchun konstantalar hech narsa
 * import qilmaydigan shu faylda turadi.
 */

export const RESET_CODE_LENGTH = 6
export const RESET_TTL_SECONDS = 15 * 60
export const RESET_MAX_ATTEMPTS = 5
