import { prisma } from '@/lib/prisma'
import { toNumber } from '@/lib/admin-api'
import { VISIBLE_PRODUCT } from '@/lib/catalog'
import { revalidateCatalog } from '@/lib/revalidate'

/**
 * Buyurtma yaratish.
 *
 * XAVFSIZLIK QOIDASI: brauzerdan faqat `variantId` va `quantity` keladi.
 * Narx, nom, brend va hajm — hammasi bazadan olinadi. Mijoz yuborgan
 * summaga umuman ishonilmaydi.
 *
 * Mavjudlik buyurtma paytida QAYTA tekshiriladi: savatga solingandan beri
 * atir nofaol bo'lishi, hajmi tugashi yoki narxi o'zgarishi mumkin.
 */

export class OrderError extends Error {
  constructor(message, details) {
    super(message)
    this.details = details
  }
}

/**
 * Buyurtma paytidagi tekshiruv: variantlar mavjud va yetarlimi.
 *
 * `t` — mijoz tanlagan til. Bu xabarlar buyurtma formasida ro'yxat
 * bo'lib ko'rinadi, shuning uchun ular ham tarjima qilinishi kerak.
 */
async function loadVariants(items, t) {
  const variantIds = items.map((i) => i.variantId)

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds }, product: VISIBLE_PRODUCT },
    include: {
      size: { select: { label: true } },
      product: {
        select: {
          name: true,
          brand: { select: { name: true } },
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        },
      },
    },
  })

  const byId = new Map(variants.map((v) => [v.id, v]))
  const problems = []

  for (const item of items) {
    const variant = byId.get(item.variantId)

    if (!variant) {
      problems.push({
        variantId: item.variantId,
        reason: t('errors.productGone'),
      })
      continue
    }

    const label = `${variant.product.name} (${variant.size.label})`

    if (!variant.inStock || variant.stockQty <= 0) {
      problems.push({
        variantId: item.variantId,
        reason: t('errors.variantSoldOut', { label }),
      })
      continue
    }

    if (variant.stockQty < item.quantity) {
      problems.push({
        variantId: item.variantId,
        reason: t('errors.variantLowStock', {
          label,
          qty: variant.stockQty,
          n: variant.stockQty,
        }),
      })
    }
  }

  return { byId, problems }
}

export async function createOrder({ items, customer, userId, t }) {
  const { byId, problems } = await loadVariants(items, t)

  if (problems.length > 0) {
    throw new OrderError(t('errors.cartChanged'), problems)
  }

  // Narxlar BAZADAN olinadi va jami SERVERDA hisoblanadi
  const orderItems = items.map((item) => {
    const variant = byId.get(item.variantId)
    const unitPrice = toNumber(variant.finalPrice)

    return {
      variantId: variant.id,
      productName: variant.product.name,
      brandName: variant.product.brand.name,
      sizeLabel: variant.size.label,
      unitPrice,
      quantity: item.quantity,
      imageUrl: variant.product.images[0]?.url ?? null,
    }
  })

  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  )

  // Buyurtma va qoldiqni kamaytirish — bitta tranzaksiyada.
  // Aks holda ikki mijoz oxirgi donani bir vaqtda sotib olishi mumkin.
  const order = await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const { count } = await tx.productVariant.updateMany({
        where: { id: item.variantId, stockQty: { gte: item.quantity } },
        data: { stockQty: { decrement: item.quantity } },
      })

      // Shart bajarilmasa hech narsa yangilanmaydi — demak kimdir
      // bizdan oldin ulgurgan.
      if (count === 0) {
        throw new OrderError(t('errors.justSoldOut'))
      }
    }

    return tx.order.create({
      data: {
        userId: userId ?? null,
        customerName: customer.customerName,
        customerPhone: customer.customerPhone,
        address: customer.address,
        comment: customer.comment ?? null,
        totalAmount,
        items: { create: orderItems },
      },
      include: { items: true },
    })
  })

  // Qoldiq o'zgardi — katalog keshi darhol yangilansin (izoh pastda)
  revalidateCatalog()

  return order
}

/**
 * Status o'zgarganda qoldiqni moslashtiradi.
 *
 * Buyurtma berilganda qoldiq kamaytirilgan. Bekor qilinsa — qaytariladi;
 * bekordan qaytarilsa — yana kamaytiriladi. Shunday qilib qoldiq
 * statusdan qat'i nazar to'g'ri turadi.
 */
export async function adjustStockForStatusChange(orderId, from, to) {
  const wasCancelled = from === 'CANCELLED'
  const isCancelled = to === 'CANCELLED'
  if (wasCancelled === isCancelled) return

  const items = await prisma.orderItem.findMany({
    where: { orderId, variantId: { not: null } },
    select: { variantId: true, quantity: true },
  })

  for (const item of items) {
    await prisma.productVariant
      .update({
        where: { id: item.variantId },
        data: {
          stockQty: isCancelled
            ? { increment: item.quantity } // bekor qilindi -> qaytdi
            : { decrement: item.quantity }, // qayta tiklandi -> yana ketdi
        },
      })
      .catch(() => {
        // Variant o'chirilgan bo'lishi mumkin — buyurtma statusi
        // shu sababli o'zgarmay qolmasligi kerak.
      })
  }

  /*
   * Qoldiq o'zgargach katalog keshi DARHOL bo'shatiladi.
   *
   * Atir sahifalari keshlanadi (lib/cache.js, 1 soat). Kesh tozalanmasa,
   * oxirgi dona sotilgan atir sahifada "mavjud" bo'lib turaverardi, bekor
   * qilingan buyurtma qaytargan qoldiq esa ko'rinmasdi. Shuning uchun bu
   * yerda — qoldiqni o'zgartiradigan yagona funksiyalarda (createOrder va
   * shu) — chaqiriladi: uchala yo'l (buyurtma berish, admin panel, Telegram
   * tugmasi) avtomatik qamrab olinadi, birontasida esdan chiqmaydi.
   */
  revalidateCatalog()
}
