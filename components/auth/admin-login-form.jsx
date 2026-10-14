'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, TriangleAlert } from 'lucide-react'
import { adminLoginSchema } from '@/lib/validation/auth'

export function AdminLoginForm({ redirectTo = '/admin' }) {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(adminLoginSchema) })

  async function onSubmit(values) {
    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const data = await res.json().catch(() => null)

    if (!res.ok) {
      setError('root', { message: data?.message || 'Kirishda xatolik yuz berdi' })
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label
          htmlFor="username"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Login
        </label>
        <input
          id="username"
          autoFocus
          autoComplete="username"
          aria-invalid={errors.username ? 'true' : undefined}
          className="w-full min-h-12 rounded-lg border border-input bg-card px-4 text-[16px] text-card-foreground transition-colors duration-200 focus:border-secondary focus:outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 aria-[invalid=true]:border-destructive"
          {...register('username')}
        />
        {errors.username ? (
          <p role="alert" className="mt-2 text-sm text-danger-deep">
            {errors.username.message}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Parol
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password ? 'true' : undefined}
          className="w-full min-h-12 rounded-lg border border-input bg-card px-4 text-[16px] text-card-foreground transition-colors duration-200 focus:border-secondary focus:outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 aria-[invalid=true]:border-destructive"
          {...register('password')}
        />
        {errors.password ? (
          <p role="alert" className="mt-2 text-sm text-danger-deep">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      {errors.root ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-danger-deep"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{errors.root.message}</span>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary px-6 font-semibold text-secondary-foreground transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            Kirilmoqda...
          </>
        ) : (
          'Kirish'
        )}
      </button>
    </form>
  )
}
