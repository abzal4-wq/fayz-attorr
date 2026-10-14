'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '@/lib/validation/admin'
import { Select } from './ui'
import { cn } from '@/lib/utils'

/** Status -> rang. Yangi buyurtma ko'zga tashlanib tursin. */
export const STATUS_TONE = {
  NEW: 'bg-primary/20 text-gold-deep',
  CONFIRMED: 'bg-accent text-accent-foreground',
  PACKING: 'bg-muted text-muted-foreground',
  DELIVERING: 'bg-muted text-muted-foreground',
  COMPLETED: 'bg-success-deep/10 text-success-deep',
  CANCELLED: 'bg-destructive/10 text-danger-deep',
}

export function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium',
        STATUS_TONE[status] ?? 'bg-muted text-muted-foreground'
      )}
    >
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  )
}

/** Ro'yxat va detal sahifasida statusni tez o'zgartirish. */
export function StatusSelect({ orderId, status, compact = false }) {
  const router = useRouter()
  const [value, setValue] = useState(status)
  const [pending, setPending] = useState(false)

  async function change(next) {
    const previous = value
    setValue(next)
    setPending(true)

    const res = await fetch(`/api/admin/buyurtmalar/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })

    setPending(false)

    if (!res.ok) {
      setValue(previous) // o'zgarmadi — eski holatga qaytaramiz
      return
    }

    router.refresh()
  }

  return (
    <Select
      value={value}
      disabled={pending}
      aria-label="Buyurtma statusi"
      onChange={(e) => change(e.target.value)}
      className={cn(compact && 'min-h-10 w-auto text-sm')}
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {ORDER_STATUS_LABELS[s]}
        </option>
      ))}
    </Select>
  )
}
