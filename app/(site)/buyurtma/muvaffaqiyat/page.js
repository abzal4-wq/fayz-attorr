import Link from 'next/link'
import { CheckCircle2, Phone } from 'lucide-react'
import { getStoreSettings } from '@/lib/settings'

export const metadata = { title: 'Buyurtma qabul qilindi' }

export default async function OrderSuccessPage({ searchParams }) {
  const params = await searchParams
  const orderNumber = String(params?.raqam ?? '').replace(/\D/g, '')
  const settings = await getStoreSettings()

  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center sm:px-6">
      <CheckCircle2 className="size-14 text-success-deep" aria-hidden="true" />

      <h1 className="mt-6 font-serif text-2xl text-foreground md:text-3xl">
        Buyurtmangiz qabul qilindi
      </h1>

      {orderNumber ? (
        <p className="mt-3 text-lg">
          Buyurtma raqami:{' '}
          <span className="font-bold text-gold-deep">#{orderNumber}</span>
        </p>
      ) : null}

      <p className="mt-4 text-pretty text-muted-deep">
        Operator tez orada siz ko'rsatgan raqamga qo'ng'iroq qilib buyurtmani
        tasdiqlaydi. To'lov yetkazib berishda amalga oshiriladi.
      </p>

      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/profil"
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light"
        >
          Buyurtmalarim
        </Link>
        <Link
          href="/katalog"
          className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border px-6 font-semibold text-foreground transition-colors duration-200 hover:border-brand-mid"
        >
          Xaridni davom ettirish
        </Link>
      </div>

      {settings.phone ? (
        <a
          href={`tel:${settings.phone.replace(/\s/g, '')}`}
          className="mt-8 inline-flex items-center gap-2 text-sm text-muted-deep underline-offset-4 hover:text-foreground hover:underline"
        >
          <Phone className="size-4" aria-hidden="true" />
          Savol bo'lsa: {settings.phone}
        </a>
      ) : null}
    </main>
  )
}
