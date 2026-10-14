'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { cartCount, cartTotal, useCart } from '@/lib/cart-store'
import { useHydrated } from '@/lib/use-hydrated'
import { formatSom } from '@/lib/format'

/** Header'dagi savat tugmasi — soni bilan. Bosilganda drawer ochiladi. */
export function CartButton() {
  const [open, setOpen] = useState(false)
  const items = useCart((state) => state.items)
  const hydrated = useHydrated()
  const count = hydrated ? cartCount(items) : 0

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={count > 0 ? `Savat, ${count} ta mahsulot` : 'Savat'}
        className="relative flex size-11 items-center justify-center rounded-lg text-muted-on-dark transition-colors duration-200 hover:text-ivory"
      >
        <ShoppingBag className="size-5" aria-hidden="true" />
        {count > 0 ? (
          <span className="absolute right-1 top-1 flex min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-brand-darker">
            {count}
          </span>
        ) : null}
      </button>

      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function CartDrawer({ open, onClose }) {
  const items = useCart((state) => state.items)
  const setQuantity = useCart((state) => state.setQuantity)
  const removeItem = useCart((state) => state.removeItem)

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const total = cartTotal(items)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Savat"
      className="dark fixed inset-0 z-50 flex justify-end"
    >
      <button
        type="button"
        aria-label="Yopish"
        onClick={onClose}
        className="absolute inset-0 bg-brand-darker/50"
      />

      {/* Mobilda to'liq ekran, desktopda yon panel */}
      <div className="glass relative flex h-full w-full flex-col bg-brand-deep sm:max-w-md">
        <div className="flex items-center justify-between gap-4 border-b border-border p-4">
          <h2 className="font-serif text-xl text-ivory">Savat</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="flex size-11 items-center justify-center rounded-lg text-muted-on-dark transition-colors hover:text-ivory"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <ShoppingBag className="size-10 text-muted-on-dark" aria-hidden="true" />
            <p className="mt-4 font-serif text-xl text-ivory">Savat bo'sh</p>
            <p className="mt-2 text-sm text-muted-on-dark">
              Yoqqan atirni savatga qo'shing — u shu yerda turadi.
            </p>
            <Link
              href="/katalog"
              onClick={onClose}
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light"
            >
              Katalogga o'tish
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border overflow-y-auto">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-3 p-4">
                  <Link
                    href={`/atir/${item.slug}`}
                    onClick={onClose}
                    className="size-16 shrink-0 overflow-hidden rounded-lg bg-brand-darker"
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt=""
                        width={64}
                        height={64}
                        className="size-16 object-cover"
                      />
                    ) : null}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-on-dark">{item.brandName}</p>
                    <Link
                      href={`/atir/${item.slug}`}
                      onClick={onClose}
                      className="line-clamp-1 font-medium text-ivory underline-offset-4 hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-muted-on-dark">{item.sizeLabel}</p>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center rounded-lg border border-border">
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(item.variantId, item.quantity - 1)
                          }
                          aria-label="Kamaytirish"
                          className="flex size-9 items-center justify-center text-ivory"
                        >
                          <Minus className="size-3.5" aria-hidden="true" />
                        </button>
                        <span className="w-8 text-center text-sm text-ivory">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(item.variantId, item.quantity + 1)
                          }
                          aria-label="Ko'paytirish"
                          className="flex size-9 items-center justify-center text-ivory"
                        >
                          <Plus className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.variantId)}
                        aria-label={`${item.name} ni savatdan o'chirish`}
                        className="flex size-9 items-center justify-center rounded-lg text-muted-on-dark transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <p className="whitespace-nowrap font-semibold text-gold">
                    {formatSom(item.unitPrice * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="border-t border-border p-4 pb-safe">
              <div className="flex items-center justify-between">
                <span className="text-muted-on-dark">Jami</span>
                <span className="text-xl font-bold text-gold">
                  {formatSom(total)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-on-dark">
                Yakuniy summa buyurtma berishda tasdiqlanadi.
              </p>

              <Link
                href="/buyurtma"
                onClick={onClose}
                className="mt-4 flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light"
              >
                Buyurtma berish
              </Link>
              <Link
                href="/savat"
                onClick={onClose}
                className="mt-2 flex min-h-11 items-center justify-center text-sm text-muted-on-dark underline-offset-4 hover:text-ivory hover:underline"
              >
                Savatni to'liq ko'rish
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
