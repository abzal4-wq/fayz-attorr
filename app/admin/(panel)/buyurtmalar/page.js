import { Suspense } from 'react'
import { OrdersList } from '@/components/admin/orders-list'
import { prisma } from '@/lib/prisma'
import { toNumber } from '@/lib/admin-api'
import { ORDER_STATUSES } from '@/lib/validation/admin'
import { normalizePhone } from '@/lib/auth/phone'

export const metadata = { title: 'Buyurtmalar' }

function buildWhere({ q, status, from, to }) {
  const where = {}

  if (status && ORDER_STATUSES.includes(status)) where.status = status

  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.gte = new Date(from)
    if (to) {
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      where.createdAt.lte = end
    }
  }

  if (q) {
    // Qidiruv: buyurtma raqami yoki telefon.
    // Telefon har xil ko'rinishda yozilishi mumkin — E.164 ga keltiramiz.
    const asNumber = Number.parseInt(q.replace(/\D/g, ''), 10)
    const asPhone = normalizePhone(q)

    where.OR = [
      ...(asPhone ? [{ customerPhone: asPhone }] : []),
      ...(Number.isFinite(asNumber) ? [{ orderNumber: asNumber }] : []),
      { customerPhone: { contains: q.replace(/\D/g, '') } },
      { customerName: { contains: q, mode: 'insensitive' } },
    ]
  }

  return where
}

export default async function OrdersPage({ searchParams }) {
  const params = await searchParams
  const filters = {
    q: params?.q?.trim() || '',
    status: params?.status || '',
    from: params?.from || '',
    to: params?.to || '',
  }

  const rows = await prisma.order.findMany({
    where: buildWhere(filters),
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { _count: { select: { items: true } } },
  })

  const orders = rows.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    totalAmount: toNumber(o.totalAmount),
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    itemCount: o._count.items,
  }))

  return (
    <Suspense fallback={null}>
      <OrdersList orders={orders} filters={filters} />
    </Suspense>
  )
}
