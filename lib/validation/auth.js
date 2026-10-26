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
 * Telefon maydoni: foydalanuvchi maskalangan ko'rinishda yozadi,
 * sxema uni E.164 ga aylantiradi. Keyingi kod har doim +998XXXXXXXXX oladi.
 */
function phoneField(t) {
  return z
    .string()
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
  return z
    .string()
    .min(MIN_PASSWORD_LENGTH, t('validation.passwordMin', { n: MIN_PASSWORD_LENGTH }))
    .max(72, t('validation.passwordMax')) // bcrypt cheklovi
}

export function makeRegisterSchema(t) {
  return z.object({
    fullName: z
      .string()
      .trim()
      .min(2, t('validation.nameRequired'))
      .max(80, t('validation.nameMax'))
      .optional()
      .or(z.literal('').transform(() => undefined)),
    phone: phoneField(t),
    password: passwordField(t),
  })
}

export function makeLoginSchema(t) {
  return z.object({
    phone: phoneField(t),
    password: z.string().min(1, t('validation.passwordRequired')),
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
    code: z
      .string()
      .transform((value) => value.replace(/\D/g, ''))
      .refine(
        (value) => value.length === RESET_CODE_LENGTH,
        t('validation.codeInvalid', { n: RESET_CODE_LENGTH })
      ),
    password: passwordField(t),
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
