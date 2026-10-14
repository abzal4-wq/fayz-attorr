import { SizesManager } from '@/components/admin/sizes-manager'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Hajmlar' }

export default async function SizesPage() {
  const rows = await prisma.size.findMany({
    orderBy: [{ sortOrder: 'asc' }, { valueMl: 'asc' }],
    include: { _count: { select: { variants: true } } },
  })

  const sizes = rows.map((s) => ({
    id: s.id,
    valueMl: s.valueMl,
    label: s.label,
    sortOrder: s.sortOrder,
    isActive: s.isActive,
    variantCount: s._count.variants,
  }))

  return <SizesManager sizes={sizes} />
}
