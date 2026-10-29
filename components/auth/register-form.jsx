'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PhoneInput } from '@/components/phone-input'
import { FieldError, FormError, Label, SubmitButton, TextInput } from './form-parts'
import { makeRegisterSchema } from '@/lib/validation/auth'
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password'
import { useT } from '@/lib/i18n/client'

export function RegisterForm({ redirectTo = '/' }) {
  const t = useT()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [phoneTaken, setPhoneTaken] = useState(false)

  const schema = useMemo(() => makeRegisterSchema(t), [t])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(values) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const data = await res.json().catch(() => null)

    // 409 — raqam band (route'da shu status ataylab beriladi)
    setPhoneTaken(res.status === 409)

    if (!res.ok) {
      if (data?.fieldErrors) {
        for (const [field, message] of Object.entries(data.fieldErrors)) {
          setError(field, { message })
        }
      }
      // Raqam band bo'lsa hammasi maydon ostida aytilgan (havolalar
      // bilan) — umumiy blokda xuddi shu gapni takrorlamaymiz
      if (res.status !== 409) {
        setError('root', {
          message: data?.message || t('auth.registerFailed'),
        })
      }
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <Label htmlFor="fullName">{t('auth.yourName')}</Label>
        <TextInput
          id="fullName"
          autoFocus
          autoComplete="name"
          placeholder={t('auth.namePlaceholder')}
          aria-invalid={errors.fullName ? 'true' : undefined}
          {...register('fullName')}
        />
        <FieldError error={errors.fullName} />
      </div>

      <div>
        <Label htmlFor="phone">{t('auth.phone')}</Label>
        <PhoneInput
          id="phone"
          // username: brauzer telefon+parolni JUFT qilib saqlasin
          // (nega `tel` emas — login-form.jsx dagi izohga qarang)
          autoComplete="username"
          aria-invalid={errors.phone ? 'true' : undefined}
          {...register('phone')}
        />
        <FieldError error={errors.phone} />

        {/*
          Raqam band bo'lsa — yo'l ko'rsatamiz. Avval faqat "Kirishni
          sinab ko'ring" deyilardi: parolni unutgan odam uchun bu boshi
          berk ko'cha edi — kira olmaydi, qayta ro'yxatdan ham o'ta
          olmaydi. Tiklash hisobni (va buyurtmalar tarixini) saqlab
          qoladi; kerak bo'lsa keyin profildan o'chirsa bo'ladi.
        */}
        {phoneTaken ? (
          <div className="mt-3 flex flex-wrap gap-x-4 text-sm">
            <Link
              href="/kirish"
              className="inline-block py-2.5 font-medium text-gold underline-offset-4 hover:underline"
            >
              {t('auth.goLogin')}
            </Link>
            <Link
              href="/parolni-tiklash"
              className="inline-block py-2.5 font-medium text-gold underline-offset-4 hover:underline"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
        ) : null}
      </div>

      <div>
        <Label htmlFor="password">{t('auth.password')}</Label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            aria-invalid={errors.password ? 'true' : undefined}
            className="w-full min-h-12 rounded-lg border border-input bg-card pl-4 pr-12 text-[16px] text-card-foreground transition-colors duration-200 placeholder:text-muted-foreground focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 aria-[invalid=true]:border-destructive"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={
              showPassword ? t('auth.hidePassword') : t('auth.showPassword')
            }
            className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-card-foreground"
          >
            {showPassword ? (
              <EyeOff className="size-5" aria-hidden="true" />
            ) : (
              <Eye className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password ? (
          <FieldError error={errors.password} />
        ) : (
          <p className="mt-2 text-sm text-muted-on-dark">
            {t('auth.passwordHint', { n: MIN_PASSWORD_LENGTH })}
          </p>
        )}
      </div>

      <FormError error={errors.root} />

      <SubmitButton isSubmitting={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            {t('auth.registering')}
          </>
        ) : (
          t('auth.registerTitle')
        )}
      </SubmitButton>
    </form>
  )
}
