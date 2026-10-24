import { fail, ok, readJson } from '@/lib/api'
import { guardAdmin, uniqueSlug } from '@/lib/admin-api'
import { prisma } from '@/lib/prisma'
import {
  assertSizesExist,
  syncProductImages,
  syncProductVariants,
} from '@/lib/products-admin'
import { productSchema } from '@/lib/validation/admin'
import { formatZodError } from '@/lib/validation/auth'
import { revalidateCatalog } from '@/lib/revalidate'

export async function POST(request) {
  const guard = await guardAdmin()
  if (guard.response) return guard.response

  const body = await readJson(request)
  if (!body) return fail("So'rov formati noto'g'ri")

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

  const slug = await uniqueSlug(data.name, async (candidate) =>
    Boolean(
      await prisma.product.findUnique({
        where: { slug: candidate },
        select: { id: true },
      })
    )
  )

  try {
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: data.name,
          slug,
          brandId: data.brandId,
          gender: data.gender,
          shortDescription: data.shortDescription || null,
          description: data.description || null,
          isActive: data.isActive,
          isFeatured: data.isFeatured,
        },
      })

      await syncProductImages(tx, created.id, data.images, [])
      await syncProductVariants(tx, created.id, data.variants)

      return created
    })

    revalidateCatalog()
    return ok({ product }, { status: 201 })
  } catch (error) {
    return fail(error.message || 'Atirni saqlab bo\'lmadi', { status: 400 })
  }
}
