import { NextResponse } from 'next/server'
import { getCatalogProducts } from '@/lib/catalog'
import { parseCatalogParams } from '@/lib/catalog-params'

/**
 * Katalogning keyingi sahifalari (cheksiz scroll uchun).
 * Birinchi sahifa serverda render qilinadi — bu route faqat davomi uchun.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const filters = parseCatalogParams(Object.fromEntries(searchParams))

  const { products, total, hasMore } = await getCatalogProducts(filters)

  return NextResponse.json({ ok: true, products, total, hasMore })
}
