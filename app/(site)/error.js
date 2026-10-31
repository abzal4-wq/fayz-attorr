'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { RotateCcw, TriangleAlert } from 'lucide-react'
import { useT } from '@/lib/i18n/client'

/**
 * Sayt sahifalarida kutilmagan xato yuz berganda ko'rsatiladi.
 *
 * Avval bu fayl yo'q edi: masalan Neon ulanishi bir lahza uzilsa,
 * mijoz Next'ning bezaksiz oq xato ekranini ko'rardi — brendsiz,
 * tilsiz va qayta urinish tugmasisiz.
 *
 * Bu yerda ildiz layout hamon ishlaydi, demak header, footer va
 * tarjima mavjud. `reset()` sahifani qaytadan render qilishga
 * urinadi — vaqtinchalik uzilishda shuning o'zi yetarli bo'ladi.
 */
export default function SiteError({ error, reset }) {
  const t = useT()

  useEffect(() => {
    // Mijozga texnik tafsilot ko'rsatilmaydi, lekin logda qolsin:
    // Vercel'da bu Runtime Logs bo'limida ko'rinadi.
    console.error('Sahifada xato:', error?.digest ?? '', error?.message)
  }, [error])

  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <TriangleAlert className="size-12 text-danger-deep" aria-hidden="true" />

      <h1 className="mt-6 font-serif text-2xl text-foreground md:text-3xl">
        {t('error.title')}
      </h1>

      <p className="mt-4 text-pretty text-muted-deep">{t('error.text')}</p>

      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light"
        >
          <RotateCcw className="size-5" aria-hidden="true" />
          {t('error.retry')}
        </button>

        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-5 text-sm font-semibold text-foreground transition-colors duration-200 hover:border-brand-mid"
        >
          {t('notFound.home')}
        </Link>
      </div>

      {/*
        `digest` — Next xatoga beradigan qisqa kod. Mijoz uni aytsa,
        logdan aynan o'sha hodisani topish mumkin. Xato matnining
        o'zi ko'rsatilmaydi: unda baza tafsilotlari bo'lishi mumkin.
      */}
      {error?.digest ? (
        <p className="mt-8 font-mono text-xs text-muted-deep">{error.digest}</p>
      ) : null}
    </main>
  )
}
