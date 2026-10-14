'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button, Input, Select, Toggle } from './ui'
import { formatSom, priceAfterDiscount } from '@/lib/format'

const emptyVariant = {
  sizeId: '',
  price: '',
  discountPercent: 0,
  stockQty: 0,
  inStock: true,
  sku: '',
}

/**
 * Hajm variantlari — formaning eng muhim qismi.
 * Bir atirga bir nechta hajm, har biriga ALOHIDA narx va chegirma.
 */
export function VariantRows({ variants, sizes, onChange, error }) {
  const usedSizeIds = new Set(variants.map((v) => v.sizeId).filter(Boolean))

  // Nofaol hajmlar yangi variantga taklif qilinmaydi, lekin
  // allaqachon ishlatilganlari ro'yxatda qoladi (narx yo'qolmasin).
  const available = sizes.filter((s) => s.isActive || usedSizeIds.has(s.id))

  function update(index, patch) {
    onChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)))
  }

  function add() {
    const firstFree = available.find((s) => !usedSizeIds.has(s.id))
    onChange([...variants, { ...emptyVariant, sizeId: firstFree?.id ?? '' }])
  }

  function remove(index) {
    onChange(variants.filter((_, i) => i !== index))
  }

  const allSizesUsed = available.every((s) => usedSizeIds.has(s.id))

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground">Hajm variantlari</span>
        <span className="text-sm text-muted-foreground">
          Har bir hajmga alohida narx
        </span>
      </div>

      <div className="space-y-3">
        {variants.map((variant, index) => {
          const final = priceAfterDiscount(variant.price, variant.discountPercent)
          const hasDiscount = Number(variant.discountPercent) > 0

          return (
            <div
              key={index}
              className="rounded-lg border border-border bg-card p-3"
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto_auto]">
                <div>
                  <label
                    htmlFor={`variant-size-${index}`}
                    className="mb-1 block text-xs text-muted-foreground"
                  >
                    Hajm
                  </label>
                  <Select
                    id={`variant-size-${index}`}
                    value={variant.sizeId}
                    onChange={(e) => update(index, { sizeId: e.target.value })}
                  >
                    <option value="">Tanlang</option>
                    {available.map((size) => (
                      <option
                        key={size.id}
                        value={size.id}
                        disabled={usedSizeIds.has(size.id) && size.id !== variant.sizeId}
                      >
                        {size.label}
                        {size.isActive ? '' : ' (nofaol)'}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label
                    htmlFor={`variant-price-${index}`}
                    className="mb-1 block text-xs text-muted-foreground"
                  >
                    Narx (so'm)
                  </label>
                  <Input
                    id={`variant-price-${index}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={variant.price}
                    onChange={(e) => update(index, { price: e.target.value })}
                    placeholder="450000"
                  />
                </div>

                <div className="lg:w-24">
                  <label
                    htmlFor={`variant-discount-${index}`}
                    className="mb-1 block text-xs text-muted-foreground"
                  >
                    Chegirma %
                  </label>
                  <Input
                    id={`variant-discount-${index}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    value={variant.discountPercent}
                    onChange={(e) =>
                      update(index, { discountPercent: e.target.value })
                    }
                  />
                </div>

                <div className="lg:w-24">
                  <label
                    htmlFor={`variant-stock-${index}`}
                    className="mb-1 block text-xs text-muted-foreground"
                  >
                    Qoldiq
                  </label>
                  <Input
                    id={`variant-stock-${index}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={variant.stockQty}
                    onChange={(e) => update(index, { stockQty: e.target.value })}
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={`${index + 1}-variantni o'chirish`}
                    className="flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-danger-deep"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <div className="flex items-center gap-2">
                  <Toggle
                    checked={variant.inStock}
                    onChange={(v) => update(index, { inStock: v })}
                    label="Mavjudlik"
                  />
                  <span className="text-sm text-muted-foreground">
                    {variant.inStock ? 'Mavjud' : 'Tugagan'}
                  </span>
                </div>

                {variant.price ? (
                  <p className="text-sm">
                    {hasDiscount ? (
                      <>
                        <span className="text-muted-foreground line-through">
                          {formatSom(variant.price)}
                        </span>{' '}
                        <span className="font-semibold text-gold-deep">
                          {formatSom(final)}
                        </span>
                      </>
                    ) : (
                      <span className="font-semibold text-gold-deep">
                        {formatSom(variant.price)}
                      </span>
                    )}
                  </p>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3">
        <Button
          type="button"
          variant="outline"
          onClick={add}
          disabled={allSizesUsed}
        >
          <Plus className="size-4" aria-hidden="true" />
          Hajm qo'shish
        </Button>
        {allSizesUsed ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Barcha mavjud hajmlar qo'shilgan. Yangi hajmni «Hajmlar»
            bo'limidan qo'shing.
          </p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger-deep">
          {error}
        </p>
      ) : null}
    </div>
  )
}
