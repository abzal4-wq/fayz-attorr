'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, TriangleAlert } from 'lucide-react'
import { useMemo } from 'react'
import { FieldError, FormError } from './form-parts'
import { makeAccountDeleteSchema } from '@/lib/validation/auth'
import { useT } from '@/lib/i18n/client'

/**
 * Hisobni o'chirish formasi.
 *
 * Parol ham, tasdiq belgisi ham so'raladi — amal qaytarilmaydi.
 * Tugma esa `destructive` rangda: foydalanuvchi uni "Saqlash" bilan
 * aralashtirib yubormasligi kerak.
 */
export function AccountDeleteForm() {
  const t = useT()
  const router = useRouter()

  const schema = useMemo(() => makeAccountDeleteSchema(t), [t])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    // Belgi qo'yilmagan holat `false` bo'lsin — `undefined` bo'lsa
    // zod "majburiy maydon" deb boshqa matn chiqarardi
    defaultValues: { confirm: false },
  })

  async function onSubmit(values) {
    const res = await fetch('/api/auth/hisobni-ochirish', {
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
      setError('root', { message: data?.message || t('profile.deleteFailed') })
      return
    }

    // Hisob yo'q, sessiya ham yo'q — bosh sahifaga
    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 p-4 pt-0">
      <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground">
        <TriangleAlert
          className="mt-0.5 size-4 shrink-0 text-danger-deep"
          aria-hidden="true"
        />
        <span>{t('profile.deleteAccountWarning')}</span>
      </div>

      {/*
        Buyurtmalar saqlanib qolishi ALOHIDA aytiladi: "hisobni
        o'chirish" odamda hamma ma'lumot yo'qoladi degan taassurot
        qoldiradi, aslida esa buyurtmadagi ism va telefon do'konda
        qoladi. Buni yashirish to'g'ri bo'lmasdi.
      */}
      <p className="text-sm text-muted-deep">{t('profile.deleteAccountOrders')}</p>

      <div>
        <label
          htmlFor="delete-password"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          {t('profile.passwordToConfirm')}
        </label>
        <input
          id="delete-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password ? 'true' : undefined}
          className="w-full min-h-12 rounded-lg border border-input bg-card px-4 text-[16px] text-card-foreground transition-colors duration-200 focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 aria-[invalid=true]:border-destructive"
          {...register('password')}
        />
        <FieldError error={errors.password} />
      </div>

      <div>
        {/* Belgi va matn bitta nishon: telefonda 44px dan katta maydon */}
        <label
          htmlFor="delete-confirm"
          className="flex min-h-11 cursor-pointer items-start gap-3 py-1 text-sm text-foreground"
        >
          <input
            id="delete-confirm"
            type="checkbox"
            aria-invalid={errors.confirm ? 'true' : undefined}
            className="mt-0.5 size-5 shrink-0 rounded border-input accent-destructive"
            {...register('confirm')}
          />
          <span>{t('profile.deleteConfirm')}</span>
        </label>
        <FieldError error={errors.confirm} />
      </div>

      <FormError error={errors.root} />

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-destructive px-6 font-semibold text-ivory transition-colors duration-200 hover:bg-danger-deep disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            {t('profile.deleting')}
          </>
        ) : (
          t('profile.deleteSubmit')
        )}
      </button>
    </form>
  )
}
