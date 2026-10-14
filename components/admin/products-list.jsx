'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Package, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { ConfirmModal } from './modal'
import { Button, Input, Select, Toggle } from './ui'
import { Badge, EmptyState, PageHeader } from './display'
import { GENDER_LABELS, formatSom } from '@/lib/format'

export function ProductsList({ products, brands, filters }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selected, setSelected] = useState(new Set())
  const [deleting, setDeleting] = useState(null)
  const [pending, setPending] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  function applyFilter(key, value) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/admin/atirlar?${params.toString()}`)
  }

  function toggleSelect(id) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function toggleSelectAll() {
    if (selected.size === products.length) setSelected(new Set())
    else setSelected(new Set(products.map((p) => p.id)))
  }

  async function bulkSetActive(isActive) {
    setPending(true)
    await fetch('/api/admin/atirlar/ommaviy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [...selected], isActive }),
    })
    setPending(false)
    setSelected(new Set())
    router.refresh()
  }

  async function toggleActive(product) {
    await fetch(`/api/admin/atirlar/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !product.isActive }),
    })
    router.refresh()
  }

  async function handleDelete() {
    setPending(true)
    setDeleteError(null)
    const res = await fetch(`/api/admin/atirlar/${deleting.id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => null)
    setPending(false)

    if (!res.ok) {
      setDeleteError(data?.message ?? "O'chirishda xatolik yuz berdi")
      return
    }
    setDeleting(null)
    router.refresh()
  }

  return (
    <>
      <PageHeader
        title="Atirlar"
        description={`Jami ${products.length} ta`}
        action={
          <Link
            href="/admin/atirlar/yangi"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-gold-light"
          >
            <Plus className="size-4" aria-hidden="true" />
            Yangi atir
          </Link>
        }
      />

      {/* Filtrlar */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            defaultValue={filters.q ?? ''}
            placeholder="Nom bo'yicha qidirish"
            aria-label="Atir qidirish"
            className="pl-9"
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyFilter('q', e.currentTarget.value.trim())
            }}
          />
        </div>

        <Select
          value={filters.brand ?? ''}
          aria-label="Brend bo'yicha filtr"
          onChange={(e) => applyFilter('brand', e.target.value)}
        >
          <option value="">Barcha brendlar</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>

        <Select
          value={filters.gender ?? ''}
          aria-label="Jins bo'yicha filtr"
          onChange={(e) => applyFilter('gender', e.target.value)}
        >
          <option value="">Barcha jinslar</option>
          {Object.entries(GENDER_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      {/* Ommaviy amallar */}
      {selected.size > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
          <span className="text-sm font-medium text-foreground">
            {selected.size} ta tanlandi
          </span>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              pending={pending}
              onClick={() => bulkSetActive(true)}
            >
              Faol qilish
            </Button>
            <Button
              variant="outline"
              pending={pending}
              onClick={() => bulkSetActive(false)}
            >
              Nofaol qilish
            </Button>
          </div>
        </div>
      ) : null}

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Atir topilmadi"
          description={
            filters.q || filters.brand || filters.gender
              ? "Filtrga mos atir yo'q. Shartlarni o'zgartirib ko'ring."
              : "Birinchi atirni qo'shing."
          }
          action={
            filters.q || filters.brand || filters.gender ? (
              <Link
                href="/admin/atirlar"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Filtrni tozalash
              </Link>
            ) : (
              <Link
                href="/admin/atirlar/yangi"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-gold-light"
              >
                <Plus className="size-4" aria-hidden="true" />
                Yangi atir
              </Link>
            )
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border bg-muted/50 text-left">
              <tr>
                <th className="p-3">
                  <input
                    type="checkbox"
                    aria-label="Hammasini tanlash"
                    checked={selected.size === products.length && products.length > 0}
                    onChange={toggleSelectAll}
                    className="size-4 cursor-pointer"
                  />
                </th>
                <th className="p-3 font-medium text-muted-foreground">Atir</th>
                <th className="p-3 font-medium text-muted-foreground">Brend</th>
                <th className="p-3 font-medium text-muted-foreground">Jins</th>
                <th className="p-3 font-medium text-muted-foreground">Narx</th>
                <th className="p-3 font-medium text-muted-foreground">Holat</th>
                <th className="p-3 text-right font-medium text-muted-foreground">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      aria-label={`${product.name} ni tanlash`}
                      checked={selected.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="size-4 cursor-pointer"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt=""
                            width={40}
                            height={40}
                            className="size-10 object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-card-foreground">
                          {product.name}
                        </p>
                        {product.isFeatured ? (
                          <Badge tone="gold">Tanlangan</Badge>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{product.brandName}</td>
                  <td className="p-3 text-muted-foreground">
                    {GENDER_LABELS[product.gender]}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {product.priceRange ? (
                      <span className="whitespace-nowrap">{product.priceRange}</span>
                    ) : (
                      <span className="text-danger-deep">Narx yo'q</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Toggle
                        checked={product.isActive}
                        onChange={() => toggleActive(product)}
                        label={`${product.name} holatini o'zgartirish`}
                      />
                      {product.allOutOfStock ? (
                        <Badge tone="danger">Tugagan</Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/admin/atirlar/${product.id}`}
                        aria-label={`${product.name} — tahrirlash`}
                        className="flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null)
                          setDeleting(product)
                        }}
                        aria-label={`${product.name} — o'chirish`}
                        className="flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-danger-deep"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        pending={pending}
        title="Atirni o'chirish"
        message={
          deleteError ??
          `"${deleting?.name}" o'chiriladi: rasmlari va narx variantlari ham ketadi. Oldingi buyurtmalar tarixi saqlanadi. Vaqtincha yashirish uchun uni nofaol qiling.`
        }
      />
    </>
  )
}
