import { BrandsManager } from '@/components/admin/brands-manager'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Brendlar' }

export default async function BrandsPage() {
  const rows = await prisma.brand.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: true } } },
  })

  const brands = rows.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    logoUrl: b.logoUrl,
    sortOrder: b.sortOrder,
    isActive: b.isActive,
    productCount: b._count.products,
  }))

  return <BrandsManager brands={brands} />
}
