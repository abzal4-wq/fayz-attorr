import { fail, ok, readJson } from '@/lib/api'
import { guardAdmin } from '@/lib/admin-api'
import { prisma } from '@/lib/prisma'
import { sizeSchema } from '@/lib/validation/admin'
import { formatZodError } from '@/lib/validation/auth'

export async function GET() {
  const guard = await guardAdmin()
  if (guard.response) return guard.response

  const sizes = await prisma.size.findMany({
    orderBy: [{ sortOrder: 'asc' }, { valueMl: 'asc' }],
    include: { _count: { select: { variants: true } } },
  })

  return ok({
    sizes: sizes.map((s) => ({
      id: s.id,
      valueMl: s.valueMl,
      label: s.label,
      sortOrder: s.sortOrder,
      isActive: s.isActive,
      variantCount: s._count.variants,
    })),
  })
}

export async function POST(request) {
  const guard = await guardAdmin()
  if (guard.response) return guard.response

  const body = await readJson(request)
  if (!body) return fail("So'rov formati noto'g'ri")

  const parsed = sizeSchema.safeParse(body)
  if (!parsed.success) {
    return fail("Ma'lumotlarni tekshiring", {
      fieldErrors: formatZodError(parsed.error).fieldErrors,
    })
  }

  const { valueMl, label, sortOrder, isActive } = parsed.data

  const duplicate = await prisma.size.findUnique({
    where: { valueMl },
    select: { id: true },
  })
  if (duplicate) {
    return fail('Bu hajm allaqachon mavjud', {
      fieldErrors: { valueMl: `${valueMl} ml ro'yxatda bor` },
    })
  }

  const size = await prisma.size.create({
    data: {
      valueMl,
      label: label?.trim() || `${valueMl} ml`,
      sortOrder: sortOrder ?? valueMl,
      isActive: isActive ?? true,
    },
  })

  return ok({ size }, { status: 201 })
}
