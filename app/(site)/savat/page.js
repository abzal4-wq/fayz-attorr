import { CartPage } from '@/components/site/cart-page'
import { getStoreSettings } from '@/lib/settings'
import { getT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const t = await getT()
  return { title: t('meta.cartTitle') }
}

export default async function SavatPage() {
  const [settings, t] = await Promise.all([getStoreSettings(), getT()])

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-6 pb-16 sm:px-6">
      <h1 className="mb-6 font-serif text-2xl text-foreground md:text-3xl">
        {t('cart.title')}
      </h1>
      <CartPage
        deliveryPrice={settings.deliveryPrice}
        deliveryInfo={settings.deliveryInfo}
      />
    </main>
  )
}
