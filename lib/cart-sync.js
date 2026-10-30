import { prisma } from '@/lib/prisma'
import { VISIBLE_PRODUCT } from '@/lib/catalog'
import { toNumber } from '@/lib/admin-api'

/** Bitta so'rovda tekshiriladigan eng ko'p variant (suiiste'molga qarshi). */
export const MAX_SYNC_ITEMS = 50

/**
 * Savatdagi variantlarning JORIY holati — savatni yangilash uchun.
 *
 * NEGA KERAK: savat brauzerda (localStorage) mahsulot QO'SHILGAN paytdagi
 * nom, narx va rasm havolasi bilan saqlanadi va hech qachon yangilanmasdi.
 * Natija:
 *  - Admin rasmni almashtirsa yoki o'chirsa, savatda o'lik havola qolardi —
 *    rasm abadiy "yuklanayotgandek" bo'sh turardi (o'lik Cloudinary
 *    havolasi /_next/image orqali ~2s da 404 qaytaradi, keyin bo'sh quti).
 *  - Narx o'zgarsa savatda eski narx ko'rinardi; farq faqat buyurtma
 *    berishda chiqardi.
 *
 * Shart buyurtma tekshiruvi bilan BIR XIL (VISIBLE_PRODUCT): savat "bor"
 * desa-yu, checkout "yo'q" deb rad etsa — bu yanada chalkash bo'lardi.
 *
 * Ro'yxatda yo'q variant — o'chirilgan yoki yashirilgan.
 *
 * @param {string[]} variantIds
 * @returns {Promise<Record<string, object>>} variantId -> joriy holat
 */
export async function getCartSnapshot(variantIds) {
  const ids = [...new Set(variantIds)].slice(0, MAX_SYNC_ITEMS)
  if (ids.length === 0) return {}

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: ids }, product: VISIBLE_PRODUCT },
    select: {
      id: true,
      finalPrice: true,
      stockQty: true,
      inStock: true,
      size: { select: { label: true } },
      product: {
        select: {
          name: true,
          slug: true,
          brand: { select: { name: true } },
          images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } },
        },
      },
    },
  })

  return Object.fromEntries(
    variants.map((v) => [
      v.id,
      {
        name: v.product.name,
        brandName: v.product.brand.name,
        sizeLabel: v.size.label,
        slug: v.product.slug,
        // Rasm o'chirilgan bo'lsa null — savat belgini ko'rsatadi
        imageUrl: v.product.images[0]?.url ?? null,
        unitPrice: toNumber(v.finalPrice),
        stockQty: v.stockQty,
        available: v.inStock && v.stockQty > 0,
      },
    ])
  )
}
