'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { cartTotal, useCart } from '@/lib/cart-store'
import { useHydrated } from '@/lib/use-hydrated'
import { formatSom } from '@/lib/format'

export function CartPage({ deliveryPrice, deliveryInfo }) {
  const items = useCart((state) => state.items)
  const setQuantity = useCart((state) => state.setQuantity)
  const removeItem = useCart((state) => state.removeItem)
  const hydrated = useHydrated()

  // Savat localStorage'dan o'qilguncha skeleton — hydration mismatch bo'lmasin
  if (!hydrated) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-16 text-center">
        <ShoppingBag className="size-10 text-muted-deep" aria-hidden="true" />
        <p className="mt-4 font-serif text-xl text-foreground">Savat bo'sh</p>
        <p className="mt-2 max-w-sm text-sm text-muted-deep">
          Yoqqan atirni savatga qo'shing — sahifani yangilasangiz ham
          yo'qolmaydi.
        </p>
        <Link
          href="/katalog"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light"
        >
          Katalogga o'tish
        </Link>
      </div>
    )
  }

  const subtotal = cartTotal(items)

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <ul className="space-y-3 lg:col-span-2">
        {items.map((item) => (
          <li
            key={item.variantId}
            className="flex gap-3 rounded-xl border border-border bg-card p-3 sm:p-4"
          >
            <Link
              href={`/atir/${item.slug}`}
              className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-24"
            >
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt=""
                  width={96}
                  height={96}
                  className="size-full object-cover"
                />
              ) : null}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <p className="text-xs text-muted-deep">{item.brandName}</p>
              <Link
                href={`/atir/${item.slug}`}
                className="line-clamp-2 font-serif text-lg text-card-foreground underline-offset-4 hover:underline"
              >
                {item.name}
              </Link>
              <p className="text-sm text-muted-deep">{item.sizeLabel}</p>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                <div className="flex items-center rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                    aria-label="Kamaytirish"
                    className="flex size-11 items-center justify-center text-foreground"
                  >
                    <Minus className="size-4" aria-hidden="true" />
                  </button>
                  <span className="w-10 text-center font-medium text-foreground">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                    aria-label="Ko'paytirish"
                    className="flex size-11 items-center justify-center text-foreground"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <p className="font-bold text-gold-deep">
                  {formatSom(item.unitPrice * item.quantity)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeItem(item.variantId)}
              aria-label={`${item.name} ni savatdan o'chirish`}
              className="flex size-11 shrink-0 items-center justify-center self-start rounded-lg text-muted-deep transition-colors hover:bg-destructive/10 hover:text-danger-deep"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h2 className="font-serif text-xl text-card-foreground">Buyurtma</h2>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-deep">Mahsulotlar</dt>
              <dd className="text-card-foreground">{formatSom(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-deep">Yetkazib berish</dt>
              <dd className="text-card-foreground">
                {deliveryPrice > 0 ? formatSom(deliveryPrice) : 'Bepul'}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="font-medium text-card-foreground">Jami</span>
            <span className="text-xl font-bold text-gold-deep">
              {formatSom(subtotal + deliveryPrice)}
            </span>
          </div>

          <p className="mt-2 text-xs text-muted-deep">
            Yakuniy summa buyurtma berishda server tomonidan tasdiqlanadi.
          </p>

          <Link
            href="/buyurtma"
            className="mt-5 flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light"
          >
            Buyurtma berish
          </Link>

          {deliveryInfo ? (
            <p className="mt-4 text-sm text-muted-deep">{deliveryInfo}</p>
          ) : null}
        </div>
      </aside>
    </div>
  )
}
