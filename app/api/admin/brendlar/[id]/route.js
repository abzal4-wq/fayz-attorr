import { fail, ok, readJson } from '@/lib/api'
import { guardAdmin, uniqueSlug } from '@/lib/admin-api'
import { confirmUpload, deleteImage } from '@/lib/cloudinary'
import { prisma } from '@/lib/prisma'
import { brandSchema } from '@/lib/validation/admin'
import { formatZodError } from '@/lib/validation/auth'

export async function PATCH(request, { params }) {
  const guard = await guardAdmin()
  if (guard.response) return guard.response

  const { id } = await params

  const existing = await prisma.brand.findUnique({ where: { id } })
  if (!existing) return fail('Brend topilmadi', { status: 404 })

  const body = await readJson(request)
  if (!body) return fail("So'rov formati noto'g'ri")

  const parsed = brandSchema.partial().safeParse(body)
  if (!parsed.success) {
    return fail("Ma'lumotlarni tekshiring", {
      fieldErrors: formatZodError(parsed.error).fieldErrors,
    })
  }

  const { name, logoPublicId, removeLogo, sortOrder, isActive } = parsed.data
  const data = {}

  if (name !== undefined && name !== existing.name) {
    const duplicate = await prisma.brand.findFirst({
      where: { name, NOT: { id } },
      select: { id: true },
    })
    if (duplicate) {
      return fail('Bunday brend allaqachon mavjud', {
        fieldErrors: { name: 'Bu nom band' },
      })
    }
    data.name = name
    data.slug = await uniqueSlug(name, async (candidate) =>
      Boolean(
        await prisma.brand.findFirst({
          where: { slug: candidate, NOT: { id } },
          select: { id: true },
        })
      )
    )
  }

  if (sortOrder !== undefined) data.sortOrder = sortOrder
  if (isActive !== undefined) data.isActive = isActive

  // Eski logoni faqat baza muvaffaqiyatli yangilangandan keyin o'chiramiz
  let logoToDelete = null

  if (logoPublicId) {
    let logo
    try {
      logo = await confirmUpload(logoPublicId)
    } catch (error) {
      return fail(error.message, { fieldErrors: { logo: error.message } })
    }
    data.logoUrl = logo.url
    data.logoId = logo.publicId
    logoToDelete = existing.logoId
  } else if (removeLogo) {
    data.logoUrl = null
    data.logoId = null
    logoToDelete = existing.logoId
  }

  const brand = await prisma.brand.update({ where: { id }, data })

  if (logoToDelete) await deleteImage(logoToDelete)

  return ok({ brand })
}

export async function DELETE(request, { params }) {
  const guard = await guardAdmin()
  if (guard.response) return guard.response

  const { id } = await params

  const brand = await prisma.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  })
  if (!brand) return fail('Brend topilmadi', { status: 404 })

  // Mahsuloti bor brendni o'chirish mumkin emas — buyurtmalar tarixi buziladi.
  if (brand._count.products > 0) {
    return fail(
      `Bu brendda ${brand._count.products} ta atir bor. Avval ularni boshqa brendga o'tkazing yoki o'chiring. Brendni vaqtincha yashirish uchun uni "nofaol" qiling.`,
      { status: 409 }
    )
  }

  await prisma.brand.delete({ where: { id } })
  if (brand.logoId) await deleteImage(brand.logoId)

  return ok()
}
