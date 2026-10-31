'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LoaderCircle, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PhoneInput } from '@/components/phone-input'
import { FieldError, FormError, Label, SubmitButton, TextInput } from './form-parts'
import {
  makeResetConfirmSchema,
  makeResetRequestSchema,
} from '@/lib/validation/auth'
import { RESET_CODE_LENGTH } from '@/lib/auth/reset-constants'
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password'
import { useT } from '@/lib/i18n/client'

/**
 * Parolni tiklash formasi.
 *
 * Ikki ekran:
 *  1. telefon raqami -> server Telegram havolasini qaytaradi
 *  2. Telegram tugmasi + kod + yangi parol
 *
 * NEGA 2 va 3-qadam BIR ekranda: foydalanuvchi Telegram'ga o'tib,
 * keyin brauzerga qaytadi. Agar kod maydoni keyingi ekranda bo'lsa,
 * qaytgandan keyin yana tugma bosishi kerak bo'lardi — mobil
 * brauzerda bu eng ko'p yo'qotiladigan joy.
 */
export function ResetForm() {
  const t = useT()
  const router = useRouter()

  // null bo'lsa — hali 1-qadam
  const [telegramUrl, setTelegramUrl] = useState(null)

  if (!telegramUrl) {
    return <PhoneStep t={t} onReady={setTelegramUrl} />
  }

  return (
    <CodeStep
      t={t}
      telegramUrl={telegramUrl}
      onRestart={() => setTelegramUrl(null)}
      onDone={() => {
        router.push('/profil')
        router.refresh()
      }}
    />
  )
}

/* ------------------------------ 1-qadam ------------------------------ */

function PhoneStep({ t, onReady }) {
  const schema = useMemo(() => makeResetRequestSchema(t), [t])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(values) {
    const res = await fetch('/api/auth/parol-tiklash/sorov', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const data = await res.json().catch(() => null)

    if (!res.ok || !data?.telegramUrl) {
      if (data?.fieldErrors) {
        for (const [field, message] of Object.entries(data.fieldErrors)) {
          setError(field, { message })
        }
      }
      setError('root', { message: data?.message || t('auth.resetFailed') })
      return
    }

    onReady(data.telegramUrl)
  }

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <p className="text-xs uppercase tracking-wider text-muted-on-dark">
        {t('auth.resetPhoneStep')}
      </p>

      <div>
        <Label htmlFor="phone">{t('auth.phone')}</Label>
        <PhoneInput
          id="phone"
          autoFocus
          // Hisobni aniqlaydi — login bilan bir xil (login-form.jsx izohi)
          autoComplete="username"
          aria-invalid={errors.phone ? 'true' : undefined}
          {...register('phone')}
        />
        <FieldError error={errors.phone} />
      </div>

      <FormError error={errors.root} />

      <SubmitButton isSubmitting={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            {t('auth.resetSending')}
          </>
        ) : (
          t('auth.resetContinue')
        )}
      </SubmitButton>
    </form>
  )
}

/* ---------------------------- 2 va 3-qadam ---------------------------- */

function CodeStep({ t, telegramUrl, onRestart, onDone }) {
  const schema = useMemo(() => makeResetConfirmSchema(t), [t])
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(values) {
    const res = await fetch('/api/auth/parol-tiklash/tasdiq', {
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
      setError('root', { message: data?.message || t('auth.resetFailed') })
      return
    }

    onDone()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-muted-on-dark">
          {t('auth.resetTelegramStep')}
        </p>

        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground transition-colors duration-200 hover:bg-gold-light"
        >
          <Send className="size-5" aria-hidden="true" />
          {t('auth.resetOpenTelegram')}
        </a>

        <p className="text-sm text-muted-on-dark">{t('auth.resetTelegramHelp')}</p>

        <details className="text-sm text-muted-on-dark">
          <summary className="min-h-11 cursor-pointer py-2.5">
            {t('auth.resetNoTelegram')}
          </summary>
          {/*
            Havola uzun va bo'linmaydigan belgilardan iborat —
            `break-all` bo'lmasa telefonda gorizontal scroll chiqadi
          */}
          <code className="mt-1 block break-all text-xs text-ivory/80">
            {telegramUrl}
          </code>
        </details>
      </div>

      <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <p className="text-xs uppercase tracking-wider text-muted-on-dark">
          {t('auth.resetCodeStep')}
        </p>

        <div>
          <Label htmlFor="code">{t('auth.resetCode')}</Label>
          <TextInput
            id="code"
            // Telefonda raqamli klaviatura chiqadi, `type=number` esa
            // boshidagi nolni yeb qo'yadi — kod "012345" bo'lishi mumkin
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={RESET_CODE_LENGTH}
            placeholder={t('auth.resetCodePlaceholder')}
            aria-invalid={errors.code ? 'true' : undefined}
            className="text-center text-xl tracking-[0.3em]"
            {...register('code')}
          />
          <FieldError error={errors.code} />
        </div>

        <div>
          <Label htmlFor="password">{t('auth.resetNewPassword')}</Label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              aria-invalid={errors.password ? 'true' : undefined}
              className="w-full min-h-11 rounded-lg border border-input bg-card pl-4 pr-12 text-[16px] text-card-foreground transition-colors duration-200 placeholder:text-muted-foreground focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 aria-[invalid=true]:border-destructive"
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
          <p className="mt-2 text-xs text-muted-on-dark">
            {t('auth.passwordHint', { n: MIN_PASSWORD_LENGTH })}
          </p>
          <FieldError error={errors.password} />
        </div>

        <FormError error={errors.root} />

        <SubmitButton isSubmitting={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
              {t('auth.resetSaving')}
            </>
          ) : (
            t('auth.resetSubmit')
          )}
        </SubmitButton>
      </form>

      <button
        type="button"
        onClick={onRestart}
        className="min-h-11 w-full text-sm text-muted-on-dark underline-offset-4 hover:text-ivory hover:underline"
      >
        {t('auth.resetBackToPhone')}
      </button>
    </div>
  )
}
