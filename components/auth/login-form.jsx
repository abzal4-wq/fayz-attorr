'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { PhoneInput } from '@/components/phone-input'
import { FieldError, FormError, Label, SubmitButton } from './form-parts'
import { loginSchema } from '@/lib/validation/auth'

export function LoginForm({ redirectTo = '/' }) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) })

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
        message: data?.message || "Kirishda xatolik yuz berdi. Qayta urinib ko'ring.",
      })
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <Label htmlFor="phone">Telefon raqami</Label>
        <PhoneInput
          id="phone"
          autoFocus
          aria-invalid={errors.phone ? 'true' : undefined}
          {...register('phone')}
        />
        <FieldError error={errors.phone} />
      </div>

      <div>
        <Label htmlFor="password">Parol</Label>
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
            aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
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

      <FormError error={errors.root} />

      <SubmitButton isSubmitting={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            Kirilmoqda...
          </>
        ) : (
          'Kirish'
        )}
      </SubmitButton>
    </form>
  )
}
