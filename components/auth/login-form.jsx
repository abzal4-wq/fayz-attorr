'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PhoneInput } from '@/components/phone-input'
import { FieldError, FormError, Label, SubmitButton } from './form-parts'
import { makeLoginSchema } from '@/lib/validation/auth'
import { useT } from '@/lib/i18n/client'

export function LoginForm({ redirectTo = '/' }) {
  const t = useT()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  // Til almashsa sxema ham yangi tilda qayta tuziladi
  const schema = useMemo(() => makeLoginSchema(t), [t])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(values) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const data = await res.json().catch(() => null)

    if (!res.ok) {
      if (data?.fieldErrors) {
        for (const [field, message] of Object.entries(data.fieldErrors)) {
          setError(field, { message })
        }
      }
      setError('root', {
        message: data?.message || t('auth.loginFailed'),
      })
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <Label htmlFor="phone">{t('auth.phone')}</Label>
        <PhoneInput
          id="phone"
          autoFocus
          /*
           * `username`, `tel` EMAS. `tel` brauzerga "manzillar
           * kitobidagi telefonni qo'y" deydi: Chrome kirish formasiga
           * egasining profil raqamini yozardi (hisobdagi raqam bo'lmasa
           * ham), parol menejeri esa boshqa hisobning parolini qo'yardi
           * — natija "Telefon raqami yoki parol noto'g'ri". `username`
           * bilan telefon va parol JUFT saqlanib, birga to'ldiriladi.
           */
          autoComplete="username"
          aria-invalid={errors.phone ? 'true' : undefined}
          {...register('phone')}
        />
        <FieldError error={errors.phone} />
      </div>

      <div>
        <Label htmlFor="password">{t('auth.password')}</Label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
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
        <FieldError error={errors.password} />
      </div>

      {/*
        Havola parol maydonidan keyin turadi: odam avval parolni
        kiritib ko'radi, esiga tushmasa shu yerda topadi
      */}
      <Link
        href="/parolni-tiklash"
        className="inline-block py-2.5 text-sm text-muted-on-dark underline-offset-4 hover:text-ivory hover:underline"
      >
        {t('auth.forgotPassword')}
      </Link>

      <FormError error={errors.root} />

      <SubmitButton isSubmitting={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            {t('auth.loggingIn')}
          </>
        ) : (
          t('auth.loginTitle')
        )}
      </SubmitButton>
    </form>
  )
}
