import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { ProductGallery } from '@/components/site/product-gallery'
import { ProductPurchase } from '@/components/site/product-purchase'
import { ProductCard } from '@/components/site/product-card'
import {
  getProductBySlug,
  getSimilarProducts,
  incrementViewCount,
} from '@/lib/catalog'
import { GENDER_LABELS } from '@/lib/format'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) return { title: 'Atir topilmadi' }

  return {
    title: `${product.name} — ${product.brandName}`,
    description:
      product.shortDescription ||
      `${product.brandName} ${product.name}. Original atir, turli hajmlar.`,
    openGraph: {
      title: `${product.name} — ${product.brandName}`,
      images: product.images[0]?.url ? [product.images[0].url] : [],
    },
  }
}

export default async function ProductPage({ params }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  // Nofaol atir yoki nofaol brendniki — to'g'ridan-to'g'ri URL bilan ham 404
  if (!product) notFound()

  const similar = await getSimilarProducts(product, 8)

  // Statistika; sahifa renderini kutib turmaydi
  incrementViewCount(product.id)

  return (
    <main className="pb-16">
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
        {/* Yo'l ko'rsatkich */}
        <nav aria-label="Yo'l" className="mb-5 flex flex-wrap items-center gap-1 text-sm">
          <Link
            href="/katalog"
            className="text-muted-deep underline-offset-4 hover:text-foreground hover:underline"
          >
            Katalog
          </Link>
          <ChevronRight className="size-3.5 text-muted-deep" aria-hidden="true" />
          <Link
            href={`/katalog?gender=${product.gender}`}
            className="text-muted-deep underline-offset-4 hover:text-foreground hover:underline"
          >
            {GENDER_LABELS[product.gender]}
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
              className="text-sm text-muted-deep underline-offset-4 hover:text-foreground hover:underline"
            >
              {product.brandName}
            </Link>

            <h1 className="mt-1 font-serif text-3xl text-foreground md:text-4xl">
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
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-foreground">
                  To'liq tavsif
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
              O'xshash atirlar
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
