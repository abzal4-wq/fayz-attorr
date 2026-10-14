import { Suspense } from 'react'
import { ProductsList } from '@/components/admin/products-list'
import { prisma } from '@/lib/prisma'
import { toNumber } from '@/lib/admin-api'
import { formatSom, priceAfterDiscount } from '@/lib/format'

export const metadata = { title: 'Atirlar' }

/** Variantlardan ko'rsatiladigan narx oralig'ini yasaydi. */
function priceRange(variants) {
  if (variants.length === 0) return null

  const prices = variants.map((v) =>
    priceAfterDiscount(toNumber(v.price), v.discountPercent)
  )
  const min = Math.min(...prices)
  const max = Math.max(...prices)

  return min === max
    ? formatSom(min)
    : `${formatSom(min, { withSuffix: false })} – ${formatSom(max)}`
}

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams
  const q = params?.q?.trim() || ''
  const brand = params?.brand || ''
  const gender = params?.gender || ''

  const where = {
    ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
    ...(brand ? { brandId: brand } : {}),
    ...(gender ? { gender } : {}),
  }

  const [rows, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        brand: { select: { name: true } },
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        variants: true,
      },
    }),
    prisma.brand.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true },
    }),
  ])

  const products = rows.map((p) => ({
    id: p.id,
    name: p.name,
    brandName: p.brand.name,
    gender: p.gender,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    imageUrl: p.images[0]?.url ?? null,
    priceRange: priceRange(p.variants),
    allOutOfStock:
      p.variants.length > 0 && p.variants.every((v) => !v.inStock || v.stockQty <= 0),
  }))

  return (
    <Suspense fallback={null}>
      <ProductsList
        products={products}
        brands={brands}
        filters={{ q, brand, gender }}
      />
    </Suspense>
  )
}
