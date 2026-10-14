import { TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Interaktiv bo'lmagan ko'rinish komponentlari.
 *
 * Bu faylda ataylab 'use client' YO'Q: server komponentlar ham ishlatadi.
 * Client komponent bo'lsa, server sahifa unga `icon` sifatida lucide
 * komponentini uzata olmaydi ("Functions cannot be passed directly to
 * Client Components").
 */

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
