'use client'

import { LoaderCircle, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-serif text-2xl text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-14 text-center">
      {Icon ? (
        <Icon className="size-8 text-muted-foreground" aria-hidden="true" />
      ) : null}
      <p className="mt-4 font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

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

export function Alert({ children }) {
  if (!children) return null
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-danger-deep"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}

export function Badge({ tone = 'neutral', children }) {
  const tones = {
    neutral: 'bg-muted text-muted-foreground',
    success: 'bg-success-deep/10 text-success-deep',
    danger: 'bg-destructive/10 text-danger-deep',
    gold: 'bg-primary/20 text-gold-deep',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        tones[tone]
      )}
    >
      {children}
    </span>
  )
}
