import { Suspense } from 'react'
import { CatalogFilters, CatalogSort } from '@/components/site/catalog-filters'
import { CatalogGrid } from '@/components/site/catalog-grid'
import { CatalogSearch } from '@/components/site/catalog-search'
import { ProductCardSkeleton } from '@/components/site/product-card'
import { getCatalogProducts, getFilterOptions } from '@/lib/catalog'
import { parseCatalogParams } from '@/lib/catalog-params'
import { getT } from '@/lib/i18n/server'

export async function generateMetadata({ searchParams }) {
  const [params, t] = await Promise.all([searchParams, getT()])
  const { gender } = parseCatalogParams(params)

  return {
    title: gender
      ? t('meta.catalogGenderTitle', { gender: t(`gender.${gender}`) })
      : t('meta.catalogTitle'),
    description: t('meta.catalogDescription'),
  }
}

function GridSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i}>
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  )
}

async function CatalogContent({ filters }) {
  const [{ products, total, hasMore }, options, t] = await Promise.all([
    getCatalogProducts(filters),
    getFilterOptions(),
    getT(),
  ])

  return (
    <div className="mx-auto flex max-w-[1280px] gap-8 px-4 py-6 sm:px-6">
      {/*
        Filtr paneli DOM'da h1 dan KEYIN turadi, ko'rinishda esa chapda —
        `lg:order-first` shuni ta'minlaydi.

        Nega: panel sarlavhasi <h2>, sahifaniki <h1>. Avval panel oldinda
        edi va hujjat h2 bilan boshlanardi — ekran o'quvchi sahifa
        sarlavhasini topa olmasdi (Lighthouse "heading-order" buzilishi).
        Ko'rinish o'zgarmaydi, tartib esa to'g'rilanadi.
      */}
      <div className="min-w-0 flex-1">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl text-foreground md:text-3xl">
              {filters.gender
                ? t(`genderFor.${filters.gender}`)
                : t('catalog.title')}
            </h1>
            {/*
              Qidirganda ikkala ma'lumot ham kerak: nima izlangani va
              nechta topilgani. Faqat biri ko'rsatilsa, foydalanuvchi
              yo so'rovini, yo natija hajmini bilmay qoladi.
            */}
            {filters.query ? (
              <p className="mt-1 text-sm text-muted-deep">
                {t('catalog.searchFor', { q: filters.query })}
              </p>
            ) : null}
            <p className="mt-1 text-sm text-muted-deep">
              {t('catalog.count', { n: total })}
            </p>
          </div>

          <CatalogSort filters={filters} />
        </div>

        {/*
          Ko'rinmas sarlavha, lekin kerak: kartochka nomlari <h3>, sahifa
          sarlavhasi <h1> — oradagi <h2> bo'lmasa daraja sakrab ketadi va
          ekran o'quvchi tuzilmani noto'g'ri o'qiydi.
        */}
        <h2 className="sr-only">{t('catalog.resultsHeading')}</h2>

        <CatalogGrid
          initialProducts={products}
          initialHasMore={hasMore}
          filters={filters}
        />
      </div>

      <CatalogFilters filters={filters} options={options} total={total} />
    </div>
  )
}

export default async function CatalogPage({ searchParams }) {
  const params = await searchParams
  const filters = parseCatalogParams(params)

  // Filtr o'zgarganda skeleton ko'rsatiladi (spinner emas).
  // key — filtrlar o'zgarsa Suspense qayta ishga tushsin.
  const key = JSON.stringify(filters)

  return (
    <main className="pb-16">
      {/*
        Qidiruv maydoni Suspense'dan TASHQARIDA. Ichida bo'lganida har
        qidiruvda `key` o'zgarib, maydon ham skeleton bilan almashtirilardi:
        fokus yo'qolib, odam yozishda davom etsa harflar hech qayerga
        tushmasdi (brauzer tekshiruvi topgan). Endi faqat natijalar
        qayta yuklanadi, maydon joyida qoladi.

        Saralash bilan bir qatorda emas, alohida: telefonda ikkisi
        sig'masdi va maydon 44px dan tor bo'lib qolardi.
      */}
      <div className="mx-auto max-w-[1280px] px-4 pt-6 sm:px-6">
        <CatalogSearch filters={filters} />
      </div>

      <Suspense
        key={key}
        fallback={
          <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
            <GridSkeleton />
          </div>
        }
      >
        <CatalogContent filters={filters} />
      </Suspense>
    </main>
  )
}
