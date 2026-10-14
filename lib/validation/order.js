import { z } from 'zod'
import { normalizePhone } from '@/lib/auth/phone'

/**
 * Buyurtma formasi.
 *
 * DIQQAT: bu yerda NARX YO'Q. Mijoz faqat qaysi variantdan nechta
 * kerakligini aytadi — narxni server bazadan oladi va o'zi hisoblaydi.
 */
export const orderSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, 'Ismingizni kiriting')
    .max(80, 'Ism juda uzun'),

  customerPhone: z
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
    }),

  address: z
    .string()
    .trim()
    .min(10, "Manzilni to'liqroq yozing (tuman, ko'cha, uy)")
    .max(500, 'Manzil juda uzun'),

  comment: z
    .string()
    .trim()
    .max(1000, 'Izoh juda uzun')
    .optional()
    .or(z.literal('').transform(() => undefined)),

  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.coerce
          .number()
          .int()
          .min(1, "Soni 1 dan kam bo'lmaydi")
          .max(50, 'Bitta mahsulotdan 50 donadan ko\'p buyurtma qilib bo\'lmaydi'),
      })
    )
    .min(1, "Savat bo'sh"),
})
