'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LoaderCircle, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LogoutButton({ variant = 'user', className, children }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleLogout() {
    setPending(true)
    try {
      await fetch(
        variant === 'admin' ? '/api/admin/auth/logout' : '/api/auth/logout',
        { method: 'POST' }
      )
      router.push(variant === 'admin' ? '/admin/kirish' : '/')
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4',
        'text-sm font-medium transition-colors duration-200 hover:border-destructive',
        'disabled:cursor-not-allowed disabled:opacity-70',
        className
      )}
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="size-4" aria-hidden="true" />
      )}
      {children ?? 'Chiqish'}
    </button>
  )
}
