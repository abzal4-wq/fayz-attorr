import { z } from 'zod'
import { priceAfterDiscount } from '@/lib/format'

/**
 * Bitta atirdagi eng ko'p rasm soni.
 *
 * Galereya 4-6 ta rasmni qulay ko'rsatadi; 10 — erkin chegara. U yo'q
 * edi va har yangi rasm saqlash paytida Cloudinary'dan tasdiqlanishi
 * sababli ko'p rasm saqlashni yiqitishi mumkin edi.
 *
 * Shu yerda turadi (`lib/products-admin.js` da emas): forma komponenti
 * ham uni ishlatadi, products-admin.js esa Prisma va Cloudinary SDK
 * ni import qiladi — brauzer bundle'iga tushib qolardi.
 */
export const MAX_PRODUCT_IMAGES = 10

/* ----------------------------- Brendlar ----------------------------- */

export const brandSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Brend nomini kiriting')
    .max(80, 'Nom juda uzun'),
  // Yangi yuklangan rasmning Cloudinary publicId'si (ixtiyoriy)
  logoPublicId: z.string().trim().min(1).optional().nullable(),
  // Mavjud logoni o'chirish
  removeLogo: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
})

export const brandOrderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Tartib ro'yxati bo'sh"),
})

/* ------------------------------ Hajmlar ------------------------------ */

export const sizeSchema = z.object({
  valueMl: z.coerce
    .number({ message: 'Hajmni raqam bilan kiriting' })
    .int('Hajm butun son bo\'lsin')
    .min(1, "Hajm 1 ml dan kam bo'lmasin")
    .max(10000, "Hajm juda katta"),
  // Bo'sh qoldirilsa "50 ml" ko'rinishida avtomatik yasaladi
  label: z.string().trim().max(30, 'Yorliq juda uzun').optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
})

/* ------------------------------ Atirlar ------------------------------ */

export const GENDERS = ['WOMEN', 'MEN', 'UNISEX']

export const variantSchema = z
  .object({
    sizeId: z.string().min(1, 'Hajmni tanlang'),
    price: z.coerce
      .number({ message: 'Narxni raqam bilan kiriting' })
      .min(0, "Narx manfiy bo'lmaydi")
      .max(999999999, 'Narx juda katta'),
    discountPercent: z.coerce
      .number()
      .int()
      .min(0, "Chegirma 0 dan kam bo'lmaydi")
      .max(100, 'Chegirma 100% dan oshmaydi')
      .optional()
      .default(0),
    stockQty: z.coerce.number().int().min(0).max(999999).optional().default(0),
    inStock: z.boolean().optional().default(true),
    sku: z.string().trim().max(60).optional().nullable(),
  })
  /*
   * Chegirmadan KEYINGI narx noldan katta bo'lishi shart.
   *
   * Alohida `price > 0` sharti yetarli emas edi, chunki nolga ikki
   * yo'ldan borish mumkin:
   *   - narx 0 qilib saqlab yuborish (maydon bo'sh qolsa)
   *   - chegirmaga 10 o'rniga 100 yozib yuborish
   *
   * Ikkalasi ham tasodifan bo'ladigan xato, natijasi esa bir xil:
   * mahsulot saytda "0 so'm" bo'lib turadi va uni istagancha
   * buyurtma qilsa bo'ladi. Sinab ko'rilgan: mijoz 3 dona bepul
   * mahsulotga buyurtma bera oldi.
   *
   * Shuning uchun tekshiruv YAKUNIY narx ustidan — bu haqiqiy
   * qoidaning o'zi: sotiladigan narsa biror pul turishi kerak.
   */
  .superRefine((variant, ctx) => {
    const final = priceAfterDiscount(variant.price, variant.discountPercent ?? 0)

    if (final <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['price'],
        message:
          variant.discountPercent >= 100
            ? "Chegirmadan keyin narx 0 bo'lib qoladi — chegirmani kamaytiring"
            : "Narx 0 dan katta bo'lishi kerak",
      })
    }
  })

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Atir nomini kiriting').max(120, 'Nom juda uzun'),
  brandId: z.string().min(1, 'Brendni tanlang'),
  gender: z.enum(GENDERS, { message: 'Jinsni tanlang' }),
  shortDescription: z.string().trim().max(300).optional().nullable(),
  description: z.string().trim().max(5000).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  // Rasmlar tartibi muhim: birinchisi asosiy rasm
  images: z
    .array(
      z.object({
        publicId: z.string().min(1),
        // Mavjud rasmlar uchun — allaqachon bazada bor
        existingId: z.string().min(1).optional(),
      })
    )
    .min(1, 'Kamida bitta rasm yuklang')
    // Chegara yo'q edi: har yangi rasm saqlashda Cloudinary'dan
    // tasdiqlanadi, ko'p rasm saqlashni sekinlashtiradi (products-admin.js)
    .max(MAX_PRODUCT_IMAGES, `Ko'pi bilan ${MAX_PRODUCT_IMAGES} ta rasm yuklash mumkin`),
  variants: z
    .array(variantSchema)
    .min(1, 'Kamida bitta hajm varianti qo\'shing')
    .refine(
      (variants) => new Set(variants.map((v) => v.sizeId)).size === variants.length,
      { message: 'Bir xil hajm ikki marta qo\'shilgan' }
    ),
})

