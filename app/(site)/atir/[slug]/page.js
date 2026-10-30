import Link from 'next/link'
import { notFound } from 'next/navigation'
import { after } from 'next/server'
import { ChevronRight } from 'lucide-react'
import { ProductGallery } from '@/components/site/product-gallery'
import { ProductPurchase } from '@/components/site/product-purchase'
import { ProductCard } from '@/components/site/product-card'
import {
  getProductBySlug,
  getSimilarProducts,
  incrementViewCount,
} from '@/lib/catalog'
import { getT } from '@/lib/i18n/server'

export async function generateMetadata({ params }) {
  const [{ slug }, t] = await Promise.all([params, getT()])
  const product = await getProductBySlug(slug)

  if (!product) return { title: t('meta.productNotFound') }

  return {
    title: `${product.name} — ${product.brandName}`,
    description:
      product.shortDescription ||
      t('meta.productDescription', {
        brand: product.brandName,
        name: product.name,
      }),
    openGraph: {
      title: `${product.name} — ${product.brandName}`,
      images: product.images[0]?.url ? [product.images[0].url] : [],
    },
  }
}

export default async function ProductPage({ params }) {
  const [{ slug }, t] = await Promise.all([params, getT()])
  const product = await getProductBySlug(slug)

  // Nofaol atir yoki nofaol brendniki — to'g'ridan-to'g'ri URL bilan ham 404
  if (!product) notFound()

  const similar = await getSimilarProducts(product, 8)

  /*
   * Ko'rishlar soni javob YUBORILGANDAN KEYIN yoziladi (after).
   *
   * Avval chaqiruv shunchaki kutilmasdan qoldirilgan edi. Vercel'da
   * serverless funksiya javobdan keyin "muzlatiladi", ya'ni kutilmagan
   * so'rov yarim yo'lda to'xtab, son yo'qolishi mumkin edi. `after`
   * uni kafolatlaydi va sahifa baribir bazani kutmaydi — uxlab yotgan
   * bazani uyg'otish mijozning vaqtidan ketmaydi.
   */
  after(() => incrementViewCount(product.id))

  return (
    <main className="pb-16">
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
        {/* Yo'l ko'rsatkich */}
        <nav
          aria-label={t('product.breadcrumb')}
          className="mb-5 flex flex-wrap items-center gap-1 text-sm"
        >
          <Link
            href="/katalog"
            className="inline-flex min-h-11 items-center text-muted-deep underline-offset-4 hover:text-foreground hover:underline"
          >
            {t('catalog.title')}
          </Link>
          <ChevronRight className="size-3.5 text-muted-deep" aria-hidden="true" />
          <Link
            href={`/katalog?gender=${product.gender}`}
            className="inline-flex min-h-11 items-center text-muted-deep underline-offset-4 hover:text-foreground hover:underline"
          >
            {t(`gender.${product.gender}`)}
          </Link>
          <ChevronRight className="size-3.5 text-muted-deep" aria-hidden="true" />
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          <ProductGallery
            images={product.images}
            alt={`${product.brandName} ${product.name}`}
          />

          <div>
            <Link
              href={`/katalog?brend=${product.brandSlug}`}
              className="inline-flex min-h-11 items-center text-sm text-muted-deep underline-offset-4 hover:text-foreground hover:underline"
            >
              {product.brandName}
            </Link>

            <h1 className="font-serif text-3xl text-foreground md:text-4xl">
              {product.name}
            </h1>

            {product.shortDescription ? (
              <p className="mt-3 text-pretty text-muted-deep">
                {product.shortDescription}
              </p>
            ) : null}

            <div className="mt-7">
              <ProductPurchase product={product} />
            </div>

            {product.description ? (
              <details className="group mt-8 border-t border-border pt-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-medium text-foreground">
                  {t('product.fullDescription')}
                  <ChevronRight
                    className="size-4 transition-transform duration-200 group-open:rotate-90"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-3 whitespace-pre-wrap text-pretty text-muted-deep">
                  {product.description}
                </p>
              </details>
            ) : null}
          </div>
        </div>

        {similar.length > 0 ? (
          <section className="mt-16">
            <h2 className="font-serif text-2xl text-foreground md:text-3xl">
              {t('product.similar')}
            </h2>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {similar.map((item) => (
                <li key={item.id}>
                  <ProductCard product={item} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  )
}
