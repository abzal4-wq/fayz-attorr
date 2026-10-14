import { BottomNav } from '@/components/site/bottom-nav'
import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { TelegramProvider } from '@/components/site/telegram-provider'
import { TelegramBackButton } from '@/components/site/telegram-controls'

/**
 * Sayt sahifalari bazadan o'qiydi (atirlar, brendlar, do'kon sozlamalari),
 * lekin Next buni bilmaydi va ularni build paytida muzlatib qo'yadi —
 * natijada yangi atir yoki o'zgargan sozlama qayta deploy qilmaguncha
 * saytda ko'rinmaydi.
 *
 * Shuning uchun sahifalar har 60 soniyada qayta tiklanadi: admin
 * o'zgartirishi bir daqiqa ichida chiqadi, baza esa har so'rovda
 * bezovta qilinmaydi. searchParams/cookie ishlatadigan sahifalar
 * (katalog, buyurtma, profil) baribir to'liq dinamik bo'lib qoladi.
 */
export const revalidate = 60

export default function SiteLayout({ children }) {
  return (
    <TelegramProvider>
      <TelegramBackButton />

      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />

        {/* pb-bottom-nav: mobil pastki navigatsiya kontentni yopib qolmasligi uchun */}
        <div className="flex-1 pb-bottom-nav lg:pb-0">{children}</div>

        <SiteFooter />

        {/* Footer ham nav ostida qolmasin */}
        <div className="pb-bottom-nav lg:hidden" aria-hidden="true" />

        <BottomNav />
      </div>
    </TelegramProvider>
  )
}
