'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LoaderCircle, ShoppingBag, TriangleAlert } from 'lucide-react'
import { PhoneInput } from '@/components/phone-input'
import { TelegramMainButton } from './telegram-controls'
import { cartTotal, useCart } from '@/lib/cart-store'
import { useHydrated } from '@/lib/use-hydrated'
import { formatPhone } from '@/lib/auth/phone'
import { formatSom } from '@/lib/format'

function Field({ label, htmlFor, error, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger-deep">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-2 text-sm text-muted-deep">{hint}</p>
      ) : null}
    </div>
  )
}

const inputClass =
  'w-full min-h-12 rounded-lg border border-input bg-card px-4 text-[16px] text-card-foreground transition-colors duration-200 placeholder:text-muted-deep focus:border-brand-mid focus:outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 aria-[invalid=true]:border-destructive'

export function CheckoutForm({ user, deliveryPrice, deliveryInfo }) {
  const router = useRouter()
  const items = useCart((state) => state.items)
  const clear = useCart((state) => state.clear)
  const hydrated = useHydrated()

  const [form, setForm] = useState({
    customerName: user.fullName ?? '',
    customerPhone: formatPhone(user.phone),
    address: '',
    comment: '',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [problems, setProblems] = useState([])
  const [pending, setPending] = useState(false)
  const formRef = useRef(null)

  // Savat bo'shab qolsa (masalan boshqa tabda tozalangan) — savatga qaytaramiz
  useEffect(() => {
    if (hydrated && items.length === 0 && !pending) {
      router.replace('/savat')
    }
  }, [hydrated, items.length, pending, router])

  if (!hydrated) {
    return <div className="skeleton h-96 rounded-xl" />
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-16 text-center">
        <ShoppingBag className="size-10 text-muted-deep" aria-hidden="true" />
        <p className="mt-4 font-serif text-xl text-foreground">Savat bo'sh</p>
        <Link
          href="/katalog"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground hover:bg-gold-light"
        >
          Katalogga o'tish
        </Link>
      </div>
    )
  }

  const subtotal = cartTotal(items)

  function set(key, value) {
    setForm({ ...form, [key]: value })
  }

  // Telegram MainButton ham, sahifadagi tugma ham shu yo'lni chaqiradi
  const submitFromTelegram = useCallback(() => {
    formRef.current?.requestSubmit()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setPending(true)
    setErrors({})
    setFormError(null)
    setProblems([])

    const res = await fetch('/api/buyurtma', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        // Serverga faqat nima va nechta kerakligini yuboramiz —
        // narxni u bazadan o'zi oladi
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
      }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      setPending(false)
      setErrors(data?.fieldErrors ?? {})
      setFormError(data?.message ?? "Buyurtmani yuborib bo'lmadi")

      if (Array.isArray(data?.details)) setProblems(data.details)

      if (res.status === 401) {
        router.push('/kirish?keyin=%2Fbuyurtma')
      }
      return
    }

    clear()
    router.push(`/buyurtma/muvaffaqiyat?raqam=${data.orderNumber}`)
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-6 lg:grid-cols-3"
    >
      {/* Mini App'da asosiy amal Telegram'ning o'z tugmasida bo'ladi */}
      <TelegramMainButton
        label="Buyurtmani tasdiqlash"
        onClick={submitFromTelegram}
        loading={pending}
        disabled={pending}
      />

      <div className="space-y-4 lg:col-span-2">
        <section className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
          <h2 className="font-serif text-xl text-card-foreground">
            Yetkazib berish ma'lumotlari
          </h2>

          <Field label="Ismingiz" htmlFor="customerName" error={errors.customerName}>
            <input
              id="customerName"
              autoComplete="name"
              value={form.customerName}
              aria-invalid={errors.customerName ? 'true' : undefined}
              onChange={(e) => set('customerName', e.target.value)}
              className={inputClass}
              placeholder="Aziz Karimov"
            />
          </Field>

          <Field
            label="Telefon raqami"
            htmlFor="customerPhone"
            error={errors.customerPhone}
            hint="Operator shu raqamga qo'ng'iroq qilib buyurtmani tasdiqlaydi."
          >
            <PhoneInput
              id="customerPhone"
              value={form.customerPhone}
              aria-invalid={errors.customerPhone ? 'true' : undefined}
              onChange={(e) => set('customerPhone', e.target.value)}
            />
          </Field>

          <Field
            label="Manzil"
            htmlFor="address"
            error={errors.address}
            hint="Tuman, ko'cha, uy va xonadon raqamini yozing."
          >
            <textarea
              id="address"
              rows={3}
              value={form.address}
              aria-invalid={errors.address ? 'true' : undefined}
              onChange={(e) => set('address', e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-4 py-3 text-[16px] text-card-foreground transition-colors duration-200 placeholder:text-muted-deep focus:border-brand-mid focus:outline-none aria-[invalid=true]:border-destructive"
              placeholder="Toshkent, Chilonzor 19-kvartal, 45-uy, 12-xonadon"
            />
          </Field>

          <Field label="Izoh" htmlFor="comment" error={errors.comment}>
            <textarea
              id="comment"
              rows={2}
              value={form.comment}
              onChange={(e) => set('comment', e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-4 py-3 text-[16px] text-card-foreground transition-colors duration-200 placeholder:text-muted-deep focus:border-brand-mid focus:outline-none"
              placeholder="Qo'shimcha izoh (ixtiyoriy)"
            />
          </Field>
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <h2 className="border-b border-border p-4 font-serif text-xl text-card-foreground">
            Mahsulotlar
          </h2>
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.variantId} className="flex items-center gap-3 p-4">
                <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      width={56}
                      height={56}
                      className="size-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-medium text-card-foreground">
                    {item.name}
                  </p>
                  <p className="text-sm text-muted-deep">
                    {item.brandName} · {item.sizeLabel} · {item.quantity} dona
                  </p>
                </div>
                <p className="whitespace-nowrap font-semibold text-gold-deep">
                  {formatSom(item.unitPrice * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h2 className="font-serif text-xl text-card-foreground">Jami</h2>

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
            <span className="font-medium text-card-foreground">To'lanadi</span>
            <span className="text-xl font-bold text-gold-deep">
              {formatSom(subtotal + deliveryPrice)}
            </span>
          </div>

          <p className="mt-3 rounded-lg bg-muted p-3 text-sm text-muted-deep">
            To'lov yetkazib berishda — naqd yoki karta orqali. Operator
            qo'ng'iroq qilib tasdiqlaydi.
          </p>

          {formError ? (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-danger-deep"
            >
              <p className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{formError}</span>
              </p>
              {problems.length > 0 ? (
                <ul className="mt-2 list-inside list-disc space-y-1 pl-6">
                  {problems.map((p, i) => (
                    <li key={i}>{p.reason}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? (
              <>
                <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
                Yuborilmoqda...
              </>
            ) : (
              'Buyurtmani tasdiqlash'
            )}
          </button>

          {deliveryInfo ? (
            <p className="mt-4 text-sm text-muted-deep">{deliveryInfo}</p>
          ) : null}
        </div>
      </aside>
    </form>
  )
}
