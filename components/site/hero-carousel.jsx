'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  CarouselArrow,
  CarouselDots,
  carouselKeyDown,
  useWheel,
} from '@/components/site/carousel'
import { useMoney, useT } from '@/lib/i18n/client'

/** G'ildirakka ko'pi bilan shuncha atir tushadi. */
const MAX_ITEMS = 7

/**
 * Har bir atir faol atirdan necha qadam uzoqda turishiga qarab qanday
 * ko'rinishi.
 *
 * O'rtadagisi to'g'ri va katta, yonidagilari kichrayib, ichkariga
 * qiyshayadi va orqaga ketadi — doira bo'ylab terilgandek. Ikkitadan
 * uzoqdagilari umuman ko'rinmaydi: telefonda ekranda 5 tadan ortiq
 * flakon bo'lsa, hammasi mayda bo'lib, hech biri o'qilmaydi.
 */
/*
 * `veil` — flakon ustidagi to'q parda.
 *
 * NEGA shaffoflik emas: atir rasmlarining foni OQ. Chetdagi flakonni
 * shaffof qilsak, u to'q teal fonda oqarib, atirga emas, bo'sh kulrang
 * plitaga o'xshab qoladi (birinchi sinovda aynan shunday chiqdi).
 * Qorong'ilashtirilgani esa soyada turgandek — ko'z o'rtadagiga
 * tushadi, chetdagilar esa atirligicha qoladi.
 */
const STEPS = [
  { shift: 0, depth: 0, turn: 0, scale: 1, opacity: 1, veil: 0 },
  { shift: 62, depth: -140, turn: 38, scale: 0.78, opacity: 1, veil: 0.4 },
  { shift: 104, depth: -280, turn: 48, scale: 0.58, opacity: 0.92, veil: 0.65 },
]

function styleFor(distance) {
  // distance: faol atirdan necha qadam (manfiy — chapda, musbat — o'ngda)
  const step = STEPS[Math.abs(distance)]

  if (!step) {
    // Ko'rinmaydigan atirlar: chetda, shaffof. DOM'dan olib tashlamaymiz —
    // olib tashlasak har aylanishda rasm qaytadan yuklanardi.
    return {
      veil: 1,
      style: {
        transform: 'translateX(0) scale(0.5)',
        opacity: 0,
        zIndex: 0,
        pointerEvents: 'none',
      },
    }
  }

  const side = Math.sign(distance)

  return {
    veil: step.veil,
    style: {
      transform: [
        `translateX(${side * step.shift}%)`,
        `translateZ(${step.depth}px)`,
        // Minus: o'ngdagi flakon chap qirrasi bilan bizga qaraydi
        `rotateY(${-side * step.turn}deg)`,
        `scale(${step.scale})`,
      ].join(' '),
      opacity: step.opacity,
      zIndex: 10 - Math.abs(distance),
      pointerEvents: 'auto',
    },
  }
}

/**
 * Bosh sahifaning yuqori qismi: brend sarlavhasi + doira bo'ylab
 * aylanadigan atirlar g'ildiragi.
 *
 * Flakonlar ketma-ket o'rtaga chiqadi, o'rtaga chiqqanining nomi, turi
 * (ayollar/erkaklar/unisex) va narxi pastda almashadi.
 *
 * NEGA scroll emas, transform: bu yerda elementlar bir-birining ORQASIGA
 * o'tadi va qiyshayadi — brauzerning scroll'i buni bera olmaydi. Pastdagi
 * "Tanlangan atirlar" qatori esa aksincha, oddiy scroll'da qoladi: u
 * ro'yxat, g'ildirak emas.
 *
 * Atir yo'q bo'lsa (baza yiqilgan yoki hali to'ldirilmagan) faqat brend
 * sarlavhasi va katalog tugmasi qoladi.
 */
