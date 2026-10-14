import Link from 'next/link'
import { AlertTriangle, Package, ShoppingBag, TrendingUp } from 'lucide-react'
import { StatusBadge } from '@/components/admin/order-status'
import { EmptyState } from '@/components/admin/display'
import { prisma } from '@/lib/prisma'
import { toNumber } from '@/lib/admin-api'
import { formatDateTime, formatSom } from '@/lib/format'
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '@/lib/validation/admin'

export const metadata = { title: 'Boshqaruv paneli' }

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function daysAgo(n) {
  const d = startOfToday()
  d.setDate(d.getDate() - n)
  return d
}

/**
 * Davr bo'yicha buyurtmalar soni va summasi.
 * Bekor qilingan buyurtmalar tushumga kirmaydi.
 */
async function periodStats(since) {
  const result = await prisma.order.aggregate({
    where: { createdAt: { gte: since }, status: { not: 'CANCELLED' } },
    _count: { _all: true },
    _sum: { totalAmount: true },
  })
  return {
    count: result._count._all,
    total: toNumber(result._sum.totalAmount) || 0,
  }
}

function StatCard({ label, count, total }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-card-foreground">{count} ta</p>
      <p className="mt-1 text-sm font-medium text-gold-deep">{formatSom(total)}</p>
    </div>
  )
}

export default async function AdminDashboardPage() {
  const [today, week, month, statusCounts, recentOrders, topItems, outOfStock] =
    await Promise.all([
      periodStats(startOfToday()),
      periodStats(daysAgo(7)),
      periodStats(daysAgo(30)),
      prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          totalAmount: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.orderItem.groupBy({
        by: ['productName', 'brandName'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      // Faol, lekin barcha variantlari tugagan atirlar
      prisma.product.findMany({
        where: {
          isActive: true,
          // `some` shart: Prisma'da `every` bo'sh ro'yxatga ham true qaytaradi,
          // ya'ni umuman varianti yo'q atir ham "tugagan" bo'lib ko'rinardi.
          variants: {
            some: {},
            every: { OR: [{ inStock: false }, { stockQty: { lte: 0 } }] },
          },
        },
        select: { id: true, name: true, brand: { select: { name: true } } },
        take: 10,
      }),
    ])

  const countByStatus = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count._all])
  )

  return (
    <div className="pb-10">
      <h1 className="mb-6 font-serif text-2xl text-foreground">Boshqaruv paneli</h1>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Bugun" count={today.count} total={today.total} />
        <StatCard label="Oxirgi 7 kun" count={week.count} total={week.total} />
        <StatCard label="Oxirgi 30 kun" count={month.count} total={month.total} />
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-medium text-foreground">Status bo'yicha</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {ORDER_STATUSES.map((status) => (
            <Link
              key={status}
              href={`/admin/buyurtmalar?status=${status}`}
              className="rounded-lg border border-border bg-card p-3 transition-colors hover:border-secondary"
            >
              <p className="text-xl font-bold text-card-foreground">
                {countByStatus[status] ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {ORDER_STATUS_LABELS[status]}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {outOfStock.length > 0 ? (
        <section className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <h2 className="flex items-center gap-2 font-medium text-danger-deep">
            <AlertTriangle className="size-4" aria-hidden="true" />
            Tugagan atirlar ({outOfStock.length})
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bu atirlar saytda ko'rinadi, lekin savatga qo'shib bo'lmaydi.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {outOfStock.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/atirlar/${p.id}`}
                  className="inline-flex rounded-lg border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:border-destructive"
                >
                  {p.name}{' '}
                  <span className="ml-1 text-muted-foreground">{p.brand.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium text-foreground">Oxirgi buyurtmalar</h2>
            <Link
              href="/admin/buyurtmalar"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Barchasi
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Hali buyurtma yo'q"
              description="Birinchi buyurtma kelganda shu yerda ko'rinadi."
            />
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/buyurtmalar/${order.id}`}
                    className="flex flex-wrap items-center gap-3 p-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="font-semibold text-card-foreground">
                      #{order.orderNumber}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                      {order.customerName}
                    </span>
                    <span className="whitespace-nowrap text-sm font-medium text-gold-deep">
                      {formatSom(toNumber(order.totalAmount))}
                    </span>
                    <StatusBadge status={order.status} />
                    <span className="hidden whitespace-nowrap text-xs text-muted-foreground lg:inline">
                      {formatDateTime(order.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 font-medium text-foreground">
            <TrendingUp className="size-4" aria-hidden="true" />
            Eng ko'p sotilgan
          </h2>

          {topItems.length === 0 ? (
            <EmptyState icon={Package} title="Ma'lumot yo'q" />
          ) : (
            <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {topItems.map((item, index) => (
                <li
                  key={`${item.brandName}-${item.productName}`}
                  className="flex items-center gap-3 p-3"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-card-foreground">
                      {item.productName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.brandName}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-sm text-muted-foreground">
                    {item._sum.quantity} dona
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
