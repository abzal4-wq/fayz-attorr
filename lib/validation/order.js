import { z } from 'zod'
import { normalizePhone } from '@/lib/auth/phone'

/**
 * Buyurtma formasi.
 *
 * DIQQAT: bu yerda NARX YO'Q. Mijoz faqat qaysi variantdan nechta
 * kerakligini aytadi — narxni server bazadan oladi va o'zi hisoblaydi.
 *
 * Sxema fabrika: xato matnlari tanlangan tilda bo'lishi kerak
 * (`lib/validation/auth.js` dagi izohga qarang).
 */
export function makeOrderSchema(t) {
  return z.object({
    customerName: z
      .string()
      .trim()
      .min(2, t('validation.nameRequired'))
      .max(80, t('validation.nameMax')),

    customerPhone: z
      .string()
      .min(1, t('validation.phoneRequired'))
      .transform((value, ctx) => {
        const normalized = normalizePhone(value)
        if (!normalized) {
          ctx.addIssue({ code: 'custom', message: t('validation.phoneInvalid') })
          return z.NEVER
        }
        return normalized
      }),

    address: z
      .string()
      .trim()
      .min(10, t('validation.addressMin'))
      .max(500, t('validation.addressMax')),

    comment: z
      .string()
      .trim()
      .max(1000, t('validation.commentMax'))
      .optional()
      .or(z.literal('').transform(() => undefined)),

    items: z
      .array(
        z.object({
          variantId: z.string().min(1),
          quantity: z.coerce
            .number()
            .int()
            .min(1, t('validation.quantityMin'))
            .max(50, t('validation.quantityMax')),
        })
      )
      .min(1, t('validation.cartEmpty')),
  })
}
