import { fail, ok, readJson } from '@/lib/api'
import { guardAdmin } from '@/lib/admin-api'
import { prisma } from '@/lib/prisma'
import { adjustStockForStatusChange } from '@/lib/orders'
import { orderUpdateSchema } from '@/lib/validation/admin'
import { formatZodError } from '@/lib/validation/auth'

export async function PATCH(request, { params }) {
  const guard = await guardAdmin()
  if (guard.response) return guard.response

  const { id } = await params

  const existing = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true },
  })
  if (!existing) return fail('Buyurtma topilmadi', { status: 404 })

  const body = await readJson(request)
  if (!body) return fail("So'rov formati noto'g'ri")

  const parsed = orderUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return fail("Ma'lumotlarni tekshiring", {
      fieldErrors: formatZodError(parsed.error).fieldErrors,
    })
  }

  const { status, adminNote } = parsed.data
  const data = {}
  if (status !== undefined) data.status = status
  if (adminNote !== undefined) data.adminNote = adminNote || null

  const order = await prisma.order.update({ where: { id }, data })

  // Buyurtma berilganda qoldiq kamaytirilgan edi. Bekor qilinsa qaytariladi,
  // bekordan tiklansa yana kamaytiriladi — qoldiq har doim to'g'ri turadi.
  if (status !== undefined && status !== existing.status) {
    await adjustStockForStatusChange(id, existing.status, status)
  }

  return ok({ order: { id: order.id, status: order.status } })
}
