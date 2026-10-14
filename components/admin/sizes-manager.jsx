'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Pencil, Plus, Ruler, Trash2 } from 'lucide-react'
import { ConfirmModal, Modal } from './modal'
import { Button, Field, Input, Toggle } from './ui'
import { Alert, Badge, EmptyState, PageHeader } from './display'

const emptyForm = { valueMl: '', label: '', sortOrder: '', isActive: true }

export function SizesManager({ sizes }) {
  const router = useRouter()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [pending, setPending] = useState(false)

  const [deleting, setDeleting] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(size) {
    setEditing(size)
    setForm({
      valueMl: size.valueMl,
      label: size.label,
      sortOrder: size.sortOrder,
      isActive: size.isActive,
    })
    setErrors({})
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setPending(true)
    setErrors({})
    setFormError(null)

    const payload = {
      valueMl: form.valueMl,
      isActive: form.isActive,
    }
    if (String(form.label).trim()) payload.label = form.label
    if (String(form.sortOrder).trim() !== '') payload.sortOrder = form.sortOrder

    const res = await fetch(
      editing ? `/api/admin/hajmlar/${editing.id}` : '/api/admin/hajmlar',
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

  async function toggleActive(size) {
    await fetch(`/api/admin/hajmlar/${size.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !size.isActive }),
    })
    router.refresh()
  }

  async function handleDelete() {
    setPending(true)
    setDeleteError(null)

    const res = await fetch(`/api/admin/hajmlar/${deleting.id}`, { method: 'DELETE' })
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
        title="Hajmlar"
        description="Atir qo'shishda hajm shu ro'yxatdan tanlanadi. Narx har bir hajmga alohida qo'yiladi."
        action={
          <Button variant="gold" onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Yangi hajm
          </Button>
        }
      />

      {sizes.length === 0 ? (
        <EmptyState
          icon={Ruler}
          title="Hajmlar ro'yxati bo'sh"
          description="Masalan 10, 30, 50, 100 ml qo'shing."
          action={
            <Button variant="gold" onClick={openCreate}>
              <Plus className="size-4" aria-hidden="true" />
              Birinchi hajmni qo'shish
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium text-muted-foreground">Hajm</th>
                <th className="hidden p-3 font-medium text-muted-foreground sm:table-cell">
                  Ishlatilgan
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
              {sizes.map((size) => (
                <tr key={size.id}>
                  <td className="p-3">
                    <p className="font-medium text-card-foreground">{size.label}</p>
                    <p className="text-xs text-muted-foreground sm:hidden">
                      {size.variantCount} ta atirda
                    </p>
                  </td>
                  <td className="hidden p-3 text-muted-foreground sm:table-cell">
                    {size.variantCount} ta atirda
                  </td>
                  <td className="hidden p-3 text-muted-foreground md:table-cell">
                    {size.sortOrder}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Toggle
                        checked={size.isActive}
                        onChange={() => toggleActive(size)}
                        label={`${size.label} holatini o'zgartirish`}
                      />
                      <span className="hidden lg:inline">
                        <Badge tone={size.isActive ? 'success' : 'neutral'}>
                          {size.isActive ? 'Faol' : 'Nofaol'}
                        </Badge>
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(size)}
                        aria-label={`${size.label} — tahrirlash`}
                        className="flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null)
                          setDeleting(size)
                        }}
                        aria-label={`${size.label} — o'chirish`}
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
        title={editing ? 'Hajmni tahrirlash' : 'Yangi hajm'}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="Hajm (ml)" htmlFor="size-ml" error={errors.valueMl}>
            <Input
              id="size-ml"
              type="number"
              inputMode="numeric"
              min={1}
              value={form.valueMl}
              invalid={Boolean(errors.valueMl)}
              onChange={(e) => setForm({ ...form, valueMl: e.target.value })}
              placeholder="50"
            />
          </Field>

          <Field
            label="Yorliq"
            htmlFor="size-label"
            error={errors.label}
            hint="Bo'sh qoldirsangiz avtomatik yasaladi: «50 ml»."
          >
            <Input
              id="size-label"
              value={form.label}
              invalid={Boolean(errors.label)}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="50 ml"
            />
          </Field>

          <Field
            label="Tartib raqami"
            htmlFor="size-order"
            error={errors.sortOrder}
            hint="Bo'sh qoldirsangiz hajm qiymati ishlatiladi."
          >
            <Input
              id="size-order"
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
                Nofaol hajmni yangi atirga qo'shib bo'lmaydi.
              </p>
            </div>
            <Toggle
              checked={form.isActive}
              onChange={(v) => setForm({ ...form, isActive: v })}
              label="Hajm faolligi"
            />
          </div>

          <Alert>{formError}</Alert>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
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
        title="Hajmni o'chirish"
        message={
          deleteError ??
          `«${deleting?.label}» o'chiriladi. Bu amalni qaytarib bo'lmaydi.`
        }
      />
    </>
  )
}
