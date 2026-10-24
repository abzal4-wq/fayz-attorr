import Link from 'next/link'
import { CheckCircle2, Phone } from 'lucide-react'
import { getStoreSettings } from '@/lib/settings'
import { getT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const t = await getT()
  return { title: t('meta.successTitle') }
}

export default async function OrderSuccessPage({ searchParams }) {
  const [params, settings, t] = await Promise.all([
    searchParams,
    getStoreSettings(),
    getT(),
  ])
  const orderNumber = String(params?.raqam ?? '').replace(/\D/g, '')

  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center sm:px-6">
      <CheckCircle2 className="size-14 text-success-deep" aria-hidden="true" />

      <h1 className="mt-6 font-serif text-2xl text-foreground md:text-3xl">
        {t('success.title')}
      </h1>

      {orderNumber ? (
        <p className="mt-3 text-lg">
          {t('success.orderNumber')}{' '}
          <span className="font-bold text-gold-deep">#{orderNumber}</span>
        </p>
      ) : null}

      <p className="mt-4 text-pretty text-muted-deep">{t('success.text')}</p>

      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/profil"
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light"
        >
          {t('success.myOrders')}
        </Link>
        <Link
          href="/katalog"
          className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border px-6 font-semibold text-foreground transition-colors duration-200 hover:border-brand-mid"
        >
          {t('success.continueShopping')}
        </Link>
      </div>

      {settings.phone ? (
        <a
          href={`tel:${settings.phone.replace(/\s/g, '')}`}
          className="mt-8 inline-flex items-center gap-2 text-sm text-muted-deep underline-offset-4 hover:text-foreground hover:underline"
        >
          <Phone className="size-4" aria-hidden="true" />
          {t('success.question', { phone: settings.phone })}
        </a>
      ) : null}
    </main>
  )
}
