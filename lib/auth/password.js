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
 * Parolni hash bilan solishtiradi.
 * Hash yo'q bo'lsa ham bcrypt chaqiriladi — javob vaqti bo'yicha
 * "bunday foydalanuvchi bor/yo'q" ni aniqlab bo'lmasligi uchun.
 */
export async function verifyPassword(plain, hash) {
  if (typeof plain !== 'string') return false
  if (typeof hash !== 'string' || hash.length === 0) {
    // Vaqtni tenglashtirish uchun soxta hash bilan taqqoslaymiz
    await bcrypt.compare(plain, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv')
    return false
  }
  return bcrypt.compare(plain, hash)
}
