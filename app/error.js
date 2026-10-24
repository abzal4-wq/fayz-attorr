'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { RotateCcw, TriangleAlert } from 'lucide-react'
import { useT } from '@/lib/i18n/client'

/**
 * Eng yuqori xato chegarasi (ildiz layout'dan keyingi).
 *
 * NEGA ALOHIDA KERAK: `app/(site)/error.js` faqat SAHIFA xatosini
 * ushlaydi, o'z layout'iniki emas. Sayt layout'i esa footer orqali
 * `getStoreSettings()` ni chaqiradi — baza uzilsa xato aynan o'sha
 * yerda tug'iladi va pastdagi chegaradan o'tib ketadi. Shu fayl
 * bo'lmaganda mijoz bo'm-bo'sh 500 sahifasini ko'rgan edi
 * (sinab tasdiqlangan: kesh tozalab, bazani uzib).
 *
 * Bu yerda header/footer chizilmaydi — ular yiqilgan bo'lishi mumkin.
 * Ildiz layout esa ishlaydi (u faqat cookie o'qiydi), shuning uchun
 * tarjima mavjud.
 */
export default function RootError({ error, reset }) {
  const t = useT()

  useEffect(() => {
    console.error('Sahifada xato:', error?.digest ?? '', error?.message)
  }, [error])

  return (
    <main className="dark flex min-h-app flex-col items-center justify-center bg-background px-4 py-16 text-center text-foreground">
      <TriangleAlert className="size-12 text-gold" aria-hidden="true" />

      <h1 className="mt-6 font-serif text-2xl text-ivory md:text-3xl">
        {t('error.title')}
      </h1>

      <p className="mt-4 max-w-md text-pretty text-muted-on-dark">
        {t('error.text')}
      </p>

      <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light"
        >
          <RotateCcw className="size-5" aria-hidden="true" />
          {t('error.retry')}
        </button>

        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border px-6 font-semibold text-ivory transition-colors duration-200 hover:border-gold hover:text-gold"
        >
          {t('notFound.home')}
        </Link>
      </div>

      {error?.digest ? (
        <p className="mt-8 font-mono text-xs text-muted-on-dark">{error.digest}</p>
      ) : null}
    </main>
  )
}
