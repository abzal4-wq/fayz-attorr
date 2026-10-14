import { fail, ok, readJson } from '@/lib/api'
import { guardAdmin, uniqueSlug } from '@/lib/admin-api'
import { confirmUpload } from '@/lib/cloudinary'
import { prisma } from '@/lib/prisma'
import { brandSchema } from '@/lib/validation/admin'
import { formatZodError } from '@/lib/validation/auth'

export async function GET() {
  const guard = await guardAdmin()
  if (guard.response) return guard.response

  const brands = await prisma.brand.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: true } } },
  })

  return ok({
    brands: brands.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoUrl: b.logoUrl,
      sortOrder: b.sortOrder,
      isActive: b.isActive,
      productCount: b._count.products,
    })),
  })
}

export async function POST(request) {
  const guard = await guardAdmin()
  if (guard.response) return guard.response

  const body = await readJson(request)
  if (!body) return fail("So'rov formati noto'g'ri")

  const parsed = brandSchema.safeParse(body)
  if (!parsed.success) {
    return fail("Ma'lumotlarni tekshiring", {
      fieldErrors: formatZodError(parsed.error).fieldErrors,
    })
  }

  const { name, logoPublicId, sortOrder, isActive } = parsed.data

  const duplicate = await prisma.brand.findUnique({
    where: { name },
    select: { id: true },
  })
  if (duplicate) {
    return fail('Bunday brend allaqachon mavjud', {
      fieldErrors: { name: 'Bu nom band' },
    })
  }

  let logo = null
  if (logoPublicId) {
    try {
      logo = await confirmUpload(logoPublicId)
    } catch (error) {
      return fail(error.message, { fieldErrors: { logo: error.message } })
    }
  }

  const slug = await uniqueSlug(name, async (candidate) =>
    Boolean(
      await prisma.brand.findUnique({
        where: { slug: candidate },
        select: { id: true },
      })
    )
  )

  const brand = await prisma.brand.create({
    data: {
      name,
      slug,
      logoUrl: logo?.url ?? null,
      logoId: logo?.publicId ?? null,
      sortOrder: sortOrder ?? 0,
      isActive: isActive ?? true,
    },
  })

  return ok({ brand }, { status: 201 })
}
