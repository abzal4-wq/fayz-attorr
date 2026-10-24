import { fail, ok, readJson } from '@/lib/api'
import { guardAdmin, uniqueSlug } from '@/lib/admin-api'
import { prisma } from '@/lib/prisma'
import {
  assertSizesExist,
  purgeImages,
  syncProductImages,
  syncProductVariants,
} from '@/lib/products-admin'
import { productSchema } from '@/lib/validation/admin'
import { formatZodError } from '@/lib/validation/auth'
import { revalidateCatalog } from '@/lib/revalidate'

export async function PATCH(request, { params }) {
  const guard = await guardAdmin()
  if (guard.response) return guard.response

  const { id } = await params

  const existing = await prisma.product.findUnique({
    where: { id },
    include: { images: true },
  })
  if (!existing) return fail('Atir topilmadi', { status: 404 })

  const body = await readJson(request)
  if (!body) return fail("So'rov formati noto'g'ri")

  // Tez toggle (faol / tanlangan) uchun qisqartirilgan yo'l —
  // butun formani yuborish shart emas.
  const isQuickToggle =
    Object.keys(body).length > 0 &&
    Object.keys(body).every((key) => key === 'isActive' || key === 'isFeatured')

  if (isQuickToggle) {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
        ...(body.isFeatured !== undefined
          ? { isFeatured: Boolean(body.isFeatured) }
          : {}),
      },
    })
    revalidateCatalog()
    return ok({ product })
  }

  const parsed = productSchema.safeParse(body)
  if (!parsed.success) {
    const { fieldErrors, formErrors } = formatZodError(parsed.error)
    return fail(formErrors[0] ?? "Ma'lumotlarni tekshiring", { fieldErrors })
  }

  const data = parsed.data

  const brand = await prisma.brand.findUnique({
    where: { id: data.brandId },
    select: { id: true },
  })
  if (!brand) {
    return fail('Brend topilmadi', { fieldErrors: { brandId: 'Brendni tanlang' } })
  }

  try {
    await assertSizesExist(data.variants.map((v) => v.sizeId))
  } catch (error) {
    return fail(error.message, { fieldErrors: { variants: error.message } })
  }

  const updateData = {
    name: data.name,
    brandId: data.brandId,
    gender: data.gender,
    shortDescription: data.shortDescription || null,
    description: data.description || null,
    isActive: data.isActive,
    isFeatured: data.isFeatured,
  }

  // Nom o'zgargan bo'lsa slug ham yangilanadi
  if (data.name !== existing.name) {
    updateData.slug = await uniqueSlug(data.name, async (candidate) =>
      Boolean(
        await prisma.product.findFirst({
          where: { slug: candidate, NOT: { id } },
          select: { id: true },
        })
      )
    )
  }

  try {
    let orphanedImages = []

    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({ where: { id }, data: updateData })

      orphanedImages = await syncProductImages(
        tx,
        id,
        data.images,
        existing.images
      )
      await syncProductVariants(tx, id, data.variants)

      return updated
    })

    // Cloudinary'ni faqat baza muvaffaqiyatli yangilangandan keyin tozalaymiz
    await purgeImages(orphanedImages)

    revalidateCatalog()
    return ok({ product })
  } catch (error) {
    return fail(error.message || "Atirni saqlab bo'lmadi", { status: 400 })
  }
}

export async function DELETE(request, { params }) {
  const guard = await guardAdmin()
  if (guard.response) return guard.response

  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true },
  })
  if (!product) return fail('Atir topilmadi', { status: 404 })

  // Rasmlar va variantlar sxemadagi onDelete: Cascade orqali o'chadi.
  // OrderItem'dagi bog'lanish SetNull bo'ladi — buyurtma tarixi saqlanadi.
  await prisma.product.delete({ where: { id } })

  await purgeImages(product.images.map((img) => img.publicId))

  revalidateCatalog()
  return ok()
}
