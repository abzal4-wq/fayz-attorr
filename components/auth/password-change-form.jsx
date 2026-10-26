'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FieldError, FormError } from './form-parts'
import { makePasswordChangeSchema } from '@/lib/validation/auth'
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password'
import { useT } from '@/lib/i18n/client'

/**
 * Profildagi parol almashtirish formasi.
 *
 * `<details>` ichida: bu kamdan-kam ishlatiladigan amal, ochiq
 * turgan ikkita parol maydoni esa buyurtmalar ro'yxatini telefonda
 * pastga surib yuborardi.
 */
export function PasswordChangeForm() {
  const t = useT()
  const router = useRouter()
  const [done, setDone] = useState(false)

  const schema = useMemo(() => makePasswordChangeSchema(t), [t])

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(values) {
    setDone(false)

    const res = await fetch('/api/auth/parolni-ozgartirish', {
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
        message: data?.message || t('profile.changePasswordFailed'),
      })
      return
    }

    reset()
    setDone(true)

    /*
     * Server yangi cookie qo'ydi (eski token `tokenVersion` oshgani
     * uchun kuchini yo'qotdi). `refresh` bo'lmasa sahifa eski
     * so'rov natijasini ko'rsatib turardi.
     */
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 p-4 pt-0">
      <p className="text-sm text-muted-deep">{t('profile.changePasswordHint')}</p>

      <PasswordField
        id="currentPassword"
        label={t('profile.currentPassword')}
        autoComplete="current-password"
        error={errors.currentPassword}
        t={t}
        {...register('currentPassword')}
      />

      <div>
        <PasswordField
          id="newPassword"
          label={t('profile.newPassword')}
          autoComplete="new-password"
          error={errors.newPassword}
          t={t}
          {...register('newPassword')}
        />
        <p className="mt-2 text-xs text-muted-deep">
          {t('auth.passwordHint', { n: MIN_PASSWORD_LENGTH })}
        </p>
      </div>

      <FormError error={errors.root} />

      {done ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg bg-success-deep/10 p-3 text-sm text-success-deep"
        >
          <Check className="size-4 shrink-0" aria-hidden="true" />
          {t('profile.passwordChanged')}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            {t('profile.savingPassword')}
          </>
        ) : (
          t('profile.savePassword')
        )}
      </button>
    </form>
  )
}

/**
 * Parol maydoni — ko'rsatish tugmasi bilan.
 *
 * `register(...)` natijasi `ref` ni ham o'z ichiga oladi, shuning
 * uchun props to'g'ridan-to'g'ri `<input>` ga uzatiladi.
 */
function PasswordField({ id, label, error, t, ...props }) {
  const [show, setShow] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          aria-invalid={error ? 'true' : undefined}
          className="w-full min-h-12 rounded-lg border border-input bg-card pl-4 pr-12 text-[16px] text-card-foreground transition-colors duration-200 placeholder:text-muted-foreground focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 aria-[invalid=true]:border-destructive"
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
          className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-card-foreground"
        >
          {show ? (
            <EyeOff className="size-5" aria-hidden="true" />
          ) : (
            <Eye className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>
      <FieldError error={error} />
    </div>
  )
}
