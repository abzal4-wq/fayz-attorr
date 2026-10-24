'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/cart-store'
import { useMoney, useT } from '@/lib/i18n/client'
import { cn } from '@/lib/utils'

/**
 * Hajm tanlash + narx + savatga qo'shish.
 *
 * Hajm almashganda narx darhol o'zgaradi. Tugagan hajmni tanlab bo'lmaydi.
 */
export function ProductPurchase({ product }) {
  const t = useT()
  const money = useMoney()
  const addItem = useCart((state) => state.addItem)

  // Boshlang'ich tanlov: birinchi mavjud hajm, hammasi tugagan bo'lsa birinchisi
  const [selectedId, setSelectedId] = useState(
    () => (product.variants.find((v) => v.available) ?? product.variants[0])?.id
  )
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const selected = product.variants.find((v) => v.id === selectedId)
  const allOutOfStock = product.variants.every((v) => !v.available)

  const maxQuantity = Math.max(1, Math.min(selected?.stockQty ?? 1, 20))

  function handleAdd() {
    if (!selected?.available) return

    addItem(
      {
        variantId: selected.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        brandName: product.brandName,
        sizeLabel: selected.sizeLabel,
        unitPrice: selected.finalPrice,
        imageUrl: product.images[0]?.url ?? null,
      },
      quantity
    )

    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <div>
      {/* Hajm tanlash */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-foreground">
          {t('product.size')}
        </legend>
        <div className="flex flex-wrap gap-2">
          {product.variants.map((variant) => {
            const active = variant.id === selectedId
            return (
              <button
                key={variant.id}
                type="button"
                disabled={!variant.available}
                aria-pressed={active}
                onClick={() => {
                  setSelectedId(variant.id)
                  setQuantity(1)
                }}
                className={cn(
                  'min-h-12 rounded-lg border px-4 text-sm font-medium transition-colors duration-200',
                  active
                    ? 'border-brand-deep bg-secondary text-secondary-foreground'
                    : 'border-border text-foreground hover:border-brand-mid',
                  !variant.available &&
                    'cursor-not-allowed text-muted-deep line-through opacity-60 hover:border-border'
                )}
              >
                {variant.sizeLabel}
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Narx */}
      {selected ? (
        <div className="mt-6">
          {selected.discountPercent > 0 ? (
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-2xl font-bold text-gold-deep">
                {money(selected.finalPrice)}
              </span>
              <span className="text-muted-deep line-through">
                {money(selected.price)}
              </span>
              <span className="rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-white">
                −{selected.discountPercent}%
              </span>
            </div>
          ) : (
            <span className="text-2xl font-bold text-gold-deep">
              {money(selected.finalPrice)}
            </span>
          )}

          <p className="mt-2 text-sm">
            {selected.available ? (
              <span className="text-success-deep">{t('product.available')}</span>
            ) : (
              <span className="text-danger-deep">
                {t('product.sizeOutOfStock')}
              </span>
            )}
          </p>
        </div>
      ) : null}

      {/* Miqdor va savatga qo'shish */}
      {allOutOfStock ? (
        <p className="mt-6 rounded-lg border border-border bg-muted p-4 text-sm text-muted-deep">
          {t('product.allOutOfStock')}
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="flex items-center rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label={t('common.decrease')}
              className="flex size-12 items-center justify-center text-foreground disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <span
              aria-live="polite"
              className="w-12 text-center font-semibold text-foreground"
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              disabled={quantity >= maxQuantity}
              aria-label={t('common.increase')}
              className="flex size-12 items-center justify-center text-foreground disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!selected?.available}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {added ? (
              <>
                <Check className="size-5" aria-hidden="true" />
                {t('product.added')}
              </>
            ) : (
              <>
                <ShoppingBag className="size-5" aria-hidden="true" />
                {t('product.addToCart')}
              </>
            )}
          </button>
        </div>
      )}

      {added ? (
        <Link
          href="/savat"
          className="mt-3 inline-block text-sm text-brand-mid underline-offset-4 hover:underline"
        >
          {t('product.goToCart')}
        </Link>
      ) : null}
    </div>
  )
}
