import { z } from 'zod'
import { normalizePhone } from '@/lib/auth/phone'
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password'

/**
 * Telefon maydoni: foydalanuvchi maskalangan ko'rinishda yozadi,
 * sxema uni E.164 ga aylantiradi. Keyingi kod har doim +998XXXXXXXXX oladi.
 */
const phoneField = z
  .string()
  .min(1, 'Telefon raqamini kiriting')
  .transform((value, ctx) => {
    const normalized = normalizePhone(value)
    if (!normalized) {
      ctx.addIssue({
        code: 'custom',
        message: "Telefon raqami noto'g'ri. Masalan: +998 (90) 123-45-67",
      })
      return z.NEVER
    }
    return normalized
  })

const passwordField = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Parol kamida ${MIN_PASSWORD_LENGTH} ta belgi bo'lsin`)
  .max(72, "Parol juda uzun (72 belgidan oshmasin)") // bcrypt cheklovi

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Ismingizni kiriting")
    .max(80, 'Ism juda uzun')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  phone: phoneField,
  password: passwordField,
})

export const loginSchema = z.object({
  phone: phoneField,
  password: z.string().min(1, 'Parolni kiriting'),
})

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
