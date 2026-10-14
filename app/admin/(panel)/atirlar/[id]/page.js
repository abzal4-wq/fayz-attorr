import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/admin/product-form'
import { prisma } from '@/lib/prisma'
import { toNumber } from '@/lib/admin-api'

export const metadata = { title: 'Atirni tahrirlash' }

export default async function EditProductPage({ params }) {
  const { id } = await params

  const [row, brands, sizes] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { include: { size: true } },
      },
    }),
    prisma.brand.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true },
    }),
    prisma.size.findMany({
      orderBy: [{ sortOrder: 'asc' }, { valueMl: 'asc' }],
      select: { id: true, label: true, isActive: true },
    }),
  ])

  if (!row) notFound()

  const product = {
    id: row.id,
    name: row.name,
    brandId: row.brandId,
    gender: row.gender,
    shortDescription: row.shortDescription,
    description: row.description,
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    images: row.images.map((img) => ({ publicId: img.publicId, url: img.url })),
    variants: row.variants
      .sort((a, b) => a.size.sortOrder - b.size.sortOrder)
      .map((v) => ({
        sizeId: v.sizeId,
        price: toNumber(v.price),
        discountPercent: v.discountPercent,
        stockQty: v.stockQty,
        inStock: v.inStock,
        sku: v.sku ?? '',
      })),
  }

  return <ProductForm product={product} brands={brands} sizes={sizes} />
}
