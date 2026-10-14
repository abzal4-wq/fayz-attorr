'use client'

import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = {
  primary: 'bg-secondary text-secondary-foreground hover:opacity-90',
  gold: 'bg-primary text-primary-foreground hover:bg-gold-light',
  outline: 'border border-border text-foreground hover:bg-muted',
  danger: 'border border-destructive/40 text-danger-deep hover:bg-destructive/10',
}

export function Button({
  variant = 'primary',
  pending = false,
  className,
  children,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold',
        'transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60',
        buttonVariants[variant],
        className
      )}
      disabled={pending || props.disabled}
      {...props}
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  )
}

export function Field({ label, htmlFor, error, hint, children }) {
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
        <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export function Input({ className, invalid, ...props }) {
  return (
    <input
      aria-invalid={invalid ? 'true' : undefined}
      className={cn(
        'w-full min-h-11 rounded-lg border border-input bg-card px-3 text-[16px] text-card-foreground',
        'transition-colors duration-200 placeholder:text-muted-foreground',
        'focus:border-secondary focus:outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
        'aria-[invalid=true]:border-destructive',
        className
      )}
      {...props}
    />
  )
}

export function Textarea({ className, invalid, ...props }) {
  return (
    <textarea
      aria-invalid={invalid ? 'true' : undefined}
      className={cn(
        'w-full rounded-lg border border-input bg-card px-3 py-2 text-[16px] text-card-foreground',
        'transition-colors duration-200 placeholder:text-muted-foreground',
        'focus:border-secondary focus:outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
        'aria-[invalid=true]:border-destructive',
        className
      )}
      {...props}
    />
  )
}

export function Select({ className, invalid, children, ...props }) {
  return (
    <select
      aria-invalid={invalid ? 'true' : undefined}
      className={cn(
        'w-full min-h-11 rounded-lg border border-input bg-card px-3 text-[16px] text-card-foreground',
        'transition-colors duration-200',
        'focus:border-secondary focus:outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
        'aria-[invalid=true]:border-destructive',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

/** Faol / nofaol holat uchun kalit. */
export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200',
        'focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        checked ? 'bg-success-deep' : 'bg-muted-foreground/40'
      )}
    >
      <span
        className={cn(
          'inline-block size-5 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  )
}