/* ---------------------------- Buyurtmalar ---------------------------- */

export const ORDER_STATUSES = [
  'NEW',
  'CONFIRMED',
  'PACKING',
  'DELIVERING',
  'COMPLETED',
  'CANCELLED',
]

export const ORDER_STATUS_LABELS = {
  NEW: 'Yangi',
  CONFIRMED: 'Tasdiqlangan',
  PACKING: 'Yig\'ilmoqda',
  DELIVERING: 'Yetkazilmoqda',
  COMPLETED: 'Yakunlangan',
  CANCELLED: 'Bekor qilingan',
}

export const orderUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  adminNote: z.string().trim().max(2000).optional().nullable(),
})

/* ---------------------------- Sozlamalar ---------------------------- */

/**
 * Ijtimoiy tarmoq havolasi: faqat o'sha tarmoqning o'z manzili.
 *
 * NEGA: bu qiymat HAR BIR sahifa footer'iga `href` bo'lib chiqadi. Avval
 * ixtiyoriy satr qabul qilinardi — admin hisobi buzilsa, u yerga
 * fishing sayt (yoki `javascript:`) yozib, saytning barcha mijozlarini
 * yo'naltirish mumkin edi. React 19 `javascript:` ni bloklaydi, lekin
 * begona saytga havolani emas.
 *
 * Qulaylik: admin "fayz_attor", "@fayz_attor" yoki to'liq havola
 * yozishi mumkin — hammasi bir xil to'liq havolaga aylantiriladi.
 * Bo'sh satr — havolani olib tashlash.
 *
 * @param {RegExp} handleRe   foydalanuvchi nomi qoidasi
 * @param {RegExp} hostRe     ruxsat etilgan domenlar (to'liq havola uchun)
 * @param {string} base       kanonik manzil boshi
 */
function socialUrl(handleRe, hostRe, base, message) {
  return z
    .string()
    .trim()
    .max(200)
    .transform((raw, ctx) => {
      if (raw === '') return ''

      let handle = raw.replace(/^@/, '')
      if (/^https?:\/\//i.test(raw)) {
        let url
        try {
          url = new URL(raw)
        } catch {
          ctx.addIssue({ code: 'custom', message })
          return z.NEVER
        }
        if (!hostRe.test(url.hostname)) {
          ctx.addIssue({ code: 'custom', message })
          return z.NEVER
        }
        handle = url.pathname.replace(/^\/+|\/+$/g, '')
      }

      if (!handleRe.test(handle)) {
        ctx.addIssue({ code: 'custom', message })
        return z.NEVER
      }
      return base + handle
    })
    .optional()
}

export const settingsSchema = z.object({
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(300).optional(),
  workingHours: z.string().trim().max(120).optional(),
  telegramUrl: socialUrl(
    // Telegram: 5-32 belgi, harf/raqam/pastki chiziq
    /^[A-Za-z0-9_]{5,32}$/,
    /^(t\.me|telegram\.me)$/i,
    'https://t.me/',
    "Telegram havolasi noto'g'ri. Masalan: fayz_attor yoki https://t.me/fayz_attor"
  ),
  instagramUrl: socialUrl(
    // Instagram: 1-30 belgi, harf/raqam/nuqta/pastki chiziq
    /^[A-Za-z0-9_.]{1,30}$/,
    /^(www\.)?instagram\.com$/i,
    'https://www.instagram.com/',
    "Instagram havolasi noto'g'ri. Masalan: fayz_attor yoki https://instagram.com/fayz_attor"
  ),
  deliveryInfo: z.string().trim().max(600).optional(),
  deliveryPrice: z.coerce.number().min(0).max(999999999).optional(),
})
