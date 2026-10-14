import { CartPage } from '@/components/site/cart-page'
import { getStoreSettings } from '@/lib/settings'

export const metadata = { title: 'Savat' }

export default async function SavatPage() {
  const settings = await getStoreSettings()

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-6 pb-16 sm:px-6">
      <h1 className="mb-6 font-serif text-2xl text-foreground md:text-3xl">Savat</h1>
      <CartPage
        deliveryPrice={settings.deliveryPrice}
        deliveryInfo={settings.deliveryInfo}
      />
    </main>
  )
}
