'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  CarouselArrow,
  CarouselDots,
  carouselKeyDown,
  useCarousel,
} from '@/components/site/carousel'
import { useMoney, useT } from '@/lib/i18n/client'

/** Bannerda nechta atir ko'rsatiladi — ko'pi bilan shuncha. */
const MAX_SLIDES = 5

/**
 * Bosh sahifaning yuqori qismi: brend slaydi + tanlangan atirlar
 * banner bo'lib almashib turadi.
 *
 * BIRINCHI SLAYD BREND SLAYDI — ataylab. Bannerni to'g'ridan-to'g'ri
 * atirdan boshlasak, saytga birinchi marta kirgan odam do'kon nomini
 * ko'rmay qolardi, va `<h1>` atir nomiga ko'chib ketardi (bosh sahifa
 * "Fayz Attor" so'rovi bo'yicha qidiruvda pastga tushardi). Shuning
 * uchun `<h1>` shu yerda, birinchi slaydda qoladi va HTML'dan hech
 * qachon chiqib ketmaydi.
 *
 * Atir yo'q bo'lsa (baza yiqilgan yoki hali to'ldirilmagan) — bitta
 * brend slaydi qoladi, karusel boshqaruvlari ko'rinmaydi.
 */
export function HeroCarousel({ products = [] }) {
  const t = useT()
  const money = useMoney()

  /*
   * Ikki shart:
   *  - tugagan atir bannerga chiqmaydi (sahifaning eng katta joyidan
   *    "mavjud emas" deb turishi reklama emas);
   *  - rasmsiz atir ham chiqmaydi — banner butunlay rasmga qurilgan,
   *    bo'sh kvadrat slaydni buzardi.
   */
  const slides = products.filter((p) => !p.outOfStock && p.imageUrl).slice(0, MAX_SLIDES)
  const count = slides.length + 1

  const { trackRef, index, goTo, next, prev, sync, holdProps } = useCarousel({
    count,
    interval: 6000,
  })

  return (
    <section
      className="dark relative overflow-hidden text-foreground"
      style={{
        backgroundImage: 'linear-gradient(160deg, #0D454E 0%, #0A3942 55%, #072B32 100%)',
      }}
      aria-roledescription="carousel"
      aria-label={t('home.heroCarousel')}
      {...holdProps}
    >
      <div
        ref={trackRef}
        onScroll={sync}
        onKeyDown={carouselKeyDown(prev, next)}
        // tabIndex: scroll qilinadigan maydon klaviatura bilan ham
        // boshqarilishi kerak (skrinrider va klaviatura foydalanuvchisi
        // barmoq bilan sura olmaydi)
        tabIndex={0}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
      >
        <BrandSlide total={count} />
        {slides.map((product, i) => (
          <ProductSlide
            key={product.id}
            product={product}
            position={i + 2}
            total={count}
            money={money}
            t={t}
            // Birinchi atir slaydi darrov ko'rinadigan joyda turadi
            // (foydalanuvchi 6 soniya kutmaydi, surib ko'radi)
            priority={i === 0}
          />
        ))}
      </div>

      {count > 1 ? (
        <>
          <div className="flex items-center justify-center gap-1 pb-4 md:pb-6">
            {/*
              Telefonda o'q tugmalari yashirin: barmoq bilan surish
              tabiiyroq, tugmalar esa nuqtalarni chetga siqib qo'yardi.

              Yashirish TUGMANING O'ZIDA emas, o'ramda: tugmaning asosiy
              klassi `inline-flex`, va `hidden` ni qo'shib yuborsak
              ikkalasi ham bitta klass — qaysi biri yutishi Tailwind
              CSS'dagi tartibga bog'liq bo'lib qoladi (sinovda `hidden`
              yutmadi, o'qlar telefonda ham chiqdi).
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

          {/* Skrinriderga: qaysi slayd ochiq ekanini aytadi */}
          <p className="sr-only" aria-live="polite">
            {t('common.slideOf', { number: index + 1, total: count })}
          </p>
        </>
      ) : null}
    </section>
  )
}

