'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Oddiy modal: Escape bilan yopiladi, fon bosilsa yopiladi,
 * ochilganda fokus ichkariga o'tadi va orqa fon scroll qilinmaydi.
 * Mobilda ekranning pastidan to'liq kenglikda chiqadi.
 */
export function Modal({ open, onClose, title, children, wide = false }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Ochilganda birinchi fokuslanadigan elementga o'tamiz
    const focusable = panelRef.current?.querySelector(
      'input, select, textarea, button:not([aria-label="Yopish"])'
    )
    focusable?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <button
        type="button"
        aria-label="Yopish"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40"
      />

      <div
        ref={panelRef}
        className={cn(
          'relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-card p-5 shadow-lg',
          'sm:rounded-2xl sm:p-6',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-md'
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="font-serif text-xl text-card-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}

/** Tasdiqlash oynasi — o'chirish kabi qaytarib bo'lmaydigan amallar uchun. */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "O'chirish",
  pending,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Bekor qilish
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-destructive px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
