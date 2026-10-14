'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { ConfirmModal, Modal } from './modal'
import { ImageField } from './image-field'
import { Alert, Badge, Button, EmptyState, Field, Input, PageHeader, Toggle } from './ui'

const emptyForm = { name: '', sortOrder: 0, isActive: true }

export function BrandsManager({ brands }) {
  const router = useRouter()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [logoPublicId, setLogoPublicId] = useState(null)
  const [removeLogo, setRemoveLogo] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [pending, setPending] = useState(false)

  const [deleting, setDeleting] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setLogoPublicId(null)
    setRemoveLogo(false)
    setErrors({})
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(brand) {
    setEditing(brand)
    setForm({
      name: brand.name,
      sortOrder: brand.sortOrder,
      isActive: brand.isActive,
    })
    setLogoPublicId(null)
    setRemoveLogo(false)
    setErrors({})
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setPending(true)
    setErrors({})
    setFormError(null)

    const payload = { ...form }
    if (logoPublicId) payload.logoPublicId = logoPublicId
    if (removeLogo) payload.removeLogo = true

    const res = await fetch(
      editing ? `/api/admin/brendlar/${editing.id}` : '/api/admin/brendlar',
      {
        method: editing ? 'PATCH' : 'POST',
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

    setFormOpen(false)
    router.refresh()
  }

  async function toggleActive(brand) {
    await fetch(`/api/admin/brendlar/${brand.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !brand.isActive }),
    })
    router.refresh()
  }

  async function handleDelete() {
    setPending(true)
    setDeleteError(null)

    const res = await fetch(`/api/admin/brendlar/${deleting.id}`, {
      method: 'DELETE',
    })
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
        title="Brendlar"
        description="Atirlar shu brendlardan biriga biriktiriladi."
        action={
          <Button variant="gold" onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Yangi brend
          </Button>
        }
      />

      {brands.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Hali brend qo'shilmagan"
          description="Atir qo'shishdan oldin kamida bitta brend kerak."
          action={
            <Button variant="gold" onClick={openCreate}>
              <Plus className="size-4" aria-hidden="true" />
              Birinchi brendni qo'shish
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium text-muted-foreground">Brend</th>
                <th className="hidden p-3 font-medium text-muted-foreground sm:table-cell">
                  Atirlar
                </th>
                <th className="hidden p-3 font-medium text-muted-foreground md:table-cell">
                  Tartib
                </th>
                <th className="p-3 font-medium text-muted-foreground">Holat</th>
                <th className="p-3 text-right font-medium text-muted-foreground">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {brands.map((brand) => (
                <tr key={brand.id}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                        {brand.logoUrl ? (
                          <Image
                            src={brand.logoUrl}
                            alt=""
                            width={40}
                            height={40}
                            className="size-10 object-contain"
                          />
                        ) : (
                          <Tags
                            className="size-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-card-foreground">
                          {brand.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground sm:hidden">
                          {brand.productCount} ta atir
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden p-3 text-muted-foreground sm:table-cell">
                    {brand.productCount}
                  </td>
                  <td className="hidden p-3 text-muted-foreground md:table-cell">
                    {brand.sortOrder}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Toggle
                        checked={brand.isActive}
                        onChange={() => toggleActive(brand)}
                        label={`${brand.name} holatini o'zgartirish`}
                      />
                      <span className="hidden lg:inline">
                        <Badge tone={brand.isActive ? 'success' : 'neutral'}>
                          {brand.isActive ? 'Faol' : 'Nofaol'}
                        </Badge>
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(brand)}
                        aria-label={`${brand.name} — tahrirlash`}
                        className="flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null)
                          setDeleting(brand)
                        }}
                        aria-label={`${brand.name} — o'chirish`}
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

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Brendni tahrirlash' : 'Yangi brend'}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="Nomi" htmlFor="brand-name" error={errors.name}>
            <Input
              id="brand-name"
              value={form.name}
              invalid={Boolean(errors.name)}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Masalan: Dior"
            />
          </Field>

          <ImageField
            subfolder="brendlar"
            currentUrl={editing?.logoUrl}
            onUploaded={(publicId) => {
              setLogoPublicId(publicId)
              setRemoveLogo(false)
            }}
            onRemoved={() => {
              setLogoPublicId(null)
              setRemoveLogo(true)
            }}
          />

          <Field
            label="Tartib raqami"
            htmlFor="brand-order"
            error={errors.sortOrder}
            hint="Kichik raqam oldinroq ko'rinadi."
          >
            <Input
              id="brand-order"
              type="number"
              inputMode="numeric"
              min={0}
              value={form.sortOrder}
              invalid={Boolean(errors.sortOrder)}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
          </Field>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium text-card-foreground">Faol</p>
              <p className="text-sm text-muted-foreground">
                Nofaol brend saytda ko'rinmaydi.
              </p>
            </div>
            <Toggle
              checked={form.isActive}
              onChange={(v) => setForm({ ...form, isActive: v })}
              label="Brend faolligi"
            />
          </div>

          <Alert>{formError}</Alert>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" variant="gold" pending={pending}>
              Saqlash
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        pending={pending}
        title="Brendni o'chirish"
        message={
          deleteError ??
          `"${deleting?.name}" brendi o'chiriladi. Bu amalni qaytarib bo'lmaydi.`
        }
      />
    </>
  )
}
