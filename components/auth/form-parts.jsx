'use client'

import { TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Label({ htmlFor, children, className }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('mb-2 block text-sm font-medium text-ivory', className)}
    >
      {children}
    </label>
  )
}

/** Bitta maydon ostidagi xato. */
export function FieldError({ error }) {
  if (!error?.message) return null
  return (
    <p role="alert" className="mt-2 text-sm text-gold-light">
      {error.message}
    </p>
  )
}

/** Formaning umumiy xatosi (server qaytargan). */
export function FormError({ error }) {
  if (!error?.message) return null
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/15 p-3 text-sm text-ivory"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{error.message}</span>
    </div>
  )
}

export function TextInput({ className, ...props }) {
  return (
    <input
      className={cn(
        'w-full min-h-11 rounded-lg border border-input bg-card px-4 text-[16px] text-card-foreground',
        'transition-colors duration-200 placeholder:text-muted-foreground',
        'focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
        'aria-[invalid=true]:border-destructive',
        className
      )}
      {...props}
    />
  )
}

export function SubmitButton({ isSubmitting, children }) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className={cn(
        'flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5',
        'text-sm font-semibold text-primary-foreground transition-colors duration-200',
        'hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-70'
      )}
    >
      {children}
    </button>
  )
}
