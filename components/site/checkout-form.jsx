'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ImageOff, LoaderCircle, ShoppingBag, TriangleAlert } from 'lucide-react'
import { PhoneInput } from '@/components/phone-input'
import { TelegramMainButton } from './telegram-controls'
import { cartTotal, useCart } from '@/lib/cart-store'
import { useHydrated } from '@/lib/use-hydrated'
import { maskPhoneInput } from '@/lib/auth/phone'
import { useMoney, useT } from '@/lib/i18n/client'

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
  const t = useT()
  const money = useMoney()
  const router = useRouter()
  const items = useCart((state) => state.items)
  const clear = useCart((state) => state.clear)
  const hydrated = useHydrated()

  // `user` null bo'lishi mumkin — mehmon buyurtmasi
  const [form, setForm] = useState({
    customerName: user?.fullName ?? '',
    // Maydonda faqat milliy qism turadi, "+998" tashqarida (phone-input.jsx)
    customerPhone: user?.phone ? maskPhoneInput(user.phone) : '',
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

  /*
   * Telegram MainButton ham, sahifadagi tugma ham shu yo'lni chaqiradi.
   *
   * HOOK ERTA `return` LARDAN OLDIN TURISHI SHART. Avval u pastda,
   * `if (!hydrated) return` dan keyin edi: birinchi renderda chaqirilmay,
   * ikkinchisida chaqirilardi va React #310 ("hook'lar soni o'zgardi")
   * bilan butun sahifa qulardi. Savatda mahsulot bo'lsa /buyurtma HAR
   * SAFAR ochilmasdi — ya'ni saytdan buyurtma berib bo'lmasdi.
   */
  const submitFromTelegram = useCallback(() => {
    formRef.current?.requestSubmit()
  }, [])

  if (!hydrated) {
    return <div className="skeleton h-96 rounded-xl" />
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-16 text-center">
        <ShoppingBag className="size-10 text-muted-deep" aria-hidden="true" />
        <p className="mt-4 font-serif text-xl text-foreground">
          {t('cart.empty')}
        </p>
        <Link
          href="/katalog"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground hover:bg-gold-light"
        >
          {t('common.goToCatalog')}
        </Link>
      </div>
    )
  }

  const subtotal = cartTotal(items)

  function set(key, value) {
    setForm({ ...form, [key]: value })
  }

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
      setFormError(data?.message ?? t('checkout.failed'))

      if (Array.isArray(data?.details)) setProblems(data.details)

      /*
       * 401 endi oddiy holatda kelmaydi (mehmon ham buyurtma bera
       * oladi), lekin sessiya buyurtma berayotgan paytda bekor
       * bo'lib qolishi mumkin — masalan boshqa qurilmada parol
       * almashtirilsa. Shu holda kirish sahifasiga yuboramiz.
       */
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
        label={t('checkout.submit')}
        onClick={submitFromTelegram}
        loading={pending}
        disabled={pending}
      />

      <div className="space-y-4 lg:col-span-2">
        {/*
          Mehmonga kirishni TAKLIF qilamiz, lekin to'smaymiz: buyurtma
          baribir o'tadi. Foyda aniq aytiladi (tarix saqlanadi), aks
          holda havola shunchaki yana bir to'siqdek tuyuladi.
        */}
        {user ? null : (
          <p className="rounded-xl border border-border bg-muted/50 p-4 text-sm text-muted-deep">
            {t('checkout.guestNotice')}{' '}
            <Link
              href="/kirish?keyin=%2Fbuyurtma"
              className="inline-block py-1 font-medium text-brand-deep underline underline-offset-4"
            >
              {t('checkout.guestLogin')}
            </Link>
          </p>
        )}

        <section className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
          <h2 className="font-serif text-xl text-card-foreground">
            {t('checkout.deliveryHeading')}
          </h2>

          <Field
            label={t('checkout.name')}
            htmlFor="customerName"
            error={errors.customerName}
          >
            <input
              id="customerName"
              autoComplete="name"
              value={form.customerName}
              aria-invalid={errors.customerName ? 'true' : undefined}
              onChange={(e) => set('customerName', e.target.value)}
              className={inputClass}
              placeholder={t('checkout.namePlaceholder')}
            />
          </Field>

          <Field
            label={t('checkout.phone')}
            htmlFor="customerPhone"
            error={errors.customerPhone}
            hint={t('checkout.phoneHint')}
          >
            <PhoneInput
              id="customerPhone"
              value={form.customerPhone}
              aria-invalid={errors.customerPhone ? 'true' : undefined}
              onChange={(e) => set('customerPhone', e.target.value)}
            />
          </Field>

          <Field
            label={t('checkout.address')}
            htmlFor="address"
            error={errors.address}
            hint={t('checkout.addressHint')}
          >
            <textarea
              id="address"
              rows={3}
              value={form.address}
              aria-invalid={errors.address ? 'true' : undefined}
              onChange={(e) => set('address', e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-4 py-3 text-[16px] text-card-foreground transition-colors duration-200 placeholder:text-muted-deep focus:border-brand-mid focus:outline-none aria-[invalid=true]:border-destructive"
              placeholder={t('checkout.addressPlaceholder')}
            />
          </Field>

          <Field label={t('checkout.comment')} htmlFor="comment" error={errors.comment}>
            <textarea
              id="comment"
              rows={2}
              value={form.comment}
              onChange={(e) => set('comment', e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-4 py-3 text-[16px] text-card-foreground transition-colors duration-200 placeholder:text-muted-deep focus:border-brand-mid focus:outline-none"
              placeholder={t('checkout.commentPlaceholder')}
            />
          </Field>
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <h2 className="border-b border-border p-4 font-serif text-xl text-card-foreground">
            {t('checkout.items')}
          </h2>
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.variantId} className="flex items-center gap-3 p-4">
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      // 56px joy, DPR 2-3 uchun
                      width={112}
                      height={112}
                      className="size-full object-cover"
                    />
                  ) : (
                    // Bo'sh kulrang kvadrat "rasm yuklanmadi" deb
                    // o'qilardi — belgi bu ataylab ekanini ko'rsatadi
                    <ImageOff className="size-5 text-muted-deep" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {/*
                    line-clamp-2, 1 emas: atir nomlari ko'pincha brend bilan
                    boshlanadi ("Chanel Chance...", "Chanel Blue...").
                    Bir qatorda faqat "Chanel..." qolib, mijoz qaysi atirni
                    olayotganini ko'rmasdi — aynan farqlovchi qism kesilardi.
                  */}
                  <p className="line-clamp-2 font-medium text-card-foreground">
                    {item.name}
                  </p>
                  <p className="text-sm text-muted-deep">
                    {item.brandName} · {item.sizeLabel} ·{' '}
                    {t('common.pieces', { n: item.quantity })}
                  </p>
                </div>
                <p className="whitespace-nowrap font-semibold text-gold-deep">
                  {money(item.unitPrice * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h2 className="font-serif text-xl text-card-foreground">
            {t('common.total')}
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
              {t('checkout.payable')}
            </span>
            <span className="text-xl font-bold text-gold-deep">
              {money(subtotal + deliveryPrice)}
            </span>
          </div>

          <p className="mt-3 rounded-lg bg-muted p-3 text-sm text-muted-deep">
            {t('checkout.paymentNote')}
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
                {t('checkout.submitting')}
              </>
            ) : (
              t('checkout.submit')
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
