import { Suspense } from 'react'
import { CatalogFilters, CatalogSort } from '@/components/site/catalog-filters'
import { CatalogGrid } from '@/components/site/catalog-grid'
import { ProductCardSkeleton } from '@/components/site/product-card'
import { getCatalogProducts, getFilterOptions } from '@/lib/catalog'
import { parseCatalogParams } from '@/lib/catalog-params'
import { GENDER_LABELS } from '@/lib/format'

export async function generateMetadata({ searchParams }) {
  const params = await searchParams
  const { gender } = parseCatalogParams(params)

  return {
    title: gender ? `${GENDER_LABELS[gender]} uchun atirlar` : 'Katalog',
    description:
      "Fayz Attor katalogi: original atirlar, turli hajmlar va narxlar. Brend, hajm va narx bo'yicha filtrlang.",
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
  const [{ products, total, hasMore }, options] = await Promise.all([
    getCatalogProducts(filters),
    getFilterOptions(),
  ])

  return (
    <div className="mx-auto flex max-w-[1280px] gap-8 px-4 py-6 sm:px-6">
      <CatalogFilters filters={filters} options={options} total={total} />

      <div className="min-w-0 flex-1">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl text-foreground md:text-3xl">
              {filters.gender ? `${GENDER_LABELS[filters.gender]} uchun` : 'Katalog'}
            </h1>
            <p className="mt-1 text-sm text-muted-deep">{total} ta atir</p>
          </div>

          <CatalogSort filters={filters} />
        </div>

        <CatalogGrid
          initialProducts={products}
          initialHasMore={hasMore}
          filters={filters}
        />
      </div>
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
