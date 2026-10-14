import { guardAdmin, toNumber } from '@/lib/admin-api'
import { prisma } from '@/lib/prisma'
import { formatDateTime } from '@/lib/format'
import { ORDER_STATUS_LABELS, ORDER_STATUSES } from '@/lib/validation/admin'

/** CSV katagi: qo'shtirnoq ikkilantiriladi, butun qiymat qo'shtirnoqqa olinadi. */
function cell(value) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

export async function GET(request) {
  const guard = await guardAdmin()
  if (guard.response) return guard.response

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const where = {}
  if (status && ORDER_STATUSES.includes(status)) where.status = status
  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.gte = new Date(from)
    if (to) {
      // Oxirgi kun to'liq kirsin
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      where.createdAt.lte = end
    }
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  })

  const header = [
    'Buyurtma',
    'Sana',
    'Mijoz',
    'Telefon',
    'Manzil',
    'Status',
    'Mahsulot',
    'Brend',
    'Hajm',
    'Narx',
    'Soni',
    'Summa',
    'Jami',
    'Izoh',
    'Admin izohi',
  ]

  const rows = [header.map(cell).join(';')]

  for (const order of orders) {
    for (const item of order.items) {
      const unitPrice = toNumber(item.unitPrice)
      rows.push(
        [
          order.orderNumber,
          formatDateTime(order.createdAt),
          order.customerName,
          order.customerPhone,
          order.address,
          ORDER_STATUS_LABELS[order.status] ?? order.status,
          item.productName,
          item.brandName,
          item.sizeLabel,
          unitPrice,
          item.quantity,
          unitPrice * item.quantity,
          toNumber(order.totalAmount),
          order.comment ?? '',
          order.adminNote ?? '',
        ]
          .map(cell)
          .join(';')
      )
    }
  }

  // BOM — Excel faylni UTF-8 deb tanishi uchun (o'zbek va kirill harflari
  // buzilmasin). Ajratuvchi nuqtali vergul: Excel'ning ru/uz mintaqaviy
  // sozlamalarida vergul o'nlik belgisi hisoblanadi.
  const csv = '﻿' + rows.join('\r\n')
  const date = new Date().toISOString().slice(0, 10)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="buyurtmalar-${date}.csv"`,
    },
  })
}
