'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ImageOff } from 'lucide-react'
import { useMoney, useT } from '@/lib/i18n/client'

/**
 * Katalog va sliderdagi atir kartochkasi.
 *
 * DIQQAT: bu komponent uzun, scroll qilinadigan ro'yxatlarda ishlatiladi —
 * shuning uchun shisha/blur YO'Q, qattiq fon. Hover effekti faqat
 * desktopda (mobil grid'da u baribir ishlamaydi, lekin rangni "yopishib"
 * qoldiradi).
 *
 * 'use client' ataylab: kartochka ham server sahifasida (bosh sahifa),
 * ham client komponentida (katalog gridi, cheksiz scroll) ishlatiladi.
 * Client bo'lgani uchun ikkala joyda `useT` bir xil ishlaydi — SSR
 * baribir HTML qaytaradi, SEO yo'qolmaydi.
 */
export function ProductCard({ product, priority = false }) {
  const t = useT()
  const money = useMoney()

  const {
    slug,
    name,
    brandName,
    imageUrl,
    minPrice,
    maxPrice,
    oldMinPrice,
    maxDiscount,
    outOfStock,
  } = product

  const priceLabel =
    minPrice == null
      ? null
      : minPrice === maxPrice
        ? money(minPrice)
        : `${money(minPrice, { withSuffix: false })} – ${money(maxPrice)}`

  return (
    <Link
      href={`/atir/${slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-[box-shadow,transform] duration-200 lg:hover:-translate-y-0.5 lg:hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${brandName} ${name}`}
            width={400}
            height={400}
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageOff className="size-8 text-muted-foreground" aria-hidden="true" />
          </div>
        )}

        {maxDiscount > 0 && !outOfStock ? (
          <span className="absolute left-2 top-2 rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-white">
            −{maxDiscount}%
          </span>
        ) : null}

        {outOfStock ? (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-darker/60">
            <span className="rounded-full bg-brand-darker px-3 py-1.5 text-sm font-medium text-ivory">
              {t('common.outOfStock')}
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="text-xs text-muted-deep">{brandName}</p>
        <h3 className="mt-1 line-clamp-2 font-serif text-base leading-snug text-card-foreground sm:text-lg">
          {name}
        </h3>

        <div className="mt-auto pt-3">
          {priceLabel ? (
            <>
              {oldMinPrice ? (
                <p className="text-xs text-muted-deep line-through">
                  {money(oldMinPrice)}
                </p>
              ) : null}
              <p className="font-bold text-gold-deep">{priceLabel}</p>
            </>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

/** Yuklanayotgan paytdagi skeleton (spinner ishlatilmaydi). */
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="skeleton aspect-square" />
      <div className="space-y-2 p-3">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton mt-3 h-5 w-1/2 rounded" />
      </div>
    </div>
  )
}
