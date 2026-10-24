'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { RotateCcw, TriangleAlert } from 'lucide-react'

/**
 * Admin panelidagi kutilmagan xato.
 *
 * Sayt tomonidan farqi: bu yerda matn faqat o'zbekcha (panel
 * tarjima qilinmaydi) va `digest` ko'proq ko'zga tashlanadi —
 * uni do'kon egasi aytsa, logdan hodisani topish oson bo'ladi.
 */
export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error('Admin panelida xato:', error?.digest ?? '', error?.message)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <TriangleAlert className="size-10 text-destructive" aria-hidden="true" />

      <h1 className="mt-5 font-serif text-xl text-card-foreground">
        Nimadir noto&apos;g&apos;ri ketdi
      </h1>

      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        Bu sahifani ochishda xatolik yuz berdi. Qayta urinib ko&apos;ring.
        Takrorlansa, quyidagi kodni saqlab qo&apos;ying — u bo&apos;yicha
        sabab aniqlanadi.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Qayta urinish
        </button>

        <Link
          href="/admin"
          className="inline-flex min-h-11 items-center rounded-lg border border-border px-5 text-sm font-medium text-card-foreground transition-colors duration-200 hover:border-brand-mid"
        >
          Boshqaruv paneli
        </Link>
      </div>

      {error?.digest ? (
        <p className="mt-6 rounded-md bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground">
          {error.digest}
        </p>
      ) : null}
    </div>
  )
}
