import { confirmUpload, deleteImage } from '@/lib/cloudinary'
import { prisma } from '@/lib/prisma'

/**
 * Atir rasmlarini kelgan tartibda sinxronlaydi.
 *
 * Mijoz TO'LIQ istalgan ro'yxatni yuboradi (tartibi bilan). Server:
 *  - allaqachon shu atirga biriktirilgan rasmlarni qayta tasdiqlamaydi
 *  - yangi publicId'larni Cloudinary'dan tasdiqlaydi (URL serverda aniqlanadi)
 *  - ro'yxatdan chiqarilgan rasmlarni bazadan va Cloudinary'dan o'chiradi
 *
 * @returns Cloudinary'dan o'chirilishi kerak bo'lgan publicId'lar
 */
export async function syncProductImages(tx, productId, images, existingImages = []) {
  const existingByPublicId = new Map(existingImages.map((img) => [img.publicId, img]))
  const keepPublicIds = new Set(images.map((img) => img.publicId))

  const rows = []
  for (const [index, image] of images.entries()) {
    const existing = existingByPublicId.get(image.publicId)

    if (existing) {
      // Allaqachon bizda bor — qayta tasdiqlash shart emas
      rows.push({
        url: existing.url,
        publicId: existing.publicId,
        sortOrder: index,
      })
      continue
    }

    const confirmed = await confirmUpload(image.publicId)
    rows.push({
      url: confirmed.url,
      publicId: confirmed.publicId,
      sortOrder: index,
    })
  }

  // Tartib o'zgargan bo'lishi mumkin — eski qatorlarni almashtiramiz
  await tx.productImage.deleteMany({ where: { productId } })
  await tx.productImage.createMany({
    data: rows.map((row) => ({ ...row, productId })),
  })

  return existingImages
    .filter((img) => !keepPublicIds.has(img.publicId))
    .map((img) => img.publicId)
}

/**
 * Hajm variantlarini sinxronlaydi.
 *
 * Variant o'chirilsa, buyurtma tarixi buzilmaydi: OrderItem'da nom va narx
 * nusxasi saqlanadi, bog'lanish esa SetNull bo'ladi (sxemaga qarang).
 */
export async function syncProductVariants(tx, productId, variants) {
  const existing = await tx.productVariant.findMany({ where: { productId } })
  const existingBySizeId = new Map(existing.map((v) => [v.sizeId, v]))
  const keepSizeIds = new Set(variants.map((v) => v.sizeId))

  for (const variant of variants) {
    const price = Number(variant.price)
    const discount = Number(variant.discountPercent ?? 0)

    const data = {
      price,
      discountPercent: discount,
      // Chegirmadan keyingi narx bazada saqlanadi — katalogdagi filtr va
      // saralash shu ustun bo'yicha ishlaydi (lib/format.js dagi
      // priceAfterDiscount bilan bir xil formula).
      finalPrice: discount ? Math.round(price * (1 - discount / 100)) : price,
      stockQty: variant.stockQty ?? 0,
      inStock: variant.inStock ?? true,
      sku: variant.sku?.trim() || null,
    }

    const current = existingBySizeId.get(variant.sizeId)
    if (current) {
      await tx.productVariant.update({ where: { id: current.id }, data })
    } else {
      await tx.productVariant.create({
        data: { ...data, productId, sizeId: variant.sizeId },
      })
    }
  }

  const toRemove = existing.filter((v) => !keepSizeIds.has(v.sizeId))
  if (toRemove.length > 0) {
    await tx.productVariant.deleteMany({
      where: { id: { in: toRemove.map((v) => v.id) } },
    })
  }
}

/** Tanlangan hajmlar haqiqatan mavjud va faolligini tekshiradi. */
export async function assertSizesExist(sizeIds) {
  const sizes = await prisma.size.findMany({
    where: { id: { in: sizeIds } },
    select: { id: true },
  })
  if (sizes.length !== sizeIds.length) {
    throw new Error("Tanlangan hajmlardan biri topilmadi")
  }
}

/**
 * Keraksiz bo'lib qolgan rasmlarni Cloudinary'dan o'chiradi.
 *
 * FAQAT boshqa hech qayerda ishlatilmayotganini tekshirgandan keyin.
 *
 * NEGA: `ProductImage.publicId` noyob emas va bo'lishi ham shart
 * emas — admin bitta formani ikki marta yuborsa yoki mahsulotni
 * nusxalasa, ikkita atir BIR XIL Cloudinary faylini ko'rsatadi.
 * Avval bu yerda ro'yxatdagi hamma publicId shartsiz o'chirilardi,
 * ya'ni birinchi atir tahrirlanganda ikkinchisining rasmi ham
 * yo'q bo'lardi: bazada yozuv qolar, fayl esa 404 qaytarardi.
 *
 * Aynan shunday holat jonli saytda topildi — bitta atirning
 * to'rtala rasmi ham Cloudinary'da yo'q edi.
 */
export async function purgeImages(publicIds) {
  if (!publicIds?.length) return

  const stillUsed = await prisma.productImage.findMany({
    where: { publicId: { in: publicIds } },
    select: { publicId: true },
  })
  const used = new Set(stillUsed.map((row) => row.publicId))

  for (const publicId of publicIds) {
    if (used.has(publicId)) continue
    await deleteImage(publicId)
  }
}

/**
 * Brend logotipini Cloudinary'dan o'chiradi — agar boshqa brend
 * o'sha faylni ishlatmayotgan bo'lsa.
 *
 * `purgeImages` bilan bir xil sabab: `Brand.logoId` ham noyob emas,
 * ikki brend bitta faylni ko'rsatishi mumkin.
 */
export async function purgeBrandLogo(logoId) {
  if (!logoId) return

  const stillUsed = await prisma.brand.count({ where: { logoId } })
  if (stillUsed > 0) return

  await deleteImage(logoId)
}
