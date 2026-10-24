import Link from 'next/link'
import { Home, Search } from 'lucide-react'
import { getT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const t = await getT()
  return { title: t('meta.notFoundTitle') }
}

export default async function NotFound() {
  const t = await getT()

  return (
    <main className="dark flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground">
      <p className="font-serif text-6xl text-gold">404</p>
      <h1 className="mt-4 font-serif text-2xl text-ivory md:text-3xl">
        {t('notFound.title')}
      </h1>
      <p className="mt-3 max-w-md text-muted-on-dark">{t('notFound.text')}</p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light"
        >
          <Home className="size-5" aria-hidden="true" />
          {t('notFound.home')}
        </Link>
        <Link
          href="/katalog"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border px-6 font-semibold text-ivory transition-colors duration-200 hover:border-gold hover:text-gold"
        >
          <Search className="size-5" aria-hidden="true" />
          {t('notFound.catalog')}
        </Link>
      </div>
    </main>
  )
}
