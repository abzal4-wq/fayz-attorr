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
    <main className="mx-auto max-w-[1280px] px-4 py-4 pb-8 sm:px-6 md:py-6 md:pb-16">
      <h1 className="mb-4 font-serif text-xl text-foreground md:mb-6 md:text-3xl">
        {t('cart.title')}
      </h1>
      <CartPage
        deliveryPrice={settings.deliveryPrice}
        deliveryInfo={settings.deliveryInfo}
      />
    </main>
  )
}