export function HeroCarousel({ products = [] }) {
  const t = useT()
  const money = useMoney()

  /*
   * Tugagan atir g'ildirakka chiqmaydi (sahifaning eng katta joyidan
   * "mavjud emas" deb turishi reklama emas), rasmsizi ham chiqmaydi —
   * g'ildirak butunlay rasmga qurilgan.
   */
  const items = products.filter((p) => !p.outOfStock && p.imageUrl).slice(0, MAX_ITEMS)
  const count = items.length

  const { index, goTo, next, prev, holdProps, dragProps } = useWheel({ count })
  const active = items[index] ?? null

  return (
    <section
      className="dark relative overflow-hidden text-foreground"
      style={{
        backgroundImage: 'linear-gradient(160deg, #0D454E 0%, #0A3942 55%, #072B32 100%)',
      }}
      {...holdProps}
    >
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 md:py-10">
        {/* Brend sarlavhasi — g'ildirak almashsa ham joyida turadi */}
        <div className="flex flex-col items-center text-center">
          <Image
            src="/monogram.png"
            alt=""
            width={200}
            height={200}
            priority
            className="h-12 w-12 rounded-xl md:h-16 md:w-16 md:rounded-2xl"
          />
          <h1 className="mt-3 font-serif text-2xl font-semibold text-ivory md:mt-4 md:text-4xl">
            Fayz Attor
          </h1>
          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-on-dark md:text-sm">
            {t('home.tagline')}
          </p>
        </div>

        {count > 0 ? (
          <Wheel
            items={items}
            index={index}
            goTo={goTo}
            next={next}
            prev={prev}
            dragProps={dragProps}
            label={t('home.heroCarousel')}
          />
        ) : null}

        {active ? (
          <ActiveInfo product={active} money={money} t={t} />
        ) : (
          /* Atirlar yuklanmasa ham sahifa katalogga olib boradi */
          <div className="mt-5 flex justify-center">
            <CatalogButton label={t('home.viewCatalog')} />
          </div>
        )}
      </div>

      {count > 1 ? (
        <div className="flex items-center justify-center gap-1 pb-4 md:pb-6">
          {/*
            Telefonda o'q tugmalari yashirin: barmoq bilan surish
            tabiiyroq. Yashirish TUGMANING O'ZIDA emas, o'ramda —
            sababi `carousel.jsx` dagi izohda.
          */}
          <div className="hidden md:block">
            <CarouselArrow direction="prev" tone="dark" onClick={prev} />
          </div>
          <CarouselDots
            count={count}
            index={index}
            goTo={goTo}
            label={t('home.heroCarousel')}
          />
          <div className="hidden md:block">
            <CarouselArrow direction="next" tone="dark" onClick={next} />
          </div>
        </div>
      ) : null}
    </section>
  )
}

