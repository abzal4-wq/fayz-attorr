import { z } from 'zod'
import { normalizePhone } from '@/lib/auth/phone'
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password'
import { RESET_CODE_LENGTH } from '@/lib/auth/reset-constants'

/**
 * Sxemalar FABRIKA ko'rinishida: `t` ni parametr qilib olamiz.
 *
 * Nega: xato matnlari foydalanuvchiga ko'rinadi, ya'ni ular ham
 * tarjima qilinishi kerak. Sxema modul darajasida bir marta tuzilsa,
 * matnlar birinchi import paytidagi tilda muzlab qolardi. Shuning
 * uchun sxema har so'rovda (serverda) va har renderda (client'da)
 * tanlangan til bilan qayta tuziladi.
 */

/**
 * Matn maydoni: yuborilmagan yoki noto'g'ri turda kelgan holat uchun
 * ham TARJIMA QILINGAN xabar bilan.
 *
 * NEGA: `.min(1, matn)` faqat bo'sh SATRNI ushlaydi. Maydon umuman
 * yuborilmasa (yoki satr o'rniga raqam kelsa), zod o'zining inglizcha
 * xatosini berardi: "Invalid input: expected string, received
 * undefined". API to'g'ridan-to'g'ri chaqirilganda shu matn mijozga
 * qaytardi — login, ro'yxat, buyurtma va tiklashda tasdiqlangan.
 *
 * `{ error }` faqat tur xatosiga ta'sir qiladi; `.min()`/`.max()`
 * o'z matnlarini saqlaydi (sinab ko'rilgan).
 */
export function text(message) {
  return z.string({ error: message })
}

/**
 * Ixtiyoriy matn maydoni: bo'sh satr "yo'q" deb qabul qilinadi.
 *
 * Avval `.optional().or(z.literal(''))` edi. Bu UNION yaratadi va
 * ikkala tarmoq ham yiqilsa (masalan satr o'rniga raqam kelsa) zod
 * ichki matnlarni yutib, umumiy inglizcha "Invalid input" berardi.
 * `preprocess` bilan bo'sh satr avval `undefined` ga aylanadi va
 * keyin bitta sxema tekshiradi — aniq xabarlar saqlanadi.
 */
export function optionalText(schema) {
  return z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    schema.optional()
  )
}

/**
 * Telefon maydoni: foydalanuvchi maskalangan ko'rinishda yozadi,
 * sxema uni E.164 ga aylantiradi. Keyingi kod har doim +998XXXXXXXXX oladi.
 */
function phoneField(t) {
  return text(t('validation.phoneRequired'))
    .min(1, t('validation.phoneRequired'))
    .transform((value, ctx) => {
      const normalized = normalizePhone(value)
      if (!normalized) {
        ctx.addIssue({ code: 'custom', message: t('validation.phoneInvalid') })
        return z.NEVER
      }
      return normalized
    })
}

function passwordField(t) {
  return text(t('validation.passwordRequired'))
    .min(MIN_PASSWORD_LENGTH, t('validation.passwordMin', { n: MIN_PASSWORD_LENGTH }))
    .max(72, t('validation.passwordMax')) // bcrypt cheklovi
}

export function makeRegisterSchema(t) {
  return z.object({
    fullName: optionalText(
      text(t('validation.nameRequired'))
        .trim()
        .min(2, t('validation.nameRequired'))
        .max(80, t('validation.nameMax'))
    ),
    phone: phoneField(t),
    password: passwordField(t),
  })
}

export function makeLoginSchema(t) {
  return z.object({
    phone: phoneField(t),
    password: text(t('validation.passwordRequired')).min(1, t('validation.passwordRequired')),
  })
}

/** Parolni tiklash — 1-bosqich: faqat telefon raqami. */
export function makeResetRequestSchema(t) {
  return z.object({
    phone: phoneField(t),
  })
}

/**
 * Parolni tiklash — 2-bosqich: Telegram'dan kelgan kod va yangi parol.
 *
 * Kod maydonida raqam bo'lmagan belgilar olib tashlanadi: odam kodni
 * nusxalab qo'yganda bo'sh joy yoki ko'rinmas belgi qo'shilib
 * qolishi juda keng tarqalgan, bu esa to'g'ri kodni ham xato
 * qilardi (va `attempts` hisoblagichini bekordan yegan bo'lardi).
 */
export function makeResetConfirmSchema(t) {
  return z.object({
    code: text(t('validation.codeInvalid', { n: RESET_CODE_LENGTH }))
      .transform((value) => value.replace(/\D/g, ''))
      .refine(
        (value) => value.length === RESET_CODE_LENGTH,
        t('validation.codeInvalid', { n: RESET_CODE_LENGTH })
      ),
    password: passwordField(t),
  })
}

/**
 * Profilda parolni o'zgartirish.
 *
 * Joriy parol SHART: brauzeri ochiq qolgan hisobga o'tirib olgan odam
 * parolni almashtirib, egasini butunlay chiqarib yuborishi mumkin
 * bo'lardi.
 */
export function makePasswordChangeSchema(t) {
  return z
    .object({
      currentPassword: text(t('validation.passwordRequired')).min(1, t('validation.passwordRequired')),
      newPassword: passwordField(t),
    })
    .superRefine((value, ctx) => {
      // Yangi parol eskisi bilan bir xil bo'lsa amal ma'nosiz, lekin
      // barcha sessiyalar uzilib ketardi — odam buni kutmaydi
      if (value.currentPassword === value.newPassword) {
        ctx.addIssue({
          code: 'custom',
          path: ['newPassword'],
          message: t('validation.passwordSame'),
        })
      }
    })
}

/**
 * Hisobni o'chirish.
 *
 * Parol ham, alohida tasdiq belgisi ham so'raladi: amal qaytarilmaydi
 * va bitta beixtiyor bosishdan sodir bo'lmasligi kerak.
 */
export function makeAccountDeleteSchema(t) {
  return z.object({
    password: text(t('validation.passwordRequired')).min(1, t('validation.passwordRequired')),
    confirm: z.literal(true, {
      message: t('validation.deleteConfirmRequired'),
    }),
  })
}

/**
 * Admin kirishi tarjima qilinmaydi: panel faqat do'kon egasi uchun va
 * butunlay o'zbekcha. Shuning uchun bu sxema oddiy obyekt bo'lib qoladi.
 */
export const adminLoginSchema = z.object({
  username: z.string().trim().min(1, 'Login kiriting').max(60),
  password: z.string().min(1, 'Parolni kiriting'),
})

/**
 * Zod xatolarini formadagi maydonlarga moslab qaytaradi.
 * @returns {{ formErrors: string[], fieldErrors: Record<string,string> }}
 */
export function formatZodError(error) {
  const fieldErrors = {}
  const formErrors = []

  for (const issue of error.issues) {
    const field = issue.path[0]
    if (field === undefined) {
      formErrors.push(issue.message)
    } else if (!fieldErrors[field]) {
      fieldErrors[field] = issue.message
    }
  }

  return { formErrors, fieldErrors }
}
