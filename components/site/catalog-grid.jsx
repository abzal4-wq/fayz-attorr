'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { SearchX } from 'lucide-react'
import Link from 'next/link'
import { ProductCard, ProductCardSkeleton } from './product-card'
import { buildCatalogQuery } from '@/lib/catalog-params'
import { useT } from '@/lib/i18n/client'

/**
 * Cheksiz scroll: mobil uchun paginationdan qulayroq.
 *
 * Birinchi sahifa serverda render qilingan holda keladi — SEO va birinchi
 * ko'rinish tezligi uchun. Davomi IntersectionObserver orqali yuklanadi,
 * tugma ham qoldirilgan (observer ishlamasa yoki klaviatura bilan).
 */
export function CatalogGrid({ initialProducts, initialHasMore, filters }) {
  const t = useT()
  const [products, setProducts] = useState(initialProducts)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const sentinelRef = useRef(null)

  // Filtr o'zgarsa ro'yxat noldan boshlanadi
  useEffect(() => {
    setProducts(initialProducts)
    setHasMore(initialHasMore)
    setPage(1)
    setError(null)
  }, [initialProducts, initialHasMore])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    setError(null)

    const nextPage = page + 1
    const query = buildCatalogQuery({ ...filters, page: nextPage })

    try {
      const res = await fetch(`/api/katalog?${query}`)
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error('load failed')

      setProducts((prev) => [...prev, ...data.products])
      setHasMore(data.hasMore)
      setPage(nextPage)
    } catch {
      setError(t('catalog.loadError'))
    } finally {
      setLoading(false)
    }
  }, [filters, hasMore, loading, page, t])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '400px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  if (products.length === 0) {
    return (
      /*
        min-h-[60vh] ataylab: yuklanayotganda o'rnida 8 ta skeleton
        kartochka turadi (taxminan 1000px). Natija bo'sh chiqsa, bu
        joy birdan qisqarib, ostidagi hamma narsa yuqoriga sakrardi —
        Lighthouse CLS 0.151 ko'rsatgan edi. Bo'sh katalog ayni
        ochilish kunidagi holat, filtr hech narsa topmaganda ham shu.
      */
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-10 text-center md:py-16">
        <SearchX className="size-8 text-muted-deep" aria-hidden="true" />
        <p className="mt-4 font-serif text-xl text-foreground">
          {t('catalog.emptyTitle')}
        </p>
        <p className="mt-2 max-w-sm text-sm text-muted-deep">
          {t('catalog.emptyText')}
        </p>
        <Link
          href="/katalog"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light"
        >
          {t('catalog.emptyAction')}
        </Link>
      </div>
    )
  }

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product, index) => (
          <li key={product.id}>
            <ProductCard product={product} priority={index < 4} />
          </li>
        ))}

        {loading
          ? Array.from({ length: 4 }, (_, i) => (
              <li key={`skeleton-${i}`}>
                <ProductCardSkeleton />
              </li>
            ))
          : null}
      </ul>

      {error ? (
        <p role="alert" className="mt-6 text-center text-sm text-danger-deep">
          {error}
        </p>
      ) : null}

      {hasMore ? (
        <div ref={sentinelRef} className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="min-h-12 rounded-lg border border-border px-6 text-sm font-semibold text-foreground transition-colors duration-200 hover:border-brand-mid disabled:opacity-60"
          >
            {loading ? t('common.loading') : t('catalog.loadMore')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
