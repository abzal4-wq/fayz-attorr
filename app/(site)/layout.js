import { BottomNav } from '@/components/site/bottom-nav'
import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'

export default function SiteLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      {/* pb-bottom-nav: mobil pastki navigatsiya kontentni yopib qolmasligi uchun */}
      <div className="flex-1 pb-bottom-nav lg:pb-0">{children}</div>

      <SiteFooter />

      {/* Footer ham nav ostida qolmasin */}
      <div className="pb-bottom-nav lg:hidden" aria-hidden="true" />

      <BottomNav />
    </div>
  )
}
