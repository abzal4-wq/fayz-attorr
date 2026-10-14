'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { ProductImages } from './product-images'
import { VariantRows } from './variant-rows'
import { Button, Field, Input, Select, Textarea, Toggle } from './ui'
import { Alert } from './display'
import { GENDER_LABELS } from '@/lib/format'

const GENDERS = ['WOMEN', 'MEN', 'UNISEX']

function initialState(product) {
  if (!product) {
    return {
      name: '',
      brandId: '',
      gender: 'WOMEN',
      shortDescription: '',
      description: '',
      isActive: true,
      isFeatured: false,
    }
  }
  return {
    name: product.name,
    brandId: product.brandId,
    gender: product.gender,
    shortDescription: product.shortDescription ?? '',
    description: product.description ?? '',
    isActive: product.isActive,
    isFeatured: product.isFeatured,
  }
}

export function ProductForm({ product, brands, sizes }) {
  const router = useRouter()
  const isEdit = Boolean(product)

  const [form, setForm] = useState(() => initialState(product))
  const [images, setImages] = useState(() => product?.images ?? [])
  const [variants, setVariants] = useState(() => product?.variants ?? [])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setPending(true)
    setErrors({})
    setFormError(null)

    const payload = {
      ...form,
      images: images.map((img) => ({ publicId: img.publicId })),
      variants: variants.map((v) => ({
        sizeId: v.sizeId,
        price: v.price,
        discountPercent: v.discountPercent || 0,
        stockQty: v.stockQty || 0,
        inStock: v.inStock,
        sku: v.sku || null,
      })),
    }

    const res = await fetch(
      isEdit ? `/api/admin/atirlar/${product.id}` : '/api/admin/atirlar',
      {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )
    const data = await res.json().catch(() => null)
    setPending(false)

    if (!res.ok) {
      setErrors(data?.fieldErrors ?? {})
      setFormError(data?.message ?? 'Saqlashda xatolik yuz berdi')
      return
    }

    router.push('/admin/atirlar')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="pb-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/atirlar"
            aria-label="Orqaga"
            className="flex size-11 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <h1 className="font-serif text-2xl text-foreground">
            {isEdit ? 'Atirni tahrirlash' : 'Yangi atir'}
          </h1>
        </div>

        <Button type="submit" variant="gold" pending={pending}>
          Saqlash
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
            <Field label="Nomi" htmlFor="name" error={errors.name}>
              <Input
                id="name"
                value={form.name}
                invalid={Boolean(errors.name)}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Masalan: Sauvage"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Brend" htmlFor="brandId" error={errors.brandId}>
                <Select
                  id="brandId"
                  value={form.brandId}
                  invalid={Boolean(errors.brandId)}
                  onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                >
                  <option value="">Tanlang</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Jins" htmlFor="gender" error={errors.gender}>
                <Select
                  id="gender"
                  value={form.gender}
                  invalid={Boolean(errors.gender)}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {GENDER_LABELS[g]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field
              label="Qisqa tavsif"
              htmlFor="shortDescription"
              error={errors.shortDescription}
              hint="Kartochka va mahsulot sahifasining yuqorisida ko'rinadi."
            >
              <Textarea
                id="shortDescription"
                rows={2}
                value={form.shortDescription}
                invalid={Boolean(errors.shortDescription)}
                onChange={(e) =>
                  setForm({ ...form, shortDescription: e.target.value })
                }
                placeholder="Bergamot va ambroksan asosidagi yangi, keskin hid."
              />
            </Field>

            <Field label="To'liq tavsif" htmlFor="description" error={errors.description}>
              <Textarea
                id="description"
                rows={6}
                value={form.description}
                invalid={Boolean(errors.description)}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
          </section>

          <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <ProductImages
              images={images}
              onChange={setImages}
              error={errors.images}
            />
          </section>

          <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <VariantRows
              variants={variants}
              sizes={sizes}
              onChange={setVariants}
              error={errors.variants}
            />
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <section className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-card-foreground">Faol</p>
                <p className="text-sm text-muted-foreground">
                  Nofaol atir saytda umuman ko'rinmaydi.
                </p>
              </div>
              <Toggle
                checked={form.isActive}
                onChange={(v) => setForm({ ...form, isActive: v })}
                label="Atir faolligi"
              />
            </div>

            <div className="flex items-start justify-between gap-4 border-t border-border pt-4">
              <div>
                <p className="text-sm font-medium text-card-foreground">Tanlangan</p>
                <p className="text-sm text-muted-foreground">
                  Bosh sahifadagi sliderda chiqadi.
                </p>
              </div>
              <Toggle
                checked={form.isFeatured}
                onChange={(v) => setForm({ ...form, isFeatured: v })}
                label="Tanlangan atir"
              />
            </div>
          </section>

          <Alert>{formError}</Alert>

          <Button type="submit" variant="gold" pending={pending} className="w-full">
            Saqlash
          </Button>
        </aside>
      </div>
    </form>
  )
}
