import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { ProductCard } from '@/components/site/product-card'
import { getFeaturedProducts, getHomeBrands } from '@/lib/catalog'
import { getStoreSettings } from '@/lib/settings'

const categories = [
  {
    href: '/katalog?gender=WOMEN',
    label: 'Ayollar uchun',
    description: 'Nozik va shirin notalar',
  },
  {
    href: '/katalog?gender=MEN',
    label: 'Erkaklar uchun',
    description: 'Keskin va chuqur hidlar',
  },
  {
    href: '/katalog?gender=UNISEX',
    label: 'Unisex',
    description: 'Hammaga mos kombinatsiyalar',
  },
]

export default async function HomePage() {
  const [featured, brands, settings] = await Promise.all([
    getFeaturedProducts(10),
    getHomeBrands(12),
    getStoreSettings(),
  ])

  const advantages = [
    {
      icon: ShieldCheck,
      title: 'Original mahsulot',
      text: "Har bir atir rasmiy yetkazib beruvchilardan keladi.",
    },
    {
      icon: Truck,
      title:
        settings.deliveryPrice === 0 ? 'Bepul yetkazib berish' : 'Tez yetkazib berish',
      text:
        settings.deliveryInfo ||
        "Toshkent shahri va viloyati bo'ylab 1–3 kun ichida.",
    },
    {
      icon: Sparkles,
      title: 'Keng tanlov',
      text: "Turli hajmlar — har biriga alohida narx. O'zingizga mosini tanlang.",
    },
  ]

  return (
    <main>
      {/* Hero */}
      <section className="dark relative overflow-hidden text-foreground">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              'linear-gradient(160deg, #0D454E 0%, #0A3942 55%, #072B32 100%)',
          }}
        />
        <div className="mx-auto flex max-w-[1280px] flex-col items-center px-4 py-16 text-center sm:px-6 md:py-24">
          <Image
            src="/monogram.png"
            alt=""
            width={200}
            height={200}
            priority
            className="h-20 w-20 rounded-2xl md:h-24 md:w-24"
          />
          <h1 className="mt-8 font-serif text-4xl font-semibold text-ivory md:text-6xl">
            Fayz Attor
          </h1>
          <p className="mt-3 text-sm uppercase tracking-[0.18em] text-muted-on-dark">
            Original atirlar
          </p>
          <p className="mt-6 max-w-xl text-pretty text-muted-on-dark">
            Ayollar, erkaklar va unisex atirlar. Har bir atir uchun bir nechta
            hajm va alohida narx.
          </p>

          <Link
            href="/katalog"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light"
          >
            Katalogni ko'rish
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Kategoriyalar */}
      <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6">
        <h2 className="font-serif text-2xl text-foreground md:text-3xl">
          Kategoriyalar
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group flex min-h-32 flex-col justify-between rounded-xl border border-border bg-card p-5 transition-colors duration-200 hover:border-gold"
            >
              <div>
                <p className="font-serif text-xl text-card-foreground">{c.label}</p>
                <p className="mt-1 text-sm text-muted-deep">{c.description}</p>
              </div>
              <ArrowRight
                className="mt-4 size-5 text-gold-deep transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Tanlangan atirlar */}
      {featured.length > 0 ? (
        <section className="mx-auto max-w-[1280px] px-4 pb-12 sm:px-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-serif text-2xl text-foreground md:text-3xl">
              Tanlangan atirlar
            </h2>
            <Link
              href="/katalog"
              className="whitespace-nowrap text-sm text-muted-deep underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Barchasi
            </Link>
          </div>

          {/* Gorizontal slider: mobilda swipe, desktopda ham scroll */}
          <ul className="-mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {featured.map((product, index) => (
              <li
                key={product.id}
                className="w-[45%] shrink-0 snap-start sm:w-[30%] lg:w-[23%]"
              >
                <ProductCard product={product} priority={index < 2} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Brendlar */}
      {brands.length > 0 ? (
        <section className="mx-auto max-w-[1280px] px-4 pb-12 sm:px-6">
          <h2 className="font-serif text-2xl text-foreground md:text-3xl">Brendlar</h2>
          <ul className="mt-6 flex flex-wrap gap-3">
            {brands.map((brand) => (
              <li key={brand.slug}>
                <Link
                  href={`/katalog?brend=${brand.slug}`}
                  className="flex min-h-14 items-center gap-2.5 rounded-xl border border-border bg-card px-4 transition-colors duration-200 hover:border-gold"
                >
                  {brand.logoUrl ? (
                    <Image
                      src={brand.logoUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="size-8 object-contain"
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
      <section className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {advantages.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-5">
              <Icon className="size-6 text-gold-deep" aria-hidden="true" />
              <h3 className="mt-4 font-serif text-xl text-card-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-deep">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
