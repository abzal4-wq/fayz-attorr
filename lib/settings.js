import { cache } from 'react'
import { prisma } from '@/lib/prisma'

/**
 * Do'kon sozlamalari. `cache` — bitta so'rov davomida bazaga bir marta
 * murojaat qilinadi (header, footer va sahifa uchun uch marta emas).
 */
export const getStoreSettings = cache(async () => {
  const row = await prisma.storeSettings.findUnique({ where: { id: 'settings' } })

  return {
    phone: row?.phone || '',
    address: row?.address || '',
    workingHours: row?.workingHours || '',
    telegramUrl: row?.telegramUrl || '',
    instagramUrl: row?.instagramUrl || '',
    deliveryInfo: row?.deliveryInfo || '',
    deliveryPrice: Number(row?.deliveryPrice ?? 0),
  }
})