/** Doira: flakonlar o'rtadan chetga qarab kichrayib, qiyshayib ketadi. */
function Wheel({ items, index, goTo, next, prev, dragProps, label }) {
  const t = useT()
  const count = items.length

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={carouselKeyDown(prev, next)}
      {...dragProps}
      /*
       * touch-action: pan-y — gorizontal surishni o'zimiz boshqaramiz,
       * lekin sahifani YUQORIGA-PASTGA aylantirishni brauzerga qoldiramiz.
       * Busiz Telegram Mini App ichida g'ildirakka tegib qolgan barmoq
       * sahifani scroll qila olmay qolardi.
       *
       * perspective: shusiz rotateY shunchaki siqilgan rasm bo'lib
       * ko'rinadi, chuqurlik sezilmaydi.
       */
      style={{ perspective: '1100px', touchAction: 'pan-y' }}
      className="relative mt-4 h-40 select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold sm:h-52 md:mt-6 md:h-72"
    >
      {items.map((product, i) => {
        /*
         * Doiraviy masofa: oxirgi atirdan birinchisiga o'tganda
         * g'ildirak orqaga qaytib ketmasligi uchun masofa eng qisqa
         * yo'nalish bo'yicha hisoblanadi (7 ta atirda 6 -> 0 bu +1,
         * -6 emas).
         */
        let distance = i - index
        if (distance > count / 2) distance -= count
        if (distance < -count / 2) distance += count

        const isActive = distance === 0
        const { veil, style } = styleFor(distance)

        return (
          <button
            key={product.id}
            type="button"
            onClick={() => goTo(i)}
            tabIndex={-1}
            aria-hidden={!isActive}
            aria-label={`${product.brandName} ${product.name}`}
            style={style}
            className="absolute left-1/2 top-1/2 -ml-[72px] -mt-[72px] size-36 overflow-hidden rounded-2xl border border-ivory/15 bg-brand-darker/40 transition-[transform,opacity] duration-500 ease-out sm:-ml-[88px] sm:-mt-[88px] sm:size-44 md:-ml-[136px] md:-mt-[136px] md:size-[272px]"
          >
            <Image
              src={product.imageUrl}
              alt=""
              width={544}
              height={544}
              // Faqat o'rtadagi va unga qo'shni ikkitasi darrov kerak
              priority={Math.abs(distance) <= 1}
              sizes="(max-width: 768px) 45vw, 272px"
              className="size-full object-cover"
            />

            {/* Chetdagi flakonlarni soyaga oluvchi parda */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-brand-darker transition-opacity duration-500"
              style={{ opacity: veil }}
            />

            {product.maxDiscount > 0 && isActive ? (
              <span className="absolute start-2 top-2 rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-white">
                −{product.maxDiscount}%
              </span>
            ) : null}
          </button>
        )
      })}

      {/* Skrinriderga: hozir qaysi atir o'rtada turibdi */}
      <p className="sr-only" aria-live="polite">
        {t('common.slideOf', { number: index + 1, total: count })}
      </p>
    </div>
  )
}

/** O'rtadagi atirning nomi, turi va narxi — g'ildirak bilan birga almashadi. */
function ActiveInfo({ product, money, t }) {
  const { slug, name, brandName, gender, minPrice, maxPrice, oldMinPrice } = product

  const priceLabel =
    minPrice == null
      ? null
      : minPrice === maxPrice
        ? money(minPrice)
        : t('common.priceFrom', { price: money(minPrice) })

  return (
    /*
     * min-h: atir nomi bir qatorli ham, ikki qatorli ham bo'ladi.
     * Balandlik qat'iy bo'lmasa, g'ildirak har aylanganda pastdagi
     * butun sahifa sakrab turardi.
     */
    <div className="mt-4 flex min-h-[140px] flex-col items-center text-center md:mt-6 md:min-h-[164px]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-on-dark md:text-xs">
        {brandName}
        {gender ? (
          <>
            <span className="mx-1.5 text-muted-on-dark/50">·</span>
            {t(`genderFor.${gender}`)}
          </>
        ) : null}
      </p>

      {/*
        h2: sahifadagi yagona h1 — "Fayz Attor". G'ildirakdagi atirlar
        unga bo'ysunadigan sarlavhalar.
      */}
      <h2 className="mt-1.5 text-balance font-serif text-xl font-semibold text-ivory md:text-3xl">
        {name}
      </h2>

      {priceLabel ? (
        <p className="mt-1.5 flex flex-wrap items-baseline justify-center gap-x-2">
          <span className="text-base font-bold text-gold-light md:text-xl">
            {priceLabel}
          </span>
          {oldMinPrice ? (
            <span className="text-sm text-muted-on-dark line-through">
              {money(oldMinPrice, { withSuffix: false })}
            </span>
          ) : null}
        </p>
      ) : null}

      <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
        <Link
          href={`/atir/${slug}`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light"
        >
          {t('home.viewProduct')}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <CatalogButton label={t('home.viewCatalog')} variant="ghost" />
      </div>
    </div>
  )
}

function CatalogButton({ label, variant = 'solid' }) {
  const styles =
    variant === 'ghost'
      ? 'border border-ivory/30 text-ivory hover:border-gold hover:text-gold-light'
      : 'bg-primary font-semibold text-primary-foreground hover:bg-gold-light'

  return (
    <Link
      href="/katalog"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 transition-colors duration-200 ${styles}`}
    >
      {label}
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  )
}
