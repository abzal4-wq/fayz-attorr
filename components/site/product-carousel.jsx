'use client'

import {
  CarouselArrow,
  CarouselProgress,
  carouselKeyDown,
  useCarousel,
} from '@/components/site/carousel'
import { ProductCard } from '@/components/site/product-card'
import { useT } from '@/lib/i18n/client'

/**
 * "Tanlangan atirlar" qatori — o'zi aylanadi, qo'lda ham suriladi.
 *
 * Avval bu oddiy `overflow-x-auto` ro'yxat edi: kartochkalar bor edi,
 * lekin hech narsa ularning yonida davomi borligini aytmasdi —
 * telefonda ikkinchi yarim kartochka ko'rinib turardi, desktopda esa
 * qator ekranga sig'ib, scroll borligi bilinmasdi. Endi qator o'zi
 * sekin siljiydi (harakat "davomi bor" deb aytadi), tagida progress
 * chizig'i turadi, desktopda o'q tugmalari qo'shiladi.
 *
 * Aylanish 4.5 soniyada bir qadam — banner (6s) dan tezroq, chunki bu
 * yerda bitta slayd emas, bitta kartochka siljiydi.
 */
export function ProductCarousel({ products }) {
  const t = useT()
  const count = products.length

  const { trackRef, progress, next, prev, sync, holdProps } = useCarousel({
    count,
    interval: 4500,
  })

  return (
    <div
      aria-roledescription="carousel"
      aria-label={t('home.featured')}
      {...holdProps}
    >
      <ul
        ref={trackRef}
        onScroll={sync}
        onKeyDown={carouselKeyDown(prev, next)}
        tabIndex={0}
        /*
         * -mx-4 ... px-4: qator ekranning chetigacha boradi, lekin
         * birinchi kartochka sahifa chetidan 16px ichkarida boshlanadi.
         * Shu tufayli "davomi bor" ko'rinishi saqlanadi.
         */
        className="no-scrollbar -mx-4 mt-2 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold sm:mx-0 sm:gap-4 sm:px-0 md:mt-4"
      >
        {products.map((product, index) => (
          <li
            key={product.id}
            className="w-[45%] shrink-0 snap-start sm:w-[30%] lg:w-[23%]"
          >
            <ProductCard product={product} priority={index < 2} />
          </li>
        ))}
      </ul>

      {count > 1 ? (
        <div className="mt-1 flex items-center gap-3">
          <CarouselProgress progress={progress} className="flex-1" />
          {/* O'q tugmalari faqat desktopda — telefonda swipe yetarli */}
          <div className="hidden shrink-0 items-center gap-1 md:flex">
            <CarouselArrow direction="prev" onClick={prev} />
            <CarouselArrow direction="next" onClick={next} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
