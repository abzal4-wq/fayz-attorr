import { redirect } from 'next/navigation'
import { CheckoutForm } from '@/components/site/checkout-form'
import { getCurrentUser } from '@/lib/auth/session'
import { getStoreSettings } from '@/lib/settings'

export const metadata = { title: 'Buyurtma berish' }

export default async function CheckoutPage() {
  const user = await getCurrentUser()

  // Middleware ham tekshiradi; bu ikkinchi qatlam — token haqiqiy, lekin
  // foydalanuvchi bazadan o'chirilgan bo'lishi mumkin.
  if (!user) redirect('/kirish?keyin=%2Fbuyurtma')

  const settings = await getStoreSettings()

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-6 pb-16 sm:px-6">
      <h1 className="mb-6 font-serif text-2xl text-foreground md:text-3xl">
        Buyurtma berish
      </h1>
      <CheckoutForm
        user={{ fullName: user.fullName, phone: user.phone }}
        deliveryPrice={settings.deliveryPrice}
        deliveryInfo={settings.deliveryInfo}
      />
    </main>
  )
}
