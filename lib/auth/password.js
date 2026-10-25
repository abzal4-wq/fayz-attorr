import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12
export const MIN_PASSWORD_LENGTH = 6

/** Parolni hash qiladi. Ochiq parol hech qayerda saqlanmaydi va log qilinmaydi. */
export async function hashPassword(plain) {
  if (typeof plain !== 'string' || plain.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Parol kamida ${MIN_PASSWORD_LENGTH} ta belgidan iborat bo'lishi kerak`
    )
  }
  return bcrypt.hash(plain, SALT_ROUNDS)
}

/**
 * Vaqtni tenglashtirish uchun HAQIQIY cost-12 bcrypt hash.
 *
 * DIQQAT: bu yerda qiymat to'g'ri formatda (60 belgi, `$2b$12$...`)
 * bo'lishi SHART. Avval bu yerda 66 belgilik soxta satr turardi va
 * bcryptjs uni darhol rad etardi — 0 ms. Natijada himoya umuman
 * ishlamay, javob vaqti foydalanuvchi bor-yo'qligini oshkor qilardi:
 *
 *   mavjud raqam      ~500 ms  (bcrypt ishlaydi)
 *   mavjud bo'lmagan  ~270 ms  (bcrypt o'tkazib yuboriladi)
 *
 * Shu farq orqali raqamlarni birma-bir sinab, kim ro'yxatdan
 * o'tganini aniqlasa bo'lardi. Hashning ochiq matni ahamiyatsiz:
 * taqqoslash natijasi baribir tashlab yuboriladi.
 */
const TIMING_EQUALIZER_HASH =
  '$2b$12$6ElF2JRxs44.JF7XDcGi2.CwIYFbRxRbiMPwsWwFz4aEDa/VqKKzq'

/**
 * Parolni hash bilan solishtiradi.
 * Hash yo'q bo'lsa ham bcrypt chaqiriladi — javob vaqti bo'yicha
 * "bunday foydalanuvchi bor/yo'q" ni aniqlab bo'lmasligi uchun.
 */
export async function verifyPassword(plain, hash) {
  // `plain` satr bo'lmasa ham ishni bajaramiz: bu holat ham
  // vaqt bo'yicha ajralib turmasligi kerak.
  const candidate = typeof plain === 'string' ? plain : ''

  if (typeof hash !== 'string' || hash.length === 0) {
    await bcrypt.compare(candidate, TIMING_EQUALIZER_HASH)
    return false
  }

  if (typeof plain !== 'string') {
    await bcrypt.compare(candidate, hash)
    return false
  }

  return bcrypt.compare(plain, hash)
}
