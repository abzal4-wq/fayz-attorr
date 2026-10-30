'use client'

import Link from 'next/link'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { CartSyncNotice } from '@/components/site/cart-sync-notice'
import { CartThumb } from '@/components/site/cart-thumb'
import { cartTotal, hasUnavailable, useCart } from '@/lib/cart-store'
import { useCartSync } from '@/lib/use-cart-sync'
import { useHydrated } from '@/lib/use-hydrated'
import { cn } from '@/lib/utils'
import { useMoney, useT } from '@/lib/i18n/client'

export function CartPage({ deliveryPrice, deliveryInfo }) {
  const t = useT()
  const money = useMoney()
  const items = useCart((state) => state.items)
  const setQuantity = useCart((state) => state.setQuantity)
  const removeItem = useCart((state) => state.removeItem)
  const hydrated = useHydrated()
  // Rasm, narx va mavjudlik serverdan yangilanadi (lib/use-cart-sync.js)
  const changes = useCartSync(hydrated)

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
        <p className="mt-4 font-serif text-xl text-foreground">
          {t('cart.empty')}
        </p>
        <p className="mt-2 max-w-sm text-sm text-muted-deep">
          {t('cart.emptyHintPage')}
        </p>
        <Link
          href="/katalog"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light"
        >
          {t('common.goToCatalog')}
        </Link>
      </div>
    )
  }

  const subtotal = cartTotal(items)
  const blocked = hasUnavailable(items)

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
      <CartSyncNotice changes={changes} />
      <ul className={cn('space-y-3', changes ? 'mt-3' : '')}>
        {items.map((item) => (
          <li
            key={item.variantId}
            className={cn(
              'flex gap-3 rounded-xl border bg-card p-3 sm:p-4',
              item.available === false ? 'border-destructive/50' : 'border-border'
            )}
          >
            <Link
              href={`/atir/${item.slug}`}
              className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted sm:size-24"
            >
              <CartThumb
                src={item.imageUrl}
                // 96px joy, DPR 2 uchun
                size={192}
                className="size-full object-cover"
                iconClassName="size-6 text-muted-deep"
              />
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
              {item.available === false ? (
                <p className="mt-1 text-sm font-medium text-danger-deep">
                  {t('cart.unavailable')}
                </p>
              ) : null}

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                <div className="flex items-center rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                    aria-label={t('common.decrease')}
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
                    // Qoldiqdan oshirib bo'lmaydi — avval cheksiz edi va
                    // server buni faqat checkout'da rad etardi
                    disabled={
                      item.available === false ||
                      (typeof item.stockQty === 'number' && item.quantity >= item.stockQty)
                    }
                    aria-label={t('common.increase')}
                    className="flex size-11 items-center justify-center text-foreground disabled:opacity-40"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <p className="font-bold text-gold-deep">
                  {money(item.unitPrice * item.quantity)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeItem(item.variantId)}
              aria-label={t('cart.remove', { name: item.name })}
              className="flex size-11 shrink-0 items-center justify-center self-start rounded-lg text-muted-deep transition-colors hover:bg-destructive/10 hover:text-danger-deep"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      </div>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h2 className="font-serif text-xl text-card-foreground">
            {t('cart.summary')}
          </h2>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-deep">{t('common.products')}</dt>
              <dd className="text-card-foreground">{money(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-deep">{t('common.delivery')}</dt>
              <dd className="text-card-foreground">
                {deliveryPrice > 0 ? money(deliveryPrice) : t('common.free')}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="font-medium text-card-foreground">
              {t('common.total')}
            </span>
            <span className="text-xl font-bold text-gold-deep">
              {money(subtotal + deliveryPrice)}
            </span>
          </div>

          <p className="mt-2 text-xs text-muted-deep">{t('cart.notePage')}</p>

          {/*
            Sotuvda yo'q mahsulot bilan buyurtma berib bo'lmaydi — server
            uni baribir rad etadi. Oldindan aytib qo'yamiz.
          */}
          {blocked ? (
            <p role="alert" className="mt-5 text-sm text-danger-deep">
              {t('cart.removeUnavailable')}
            </p>
          ) : (
            <Link
              href="/buyurtma"
              className="mt-5 flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light"
            >
              {t('cart.checkout')}
            </Link>
          )}

          {deliveryInfo ? (
            <p className="mt-4 text-sm text-muted-deep">{deliveryInfo}</p>
          ) : null}
        </div>
      </aside>
    </div>
  )
}
