import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { HeroCarousel } from '@/components/site/hero-carousel'
import { ProductCarousel } from '@/components/site/product-carousel'
import { getFeaturedProducts, getHomeBrands } from '@/lib/catalog'
import { brandLogoUrl } from '@/lib/cloudinary-url'
import { getStoreSettings } from '@/lib/settings'
import { getT } from '@/lib/i18n/server'

/**
 * Katalogdan o'qiydi, lekin xato bo'lsa bo'sh ro'yxat qaytaradi.
 *
 * NEGA: bosh sahifaning asosiy qismi (hero, kategoriyalar, ustunliklar)
 * bazaga umuman bog'liq emas. Avval atirlar so'rovi yiqilsa BUTUN
 * sahifa 500 qaytarardi — mijoz katalogga o'ta ham olmasdi. Endi
 * shunday paytda slayder va brendlar qatori shunchaki ko'rinmaydi.
 *
 * Xato yashirilmaydi: u logga yoziladi (Vercel Runtime Logs).
 * Katalog va mahsulot sahifalari esa ataylab bunday qilmaydi —
 * u yerda atirlarsiz ko'rsatadigan narsa yo'q, shuning uchun xato
 * sahifasi to'g'riroq.
 */
async function optional(label, load) {
  try {
    return await load()
  } catch (error) {
    console.error(`Bosh sahifa: ${label} yuklanmadi:`, error?.message)
    return []
  }
}

export default async function HomePage() {
  const [featured, brands, settings, t] = await Promise.all([
    optional('tanlangan atirlar', () => getFeaturedProducts(10)),
    optional('brendlar', () => getHomeBrands(12)),
    getStoreSettings(),
    getT(),
  ])

  const categories = [
    {
      href: '/katalog?gender=WOMEN',
      label: t('genderFor.WOMEN'),
      description: t('home.categoryWomenDesc'),
    },
    {
      href: '/katalog?gender=MEN',
      label: t('genderFor.MEN'),
      description: t('home.categoryMenDesc'),
    },
    {
      href: '/katalog?gender=UNISEX',
      label: t('genderFor.UNISEX'),
      description: t('home.categoryUnisexDesc'),
    },
  ]

  const advantages = [
    {
      icon: ShieldCheck,
      title: t('home.advantageOriginalTitle'),
      text: t('home.advantageOriginalText'),
    },
    {
      icon: Truck,
      title:
        settings.deliveryPrice === 0
          ? t('home.advantageDeliveryFreeTitle')
          : t('home.advantageDeliveryFastTitle'),
      // Do'kon sozlamasida yozilgani ustun: u aniq shartlarni bildiradi
      text: settings.deliveryInfo || t('home.advantageDeliveryText'),
    },
    {
      icon: Sparkles,
      title: t('home.advantageChoiceTitle'),
      text: t('home.advantageChoiceText'),
    },
  ]

  return (
    <main>
      {/*
        Hero — endi karusel: birinchi slayd brend (h1 shu yerda),
        keyingilari tanlangan atirlar. Gradient va boshqaruvlar
        `hero-carousel.jsx` ichida, chunki aylanish uchun client
        komponent kerak; bu sahifa server komponenti bo'lib qoladi.
      */}
      <HeroCarousel products={featured} />

      {/* Kategoriyalar */}
      {/*
        Telefonda 3 ta plitka BITTA qatorda (avval ustma-ust, ~400px edi).
        Tavsif faqat sm dan boshlab — tor plitkaga sig'masdi.
      */}
      <section className="mx-auto max-w-[1280px] px-4 py-5 sm:px-6 md:py-10">
        <h2 className="font-serif text-xl text-foreground md:text-3xl">
          {t('home.categories')}
        </h2>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-4 md:mt-6">
          {categories.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group flex min-h-20 flex-col justify-between rounded-xl border border-border bg-card p-3 transition-colors duration-200 hover:border-gold sm:min-h-32 sm:p-5"
            >
              <div>
                <p className="font-serif text-base leading-tight text-card-foreground sm:text-xl">{c.label}</p>
                <p className="mt-1 hidden text-sm text-muted-deep sm:block">{c.description}</p>
              </div>
              <ArrowRight
                className="mt-2 size-4 text-gold-deep transition-transform duration-200 group-hover:translate-x-1 sm:mt-4 sm:size-5"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Tanlangan atirlar */}
      {featured.length > 0 ? (
        <section className="mx-auto max-w-[1280px] px-4 pb-5 sm:px-6 md:pb-10">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-serif text-xl text-foreground md:text-3xl">
              {t('home.featured')}
            </h2>
            <Link
              href="/katalog"
              className="inline-flex min-h-11 items-center whitespace-nowrap text-sm text-muted-deep underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {t('home.seeAll')}
            </Link>
          </div>

          {/* Avtomatik aylanadigan qator: mobilda swipe, desktopda o'qlar */}
          <ProductCarousel products={featured} />
        </section>
      ) : null}

      {/* Brendlar */}
      {brands.length > 0 ? (
        <section className="mx-auto max-w-[1280px] px-4 pb-5 sm:px-6 md:pb-10">
          <h2 className="font-serif text-xl text-foreground md:text-3xl">
            {t('home.brands')}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2 md:mt-6 md:gap-3">
            {brands.map((brand) => (
              <li key={brand.slug}>
                <Link
                  href={`/katalog?brend=${brand.slug}`}
                  // min-w-14: nomi juda qisqa brend (1-2 harf) chipni
                  // 44px dan tor qilib yuborardi — bosish maydoni
                  // mazmunga bog'liq bo'lib qolmasligi kerak
                  className="flex min-h-11 min-w-11 items-center justify-center gap-2.5 rounded-xl border border-border bg-card px-3 transition-colors duration-200 hover:border-gold md:min-h-14 md:px-4"
                >
                  {brand.logoUrl ? (
                    <Image
                      // Chetidagi bo'sh joy kesilgan, kvadratga
                      // keltirilgan ko'rinish — `lib/cloudinary-url.js`
                      src={brandLogoUrl(brand.logoUrl)}
                      alt=""
                      // size-8 (32px) joy uchun DPR 3 da 96px kerak
                      width={64}
                      height={64}
                      // rounded-md: qora fonli logotipning o'tkir
                      // burchaklari dumaloq kartochkaga urilib turardi
                      className="size-8 rounded-md object-contain"
                    />
                  ) : null}
                  <span className="text-sm font-medium text-card-foreground">
                    {brand.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Nega biz */}
      {/*
        Telefonda belgi chapda, matn o'ngda — ixcham qatorlar (avval har
        biri baland kartochka, jami ~330px edi). sm dan boshlab kartochka.
      */}
      <section className="mx-auto max-w-[1280px] px-4 pb-6 sm:px-6 md:pb-14">
        <div className="grid gap-2 sm:grid-cols-3 sm:gap-4">
          {advantages.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="flex gap-3 rounded-xl border border-border bg-card p-3 sm:block sm:p-5"
            >
              <Icon className="mt-0.5 size-5 shrink-0 text-gold-deep sm:size-6" aria-hidden="true" />
              <div>
                <h3 className="font-serif text-base text-card-foreground sm:mt-4 sm:text-xl">{title}</h3>
                <p className="mt-0.5 text-xs text-muted-deep sm:mt-2 sm:text-sm">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
