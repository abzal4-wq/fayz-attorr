'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, Info } from 'lucide-react'
import { Button, Field, Input, Textarea } from './ui'
import { Alert, PageHeader } from './display'

export function SettingsForm({ settings, telegram }) {
  const router = useRouter()
  const [form, setForm] = useState(settings)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [pending, setPending] = useState(false)
  const [saved, setSaved] = useState(false)

  function set(key, value) {
    setForm({ ...form, [key]: value })
    setSaved(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setPending(true)
    setErrors({})
    setFormError(null)

    const res = await fetch('/api/admin/sozlamalar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json().catch(() => null)
    setPending(false)

    if (!res.ok) {
      setErrors(data?.fieldErrors ?? {})
      setFormError(data?.message ?? 'Saqlashda xatolik yuz berdi')
      return
    }

    setSaved(true)
    router.refresh()
  }

  return (
    <form method="post" onSubmit={handleSubmit} noValidate className="max-w-2xl pb-10">
      <PageHeader
        title="Sozlamalar"
        description="Saytning pastki qismida va buyurtma sahifasida ko'rinadi."
      />

      <section className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="font-medium text-card-foreground">Aloqa</h2>

        <Field label="Telefon" htmlFor="phone" error={errors.phone}>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+998 90 123 45 67"
          />
        </Field>

        <Field label="Manzil" htmlFor="address" error={errors.address}>
          <Input
            id="address"
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="Toshkent, Chilonzor tumani ..."
          />
        </Field>

        <Field label="Ish vaqti" htmlFor="workingHours" error={errors.workingHours}>
          <Input
            id="workingHours"
            value={form.workingHours}
            onChange={(e) => set('workingHours', e.target.value)}
            placeholder="Dushanba–Shanba, 09:00–20:00"
          />
        </Field>
      </section>

      <section className="mt-6 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="font-medium text-card-foreground">Ijtimoiy tarmoqlar</h2>

        <Field label="Telegram havolasi" htmlFor="telegramUrl" error={errors.telegramUrl}>
          <Input
            id="telegramUrl"
            value={form.telegramUrl}
            onChange={(e) => set('telegramUrl', e.target.value)}
            placeholder="https://t.me/fayzattor"
          />
        </Field>

        <Field label="Instagram havolasi" htmlFor="instagramUrl" error={errors.instagramUrl}>
          <Input
            id="instagramUrl"
            value={form.instagramUrl}
            onChange={(e) => set('instagramUrl', e.target.value)}
            placeholder="https://instagram.com/fayzattor"
          />
        </Field>
      </section>

      <section className="mt-6 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="font-medium text-card-foreground">Yetkazib berish</h2>

        <Field
          label="Yetkazib berish narxi (so'm)"
          htmlFor="deliveryPrice"
          error={errors.deliveryPrice}
          hint="0 — bepul yetkazib berish."
        >
          <Input
            id="deliveryPrice"
            type="number"
            inputMode="numeric"
            min={0}
            value={form.deliveryPrice}
            onChange={(e) => set('deliveryPrice', e.target.value)}
          />
        </Field>

        <Field label="Shartlar matni" htmlFor="deliveryInfo" error={errors.deliveryInfo}>
          <Textarea
            id="deliveryInfo"
            rows={3}
            value={form.deliveryInfo}
            onChange={(e) => set('deliveryInfo', e.target.value)}
          />
        </Field>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="font-medium text-card-foreground">Telegram bildirishnomalari</h2>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Bot</dt>
            <dd className="font-medium text-card-foreground">
              {telegram.botUsername ? `@${telegram.botUsername}` : 'Ulanmagan'}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Xabar oluvchilar</dt>
            <dd className="font-medium text-card-foreground">
              {telegram.chatCount} ta chat
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            Bot tokeni va chat ID'lari xavfsizlik uchun server sozlamalarida
            (<code className="font-mono text-xs">.env</code>) saqlanadi, bu
            yerda tahrirlanmaydi. O'zgartirish kerak bo'lsa ayting.
          </p>
        </div>
      </section>

      <div className="mt-6">
        <Alert>{formError}</Alert>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button type="submit" variant="gold" pending={pending}>
          Saqlash
        </Button>
        {saved ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-success-deep">
            <Check className="size-4" aria-hidden="true" />
            Saqlandi
          </span>
        ) : null}
      </div>
    </form>
  )
}
