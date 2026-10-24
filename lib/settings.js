import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE_SECONDS } from '@/lib/cache'

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

export const getStoreSettings = cache(loadStoreSettings)
