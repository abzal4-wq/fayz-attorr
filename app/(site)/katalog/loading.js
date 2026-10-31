import { ProductCardSkeleton } from '@/components/site/product-card'

/**
 * Katalog sahifasi yuklanayotganda — qidiruv maydoni va kartochkalar.
 *
 * Faqat BOSHQA sahifadan katalogga o'tishda ko'rinadi. Katalog ichida
 * qidiruv yoki filtr o'zgarganda ko'rinmaydi: o'tishlar React
 * transition'i, allaqachon ko'rsatilgan bo'lim fallback bilan
 * almashtirilmaydi — natijalar uchun sahifaning o'z Suspense'i bor
 * (katalog/page.js). Shuning uchun qidiruv maydoni fokusni yo'qotmaydi.
 */
export default function CatalogLoading() {
  return (
    <main className="min-h-svh pb-8 md:pb-16" aria-busy="true">
      <div className="mx-auto max-w-[1280px] px-4 pt-3 sm:px-6 md:pt-6">
        <div className="skeleton h-11 w-full rounded-lg" />
      </div>
      <div className="mx-auto max-w-[1280px] px-4 py-3 sm:px-6 md:py-6">
        <div className="skeleton mb-3 h-11 w-40 rounded md:mb-5" />
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i}>
              <ProductCardSkeleton />
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
