import Link from 'next/link'
import { ProductForm } from '@/components/admin/product-form'
import { EmptyState } from '@/components/admin/display'
import { prisma } from '@/lib/prisma'
import { Tags } from 'lucide-react'

export const metadata = { title: 'Yangi atir' }

export default async function NewProductPage() {
  const [brands, sizes] = await Promise.all([
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true },
    }),
    prisma.size.findMany({
      orderBy: [{ sortOrder: 'asc' }, { valueMl: 'asc' }],
      select: { id: true, label: true, isActive: true },
    }),
  ])

  // Atir qo'shish uchun avval brend va hajm bo'lishi shart
  if (brands.length === 0 || sizes.length === 0) {
    return (
      <EmptyState
        icon={Tags}
        title="Avval brend va hajm qo'shing"
        description={
          brands.length === 0
            ? "Atir brendga biriktiriladi, lekin hali birorta faol brend yo'q."
            : "Atir narxi hajmga bog'liq, lekin hali birorta hajm yo'q."
        }
        action={
          <Link
            href={brands.length === 0 ? '/admin/brendlar' : '/admin/hajmlar'}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-gold-light"
          >
            {brands.length === 0 ? 'Brendlarga o\'tish' : 'Hajmlarga o\'tish'}
          </Link>
        }
      />
    )
  }

  return <ProductForm brands={brands} sizes={sizes} />
}
