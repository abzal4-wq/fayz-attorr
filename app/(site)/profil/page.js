import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Package } from 'lucide-react'
import { LogoutButton } from '@/components/auth/logout-button'
import { getCurrentUser } from '@/lib/auth/session'
import { formatPhone } from '@/lib/auth/phone'
import { formatDateTime } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import { toNumber } from '@/lib/admin-api'
import { getMoney, getT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const t = await getT()
  return { title: t('meta.profileTitle') }
}

/** Status rangi — mijoz tomoni uchun (ochiq fonda, kontrast tekshirilgan). */
const STATUS_TONE = {
  NEW: 'bg-primary/20 text-gold-deep',
  CONFIRMED: 'bg-accent text-accent-foreground',
  PACKING: 'bg-muted text-muted-deep',
  DELIVERING: 'bg-muted text-muted-deep',
  COMPLETED: 'bg-success-deep/10 text-success-deep',
  CANCELLED: 'bg-destructive/10 text-danger-deep',
}

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/kirish?keyin=%2Fprofil')

  const [rows, t, money] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    }),
    getT(),
    getMoney(),
  ])

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 pb-16 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-2xl text-foreground md:text-3xl">
          {t('profile.title')}
        </h1>
        <LogoutButton>{t('profile.logout')}</LogoutButton>
      </div>

      <dl className="mt-6 divide-y divide-border rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-4 p-4">
          <dt className="text-sm text-muted-deep">{t('profile.name')}</dt>
          <dd className="text-card-foreground">{user.fullName || '—'}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <dt className="text-sm text-muted-deep">{t('profile.phone')}</dt>
          <dd className="text-card-foreground">{formatPhone(user.phone)}</dd>
        </div>
      </dl>

      <h2 className="mt-10 font-serif text-xl text-foreground md:text-2xl">
        {t('profile.myOrders')}
      </h2>

      {rows.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <Package className="size-8 text-muted-deep" aria-hidden="true" />
          <p className="mt-4 font-medium text-foreground">
            {t('profile.noOrders')}
          </p>
          <p className="mt-1 text-sm text-muted-deep">
            {t('profile.noOrdersHint')}
          </p>
          <Link
            href="/katalog"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light"
          >
            {t('common.goToCatalog')}
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {rows.map((order) => (
            <li
              key={order.id}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
                <div>
                  <p className="font-semibold text-card-foreground">
                    {t('profile.orderNumber', { number: order.orderNumber })}
                  </p>
                  <p className="text-sm text-muted-deep">
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    STATUS_TONE[order.status] ?? 'bg-muted text-muted-deep'
                  }`}
                >
                  {t(`orderStatus.${order.status}`)}
                </span>
              </div>

              <ul className="divide-y divide-border">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 p-4">
                    <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt=""
                          width={56}
                          height={56}
                          className="size-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-card-foreground">
                        {item.productName}
                      </p>
                      <p className="text-sm text-muted-deep">
                        {item.brandName} · {item.sizeLabel} ·{' '}
                        {t('common.pieces', { n: item.quantity })}
                      </p>
                    </div>
                    <p className="whitespace-nowrap text-sm text-muted-deep">
                      {money(toNumber(item.unitPrice) * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between gap-4 bg-muted/40 p-4">
                <span className="text-sm text-muted-deep">
                  {t('common.total')}
                </span>
                <span className="font-bold text-gold-deep">
                  {money(toNumber(order.totalAmount))}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
