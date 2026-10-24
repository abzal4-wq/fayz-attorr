import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE_SECONDS } from '@/lib/cache'

/** Baza javob bermaganda ishlatiladigan xavfsiz qiymatlar. */
const EMPTY_SETTINGS = {
  phone: '',
  address: '',
  workingHours: '',
  telegramUrl: '',
  instagramUrl: '',
  deliveryInfo: '',
  deliveryPrice: 0,
}

/**
 * Do'kon sozlamalari. Ikki qatlam kesh:
 *
 *  - `unstable_cache` — so'rovlar ORASIDA, 60 soniya. Bazani har bir
 *    sahifa ochilishida bezovta qilmaslik uchun (`lib/cache.js` dagi
 *    izohga qarang).
 *  - `cache` (React) — BITTA so'rov ichida: header, footer va sahifa
 *    uchun uch marta emas, bir marta.
 */
const loadStoreSettings = unstable_cache(
  async () => {
    const row = await prisma.storeSettings.findUnique({
      where: { id: 'settings' },
    })

    return {
      phone: row?.phone || '',
      address: row?.address || '',
      workingHours: row?.workingHours || '',
      telegramUrl: row?.telegramUrl || '',
      instagramUrl: row?.instagramUrl || '',
      deliveryInfo: row?.deliveryInfo || '',
      deliveryPrice: Number(row?.deliveryPrice ?? 0),
    }
  },
  ['store-settings'],
  { revalidate: CACHE_SECONDS, tags: ['settings'] }
)

/**
 * Sozlamalarni o'qiydi va XATO BO'LSA HAM sahifani yiqitmaydi.
 *
 * NEGA: bu funksiya footer orqali HAR BIR sahifada chaqiriladi. Avval
 * xato shundayligicha tashqariga chiqardi — natijada baza bir lahzaga
 * uzilsa, butun sayt 500 qaytarardi: katalog ham, mahsulot sahifasi
 * ham, hatto bazaga umuman bog'liq bo'lmagan sahifalar ham.
 *
 * Endi bunday paytda footer shunchaki aloqa ma'lumotlarisiz chiziladi
 * va mijoz atirlarni ko'raveradi. Xato logda qoladi.
 */
export const getStoreSettings = cache(async () => {
  try {
    return await loadStoreSettings()
  } catch (error) {
    console.error('Do\'kon sozlamalarini o\'qib bo\'lmadi:', error?.message)
    return EMPTY_SETTINGS
  }
})