/** Slayd qobig'i — barcha slaydlar bir xil en va bir xil ichki joylashuv. */
function Slide({ position, total, label, children }) {
  return (
    <div
      className="w-full shrink-0 snap-center"
      role="group"
      aria-roledescription="slide"
      aria-label={label ?? `${position} / ${total}`}
    >
      {/*
        items-center: slaydlar balandligi flex qatorida tenglashadi
        (eng balandi bo'yicha). Markazlamasak, kaltaroq brend slaydi
        tepaga yopishib, tagida katta bo'sh joy qolardi.
      */}
      <div className="flex h-full items-center">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 md:py-16">
          {children}
        </div>
      </div>
    </div>
  )
}

function BrandSlide({ total }) {
  const t = useT()

  return (
    <Slide position={1} total={total} label="Fayz Attor">
      <div className="flex flex-col items-center text-center">
        <Image
          src="/monogram.png"
          alt=""
          width={200}
          height={200}
          priority
          className="h-14 w-14 rounded-xl md:h-20 md:w-20 md:rounded-2xl"
        />
        <h1 className="mt-4 font-serif text-3xl font-semibold text-ivory md:mt-6 md:text-5xl">
          Fayz Attor
        </h1>
        <p className="mt-1.5 text-xs uppercase tracking-[0.18em] text-muted-on-dark md:text-sm">
          {t('home.tagline')}
        </p>
        <p className="mt-3 max-w-xl text-pretty text-sm text-muted-on-dark md:mt-5 md:text-base">
          {t('home.intro')}
        </p>

        <Link
          href="/katalog"
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light"
        >
          {t('home.viewCatalog')}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </Slide>
  )
}

function ProductSlide({ product, position, total, money, t, priority }) {
  const { slug, name, brandName, imageUrl, minPrice, maxPrice, oldMinPrice, maxDiscount } =
    product

  const priceLabel =
    minPrice == null
      ? null
      : minPrice === maxPrice
        ? money(minPrice)
        : t('common.priceFrom', { price: money(minPrice) })

  return (
    <Slide position={position} total={total} label={`${brandName} ${name}`}>
      {/*
        Telefonda: rasm tepada, matn pastda, markazda — bir ustun.
        md dan boshlab: matn chapda, rasm o'ngda. Rasm telefonda
        ataylab kichik (size-36): banner ekranning yarmidan ko'pini
        egallasa, pastdagi kategoriyalar ko'rinmay qoladi.
      */}
      <div className="flex flex-col items-center gap-5 text-center md:grid md:grid-cols-2 md:items-center md:gap-10 md:text-start">
        <div className="relative shrink-0 md:order-2 md:justify-self-center">
          <div className="overflow-hidden rounded-2xl border border-ivory/15 bg-brand-darker/40">
            <Image
              src={imageUrl}
              alt={`${brandName} ${name}`}
              width={520}
              height={520}
              priority={priority}
              sizes="(max-width: 768px) 40vw, 320px"
              className="size-36 object-cover sm:size-44 md:size-72"
            />
          </div>

          {maxDiscount > 0 ? (
            <span className="absolute start-2 top-2 rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-white">
              −{maxDiscount}%
            </span>
          ) : null}
        </div>

        <div className="md:order-1">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-on-dark md:text-sm">
            {brandName}
          </p>
          {/*
            h2: sahifadagi yagona h1 brend slaydida. Banner ichidagi
            atirlar — unga bo'ysunadigan sarlavhalar.
          */}
          <h2 className="mt-2 text-balance font-serif text-2xl font-semibold text-ivory md:text-4xl">
            {name}
          </h2>

          {priceLabel ? (
            <p className="mt-3 flex flex-wrap items-baseline justify-center gap-x-2 md:mt-4 md:justify-start">
              <span className="text-lg font-bold text-gold-light md:text-2xl">
                {priceLabel}
              </span>
              {oldMinPrice ? (
                <span className="text-sm text-muted-on-dark line-through">
                  {money(oldMinPrice, { withSuffix: false })}
                </span>
              ) : null}
            </p>
          ) : null}

          <Link
            href={`/atir/${slug}`}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light"
          >
            {t('home.viewProduct')}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </Slide>
  )
}
