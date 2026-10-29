import { z } from 'zod'
import { normalizePhone } from '@/lib/auth/phone'
import { optionalText, text } from '@/lib/validation/auth'

/** Son bo'lsa son, aks holda "yo'q" — hech qachon xato bermaydi. */
function optionalCoordinate() {
  return z.preprocess((value) => {
    const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
    return typeof n === 'number' && Number.isFinite(n) ? n : undefined
  }, z.number().optional())
}

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
    customerName: text(t('validation.nameRequired'))
      .trim()
      .min(2, t('validation.nameRequired'))
      .max(80, t('validation.nameMax')),

    customerPhone: text(t('validation.phoneRequired'))
      .min(1, t('validation.phoneRequired'))
      .transform((value, ctx) => {
        const normalized = normalizePhone(value)
        if (!normalized) {
          ctx.addIssue({ code: 'custom', message: t('validation.phoneInvalid') })
          return z.NEVER
        }
        return normalized
      }),

    address: text(t('validation.addressMin'))
      .trim()
      .min(10, t('validation.addressMin'))
      .max(500, t('validation.addressMax')),

    // optionalText: nega union emas — lib/validation/auth.js
    comment: optionalText(
      text(t('validation.commentMax')).trim().max(1000, t('validation.commentMax'))
    ),

    /*
     * Xaritadagi nuqta — ixtiyoriy. Sxema hech qachon xato bermaydi:
     * son bo'lmagan qiymat shunchaki tashlab yuboriladi. Juftlik va
     * chegara tekshiruvi serverda (lib/geo.js, cleanCoordinates) —
     * noto'g'ri nuqta buyurtmani to'xtatmasligi kerak.
     */
    latitude: optionalCoordinate(),
    longitude: optionalCoordinate(),

    items: z
      .array(
        z.object(
          {
            variantId: text(t('errors.checkData')).min(1, t('errors.checkData')),
            quantity: z.coerce
              .number({ error: t('validation.quantityMin') })
              .int()
              .min(1, t('validation.quantityMin'))
              .max(50, t('validation.quantityMax')),
          },
          { error: t('errors.checkData') }
        ),
        // Massiv umuman yuborilmasa ham inglizcha xato chiqmasin
        { error: t('validation.cartEmpty') }
      )
      .min(1, t('validation.cartEmpty')),
  })
}
