'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Download, Phone, Search, ShoppingBag } from 'lucide-react'
import { Input, Select } from './ui'
import { EmptyState, PageHeader } from './display'
import { StatusBadge, StatusSelect } from './order-status'
import { formatDateTime, formatSom } from '@/lib/format'
import { formatPhone } from '@/lib/auth/phone'
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '@/lib/validation/admin'

export function OrdersList({ orders, filters }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function applyFilter(key, value) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/admin/buyurtmalar?${params.toString()}`)
  }

  const exportUrl = `/api/admin/buyurtmalar/eksport?${new URLSearchParams(
    Object.entries({
      status: filters.status,
      from: filters.from,
      to: filters.to,
    }).filter(([, v]) => v)
  ).toString()}`

  return (
    <>
      <PageHeader
        title="Buyurtmalar"
        description={`Jami ${orders.length} ta`}
        action={
          <a
            href={exportUrl}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted"
          >
            <Download className="size-4" aria-hidden="true" />
            Excel / CSV
          </a>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            defaultValue={filters.q ?? ''}
            placeholder="Telefon yoki raqam"
            aria-label="Buyurtma qidirish"
            className="pl-9"
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyFilter('q', e.currentTarget.value.trim())
            }}
          />
        </div>

        <Select
          value={filters.status ?? ''}
          aria-label="Status bo'yicha filtr"
          onChange={(e) => applyFilter('status', e.target.value)}
        >
          <option value="">Barcha statuslar</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>

        <Input
          type="date"
          value={filters.from ?? ''}
          aria-label="Sana: dan"
          onChange={(e) => applyFilter('from', e.target.value)}
        />
        <Input
          type="date"
          value={filters.to ?? ''}
          aria-label="Sana: gacha"
          onChange={(e) => applyFilter('to', e.target.value)}
        />
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Buyurtma yo'q"
          description={
            filters.q || filters.status || filters.from || filters.to
              ? "Filtrga mos buyurtma topilmadi."
              : 'Birinchi buyurtma kelganda shu yerda ko\'rinadi.'
          }
          action={
            filters.q || filters.status || filters.from || filters.to ? (
              <Link
                href="/admin/buyurtmalar"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Filtrni tozalash
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium text-muted-foreground">№</th>
                <th className="p-3 font-medium text-muted-foreground">Mijoz</th>
                <th className="p-3 font-medium text-muted-foreground">Telefon</th>
                <th className="p-3 font-medium text-muted-foreground">Summa</th>
                <th className="p-3 font-medium text-muted-foreground">Sana</th>
                <th className="p-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="p-3">
                    <Link
                      href={`/admin/buyurtmalar/${order.id}`}
                      className="font-semibold text-foreground underline-offset-4 hover:underline"
                    >
                      #{order.orderNumber}
                    </Link>
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/buyurtmalar/${order.id}`}
                      className="text-card-foreground underline-offset-4 hover:underline"
                    >
                      {order.customerName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {order.itemCount} ta mahsulot
                    </p>
                  </td>
                  <td className="p-3">
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Phone className="size-3.5" aria-hidden="true" />
                      {formatPhone(order.customerPhone)}
                    </a>
                  </td>
                  <td className="whitespace-nowrap p-3 font-medium text-card-foreground">
                    {formatSom(order.totalAmount)}
                  </td>
                  <td className="whitespace-nowrap p-3 text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </td>
                  <td className="p-3">
                    <div className="hidden lg:block">
                      <StatusSelect
                        orderId={order.id}
                        status={order.status}
                        compact
                      />
                    </div>
                    <div className="lg:hidden">
                      <StatusBadge status={order.status} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
