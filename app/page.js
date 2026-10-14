import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck, Sparkles, Truck } from 'lucide-react'

const categories = [
  { href: '/katalog?gender=women', label: 'Ayollar uchun' },
  { href: '/katalog?gender=men', label: 'Erkaklar uchun' },
  { href: '/katalog?gender=unisex', label: 'Unisex' },
]

const advantages = [
  {
    icon: ShieldCheck,
    title: 'Original mahsulot',
    text: "Har bir atir to'g'ridan-to'g'ri rasmiy yetkazib beruvchilardan keladi.",
  },
  {
    icon: Truck,
    title: 'Bepul yetkazib berish',
    text: "Toshkent shahri va viloyati bo'ylab 1–3 kun ichida, to'lovsiz.",
  },
  {
    icon: Sparkles,
    title: 'Keng tanlov',
    text: "Turli hajmlar — 10 ml dan 100 ml gacha, har biriga alohida narx.",
  },
]

export default function HomePage() {
  return (
    <main className="dark min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden">
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
            alt="Fayz Attor"
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
            hajm va alohida narx — o'zingizga mosini tanlang.
          </p>

          <Link
            href="/katalog"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light"
          >
            Katalogni ko'rish
          </Link>
        </div>
      </section>

      {/* Kategoriyalar */}
      <section className="mx-auto max-w-[1280px] px-4 pb-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="flex min-h-24 items-center justify-center rounded-xl border border-border bg-card px-4 text-center font-serif text-xl text-card-foreground transition-colors duration-200 hover:border-gold"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Nega biz */}
      <section className="mx-auto max-w-[1280px] px-4 pb-20 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {advantages.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl bg-card p-6">
              <Icon className="size-6 text-gold" aria-hidden="true" />
              <h2 className="mt-4 font-serif text-xl text-card-foreground">
                {title}
              </h2>
              <p className="mt-2 text-sm text-muted-on-dark">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
