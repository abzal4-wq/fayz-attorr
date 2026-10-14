import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, MessageSquare, Phone, User } from 'lucide-react'
import { AdminNote } from '@/components/admin/admin-note'
import { StatusSelect } from '@/components/admin/order-status'
import { prisma } from '@/lib/prisma'
import { toNumber } from '@/lib/admin-api'
import { formatDateTime, formatSom } from '@/lib/format'
import { formatPhone } from '@/lib/auth/phone'

export const metadata = { title: 'Buyurtma' }

export default async function OrderDetailPage({ params }) {
  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  })

  if (!order) notFound()

  const total = toNumber(order.totalAmount)

  return (
    <div className="pb-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/buyurtmalar"
            aria-label="Orqaga"
            className="flex size-11 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl text-foreground">
              Buyurtma #{order.orderNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-56">
          <StatusSelect orderId={order.id} status={order.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Mahsulotlar */}
        <div className="lg:col-span-2">
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <h2 className="border-b border-border p-4 font-medium text-card-foreground">
              Mahsulotlar
            </h2>
            <ul className="divide-y divide-border">
              {order.items.map((item) => {
                const unit = toNumber(item.unitPrice)
                return (
                  <li key={item.id} className="flex gap-3 p-4">
                    <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt=""
                          width={64}
                          height={64}
                          className="size-16 object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-card-foreground">
                        {item.productName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.brandName} · {item.sizeLabel}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatSom(unit)} × {item.quantity}
                      </p>
                    </div>
                    <p className="whitespace-nowrap font-semibold text-gold-deep">
                      {formatSom(unit * item.quantity)}
                    </p>
                  </li>
                )
              })}
            </ul>
            <div className="flex items-center justify-between border-t border-border bg-muted/40 p-4">
              <span className="font-medium text-card-foreground">Jami</span>
              <span className="text-lg font-bold text-gold-deep">
                {formatSom(total)}
              </span>
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-border bg-card p-4">
            <AdminNote orderId={order.id} initialNote={order.adminNote} />
          </section>
        </div>

        {/* Mijoz */}
        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-4 font-medium text-card-foreground">Mijoz</h2>

            <dl className="space-y-4 text-sm">
              <div className="flex gap-3">
                <User
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div>
                  <dt className="text-muted-foreground">Ism</dt>
                  <dd className="text-card-foreground">{order.customerName}</dd>
                </div>
              </div>

              <div className="flex gap-3">
                <Phone
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div>
                  <dt className="text-muted-foreground">Telefon</dt>
                  <dd>
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="font-medium text-card-foreground underline-offset-4 hover:underline"
                    >
                      {formatPhone(order.customerPhone)}
                    </a>
                  </dd>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div>
                  <dt className="text-muted-foreground">Manzil</dt>
                  <dd className="whitespace-pre-wrap text-card-foreground">
                    {order.address}
                  </dd>
                </div>
              </div>

              {order.comment ? (
                <div className="flex gap-3">
                  <MessageSquare
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-muted-foreground">Mijoz izohi</dt>
                    <dd className="whitespace-pre-wrap text-card-foreground">
                      {order.comment}
                    </dd>
                  </div>
                </div>
              ) : null}
            </dl>

            <a
              href={`tel:${order.customerPhone}`}
              className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition-colors hover:bg-gold-light"
            >
              <Phone className="size-4" aria-hidden="true" />
              Qo'ng'iroq qilish
            </a>
          </section>
        </aside>
      </div>
    </div>
  )
}
