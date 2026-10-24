import { fail, ok, readJson } from '@/lib/api'
import { guardAdmin } from '@/lib/admin-api'
import { prisma } from '@/lib/prisma'
import { sizeSchema } from '@/lib/validation/admin'
import { formatZodError } from '@/lib/validation/auth'
import { revalidateCatalog } from '@/lib/revalidate'

export async function PATCH(request, { params }) {
  const guard = await guardAdmin()
  if (guard.response) return guard.response

  const { id } = await params

  const existing = await prisma.size.findUnique({ where: { id } })
  if (!existing) return fail('Hajm topilmadi', { status: 404 })

  const body = await readJson(request)
  if (!body) return fail("So'rov formati noto'g'ri")

  const parsed = sizeSchema.partial().safeParse(body)
  if (!parsed.success) {
    return fail("Ma'lumotlarni tekshiring", {
      fieldErrors: formatZodError(parsed.error).fieldErrors,
    })
  }

  const { valueMl, label, sortOrder, isActive } = parsed.data
  const data = {}

  if (valueMl !== undefined && valueMl !== existing.valueMl) {
    const duplicate = await prisma.size.findFirst({
      where: { valueMl, NOT: { id } },
      select: { id: true },
    })
    if (duplicate) {
      return fail('Bu hajm allaqachon mavjud', {
        fieldErrors: { valueMl: `${valueMl} ml ro'yxatda bor` },
      })
    }
    data.valueMl = valueMl
    // Yorliq qo'lda o'zgartirilmagan bo'lsa, u ham yangilanadi
    if (label === undefined && existing.label === `${existing.valueMl} ml`) {
      data.label = `${valueMl} ml`
    }
  }

  if (label !== undefined) data.label = label.trim() || `${valueMl ?? existing.valueMl} ml`
  if (sortOrder !== undefined) data.sortOrder = sortOrder
  if (isActive !== undefined) data.isActive = isActive

  const size = await prisma.size.update({ where: { id }, data })
  revalidateCatalog()
  return ok({ size })
}

export async function DELETE(request, { params }) {
  const guard = await guardAdmin()
  if (guard.response) return guard.response

  const { id } = await params

  const size = await prisma.size.findUnique({
    where: { id },
    include: { _count: { select: { variants: true } } },
  })
  if (!size) return fail('Hajm topilmadi', { status: 404 })

  // Bu hajm atirlarda ishlatilayotgan bo'lsa, o'chirish narxlarni yo'q qiladi.
  if (size._count.variants > 0) {
    return fail(
      `Bu hajm ${size._count.variants} ta atir variantida ishlatilmoqda. O'chirish o'rniga uni "nofaol" qiling — shunda yangi atirlarga qo'shib bo'lmaydi, lekin mavjud narxlar saqlanadi.`,
      { status: 409 }
    )
  }

  await prisma.size.delete({ where: { id } })
  revalidateCatalog()
  return ok()
}
