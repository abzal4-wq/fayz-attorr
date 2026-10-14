import { z } from 'zod'

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

export const variantSchema = z.object({
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
    .min(1, 'Kamida bitta rasm yuklang'),
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

export const settingsSchema = z.object({
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(300).optional(),
  workingHours: z.string().trim().max(120).optional(),
  telegramUrl: z.string().trim().max(200).optional(),
  instagramUrl: z.string().trim().max(200).optional(),
  deliveryInfo: z.string().trim().max(600).optional(),
  deliveryPrice: z.coerce.number().min(0).max(999999999).optional(),
})
