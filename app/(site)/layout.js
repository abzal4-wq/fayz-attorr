import { BottomNav } from '@/components/site/bottom-nav'
import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { TelegramProvider } from '@/components/site/telegram-provider'
import { TelegramBackButton } from '@/components/site/telegram-controls'

/*
 * DIQQAT: bu sahifalar ATAYLAB dinamik render bo'ladi.
 *
 * Til cookie'da saqlanadi (`lib/i18n/config.js`), ya'ni ildiz layout
 * `cookies()` ni o'qiydi — bunday sahifani Next build paytida muzlatib
 * qo'ya olmaydi. Avvalgi `revalidate = 60` shu sababli olib tashlandi:
 * u endi hech narsaga ta'sir qilmasdi, faqat chalg'itardi.
 *
 * Kesh yo'qolmadi, pastga tushdi: baza so'rovlari `lib/catalog.js` va
 * `lib/settings.js` ichida 60 soniya keshlanadi (`lib/cache.js`).
 * Natija: HTML har safar to'g'ri tilda, bazaga esa yuk ortmaydi.
 */

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
