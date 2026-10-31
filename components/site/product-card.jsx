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

  /*
   * Bir nechta hajm bo'lsa — "185 000 so'mdan", oraliq EMAS. Oraliq
   * ("185 000 – 2 682 000 so'm") tor kartochkada ikki qatorga tushib,
   * butun qatorni balandlatardi. To'liq narxlar atir sahifasida.
   */
  const priceLabel =
    minPrice == null
      ? null
      : minPrice === maxPrice
        ? money(minPrice)
        : t('common.priceFrom', { price: money(minPrice) })

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
          <span className="absolute left-1.5 top-1.5 rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-white sm:left-2 sm:top-2 sm:px-2.5 sm:py-1">
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

      {/*
        Telefonda ixcham: ikki qator kartochka (4 ta atir) bitta ekranga
        sig'ishi kerak (foydalanuvchi talabi). Rasm kvadrat qoladi —
        kesilsa flakon qopqog'i qirqilardi; qisqargani rasm ostidagi qism.
      */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <p className="truncate text-xs text-muted-deep">{brandName}</p>
        {/*
          Telefonda nom BITTA qator: ikki qatorli nom + chegirma narxi
          kartochkani 276px qilib, 360px ekranga ikki qator sig'masdi.
          To'liq nom ekran o'quvchiga baribir o'qiladi (faqat ko'rinish
          qirqiladi) va atir sahifasida turadi.
        */}
        <h3 className="mt-0.5 line-clamp-1 font-serif text-[15px] leading-tight text-card-foreground sm:mt-1 sm:line-clamp-2 sm:text-lg sm:leading-snug">
          {name}
        </h3>

        {priceLabel ? (
          // Eski narx yangisining YONIDA (sig'masa keyingi qatorga o'tadi):
          // avval alohida qatorda turib kartochkani 16px balandlatardi
          <p className="mt-auto flex flex-wrap items-baseline gap-x-1.5 pt-1.5 sm:pt-3">
            <span className="text-sm font-bold text-gold-deep sm:text-base">
              {priceLabel}
            </span>
            {oldMinPrice ? (
              <span className="text-xs text-muted-deep line-through">
                {money(oldMinPrice, { withSuffix: false })}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
    </Link>
  )
}

/** Yuklanayotgan paytdagi skeleton (spinner ishlatilmaydi). */
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="skeleton aspect-square" />
      <div className="space-y-2 p-2.5 sm:p-3">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-5 w-2/3 rounded" />
      </div>
    </div>
  )
}
