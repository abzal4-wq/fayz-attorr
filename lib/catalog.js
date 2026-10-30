import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { toNumber } from '@/lib/admin-api'
import { CACHE_SECONDS } from '@/lib/cache'
import { escapeLike, isCacheableCatalogView } from '@/lib/catalog-params'

export const PER_PAGE = 12

/**
 * Saralash qanday SQL tartibiga aylanadi. Nomlari lug'atda
 * (`catalog.sortNew` va h.k.) — bu yerda faqat mantiq.
 */
export const SORT_OPTIONS = {
  yangi: { orderBy: { createdAt: 'desc' } },
  arzon: { orderBy: null }, // narx bo'yicha — pastda qo'lda saralanadi
  qimmat: { orderBy: null },
  ommabop: { orderBy: { viewCount: 'desc' } },
}

/**
 * Saytda ko'rinadigan atirning sharti.
 *
 * - `isActive: false` atir hech qayerda ko'rinmaydi (katalog, qidiruv, URL)
 * - Nofaol brendning atirlari ham yashiriladi: brend toggle'i
 *   "nofaol brend saytda ko'rinmaydi" deb va'da qiladi
 * - Varianti yo'q atir ko'rsatilmaydi — narxi bo'lmaydi
 */
export const VISIBLE_PRODUCT = {
  isActive: true,
  brand: { isActive: true },
  variants: { some: {} },
}

/** Bitta atirni ro'yxat uchun sodda ko'rinishga keltiradi. */
function toCardProduct(product) {
  const variants = product.variants ?? []
  const finals = variants.map((v) => toNumber(v.finalPrice))

  // Kartochkada eng arzon variantning narxi ko'rsatiladi. Chizilgan eski
  // narx AYNAN O'SHA variantning chegirmasiz narxi bo'lishi kerak — boshqa
  // variantnikini olsak, ikkita bog'liq bo'lmagan raqam yonma-yon turadi
  // (masalan "120 000" ustidan chizilgan "120 000").
  const cheapest = variants.reduce(
    (best, v) =>
      best === null || toNumber(v.finalPrice) < toNumber(best.finalPrice) ? v : best,
    null
  )

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brandName: product.brand?.name ?? '',
    brandSlug: product.brand?.slug ?? '',
    gender: product.gender,
    imageUrl: product.images?.[0]?.url ?? null,
    minPrice: finals.length ? Math.min(...finals) : null,
    maxPrice: finals.length ? Math.max(...finals) : null,
    // Chizilgan eski narx — faqat eng arzon variantda chegirma bo'lsa
    oldMinPrice:
      cheapest && cheapest.discountPercent > 0 ? toNumber(cheapest.price) : null,
    maxDiscount: variants.reduce((max, v) => Math.max(max, v.discountPercent), 0),
    outOfStock: variants.every((v) => !v.inStock || v.stockQty <= 0),
  }
}

const CARD_INCLUDE = {
  brand: { select: { name: true, slug: true } },
  images: { orderBy: { sortOrder: 'asc' }, take: 1 },
  variants: {
    select: {
      price: true,
      finalPrice: true,
      discountPercent: true,
      inStock: true,
      stockQty: true,
    },
  },
}

/** URL query parametrlaridan Prisma `where` yasaydi. */
function buildWhere({
  gender,
  brandSlugs,
  sizeMl,
  minPrice,
  maxPrice,
  onlyDiscount,
  query,
}) {
  const where = { ...VISIBLE_PRODUCT }

  /*
   * Qidiruv: har bir SO'Z alohida shart bo'lib, hammasi bajarilishi
   * kerak (AND), lekin har biri atir nomida YOKI brend nomida
   * topilishi mumkin (OR).
   *
   * NEGA SO'ZLARGA BO'LINADI: odam odatda "dior sauvage" deb yozadi,
   * ya'ni brend + nom. Butun satrni bitta `contains` bilan izlasak,
   * bazada "Sauvage" nomli (brendi "Dior") atir topilmasdi — chunki
   * hech bir ustunda "dior sauvage" ketma-ketligi yo'q.
   *
   * Transliteratsiya (Chanel / Shanel) bu yerda yechilmaydi: unga
   * pg_trgm yoki qo'shimcha kutubxona kerak.
   */
  if (query) {
    where.AND = query.split(' ').map((raw) => {
      const word = escapeLike(raw)
      return {
        OR: [
          { name: { contains: word, mode: 'insensitive' } },
          { brand: { name: { contains: word, mode: 'insensitive' } } },
        ],
      }
    })
  }

  if (gender) where.gender = gender
  if (brandSlugs?.length) where.brand = { ...where.brand, slug: { in: brandSlugs } }

  // Hajm, narx va chegirma shartlari BITTA variantda birga bajarilishi kerak.
  // Aks holda "50ml bor" va "arzon variant bor" alohida variantlarga tushib,
  // filtrga mos kelmaydigan atir chiqib qolardi.
  const variantWhere = {}
  if (sizeMl?.length) variantWhere.size = { valueMl: { in: sizeMl } }
  if (onlyDiscount) variantWhere.discountPercent = { gt: 0 }
  if (minPrice != null || maxPrice != null) {
    variantWhere.finalPrice = {}
    if (minPrice != null) variantWhere.finalPrice.gte = minPrice
    if (maxPrice != null) variantWhere.finalPrice.lte = maxPrice
  }

  if (Object.keys(variantWhere).length > 0) {
    where.variants = { some: variantWhere }
  }

  return where
}

const loadCatalogView = unstable_cache(
  async (gender, onlyDiscount, sort, page) =>
    queryCatalogProducts({ gender, onlyDiscount, sort, page }),
  ['catalog-view'],
  { revalidate: CACHE_SECONDS, tags: ['catalog'] }
)

/**
 * Katalog sahifasi uchun atirlar.
 * Barcha filtrlash va saralash bazada bajariladi; asosiy ko'rinishlar
 * keshlanadi (isCacheableCatalogView).
 */
export function getCatalogProducts(params) {
  if (isCacheableCatalogView(params)) {
    return loadCatalogView(
      params.gender ?? null,
      Boolean(params.onlyDiscount),
      params.sort ?? 'yangi',
      params.page ?? 1
    )
  }
  return queryCatalogProducts(params)
}

async function queryCatalogProducts(params) {
  const { sort = 'yangi', page = 1 } = params
  const where = buildWhere(params)
  const skip = (page - 1) * PER_PAGE

  // Narx bo'yicha saralash variant ustuniga tegishli — Prisma buni
  // to'g'ridan-to'g'ri qila olmaydi, shuning uchun saralangan variant
  // ID'larini avval SQL bilan olamiz.
  if (sort === 'arzon' || sort === 'qimmat') {
    const direction = sort === 'arzon' ? 'asc' : 'desc'

    // Ikkala saralash ham atirning ENG PAST narxiga tayanadi — kartochkada
    // aynan shu narx ("...dan") ko'rinadi. Aks holda "qimmat" eng qimmat
    // variant bo'yicha saralanib, foydalanuvchi ko'rgan narx tartibi
    // buzilgandek tuyulardi.
    const ids = await prisma.product.findMany({
      where,
      select: {
        id: true,
        variants: {
          select: { finalPrice: true },
          orderBy: { finalPrice: 'asc' },
          take: 1,
        },
      },
    })

    ids.sort((a, b) => {
      const pa = toNumber(a.variants[0]?.finalPrice) ?? 0
      const pb = toNumber(b.variants[0]?.finalPrice) ?? 0
      return direction === 'asc' ? pa - pb : pb - pa
    })

    const total = ids.length
    const pageIds = ids.slice(skip, skip + PER_PAGE).map((p) => p.id)

    const rows = await prisma.product.findMany({
      where: { id: { in: pageIds } },
      include: CARD_INCLUDE,
    })

    // `in` tartibni saqlamaydi — qayta tartiblaymiz
    const byId = new Map(rows.map((r) => [r.id, r]))
    const products = pageIds.map((id) => toCardProduct(byId.get(id)))

    return { products, total, hasMore: skip + PER_PAGE < total }
  }

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: SORT_OPTIONS[sort]?.orderBy ?? SORT_OPTIONS.yangi.orderBy,
      skip,
      take: PER_PAGE,
      include: CARD_INCLUDE,
    }),
    prisma.product.count({ where }),
  ])

  return {
    products: rows.map(toCardProduct),
    total,
    hasMore: skip + PER_PAGE < total,
  }
}

/**
 * Filtr paneli uchun variantlar: brendlar, hajmlar, narx chegaralari.
 *
 * `unstable_cache` — so'rovlar orasida (muddati `lib/cache.js` da),
 * `cache` — bitta so'rov ichida takror chaqiruvlarga qarshi.
 */
const loadFilterOptions = unstable_cache(
  async () => {
    const [brands, sizes, priceBounds] = await Promise.all([
      prisma.brand.findMany({
        where: { isActive: true, products: { some: VISIBLE_PRODUCT } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: {
          name: true,
          slug: true,
          _count: { select: { products: { where: VISIBLE_PRODUCT } } },
        },
      }),
      prisma.size.findMany({
        where: { isActive: true, variants: { some: { product: VISIBLE_PRODUCT } } },
        orderBy: [{ sortOrder: 'asc' }, { valueMl: 'asc' }],
        select: { id: true, label: true, valueMl: true },
      }),
      prisma.productVariant.aggregate({
        where: { product: VISIBLE_PRODUCT },
        _min: { finalPrice: true },
        _max: { finalPrice: true },
      }),
    ])

    return {
      brands: brands.map((b) => ({
        name: b.name,
        slug: b.slug,
        count: b._count.products,
      })),
      sizes,
      minPrice: Math.floor(toNumber(priceBounds._min.finalPrice) ?? 0),
      maxPrice: Math.ceil(toNumber(priceBounds._max.finalPrice) ?? 0),
    }
  },
  ['filter-options'],
  { revalidate: CACHE_SECONDS, tags: ['catalog'] }
)

export const getFilterOptions = cache(loadFilterOptions)

/**
 * Bosh sahifadagi "Tanlangan atirlar".
 *
 * Bosh sahifa endi dinamik render bo'ladi (til cookie'da), lekin baza
 * so'rovi keshdan olinadi (muddati va nega — `lib/cache.js`).
 */
export const getFeaturedProducts = unstable_cache(
  async (limit = 10) => {
    const rows = await prisma.product.findMany({
      where: { ...VISIBLE_PRODUCT, isFeatured: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: CARD_INCLUDE,
    })
    return rows.map(toCardProduct)
  },
  ['featured-products'],
  { revalidate: CACHE_SECONDS, tags: ['catalog'] }
)

/** Bosh sahifadagi brendlar qatori. */
export const getHomeBrands = unstable_cache(
  async (limit = 12) =>
    prisma.brand.findMany({
      where: { isActive: true, products: { some: VISIBLE_PRODUCT } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take: limit,
      select: { name: true, slug: true, logoUrl: true },
    }),
  ['home-brands'],
  { revalidate: CACHE_SECONDS, tags: ['catalog'] }
)

/**
 * Saytda ko'rinadigan barcha atirlarning slug'lari (kichik ro'yxat).
 *
 * Atir sahifasi keshining DARVOZASI: ro'yxatda yo'q slug na bazaga, na
 * keshga tegadi. NEGA: kesh kaliti URL'dan keladi. Agar har qanday slug
 * keshlansa, hujumchi /atir/tasodifiy-1, -2, ... ni ochib, keshni minglab
 * bo'sh yozuv bilan to'ldirishi (va har biri uchun bazani uyg'otishi)
 * mumkin edi.
 */
const loadVisibleSlugs = unstable_cache(
  async () => {
    const rows = await prisma.product.findMany({
      where: VISIBLE_PRODUCT,
      select: { slug: true },
    })
    return rows.map((row) => row.slug)
  },
  ['visible-slugs'],
  { revalidate: CACHE_SECONDS, tags: ['catalog'] }
)

/**
 * Mahsulot sahifasi. Nofaol atir yoki nofaol brendniki => null (404 beriladi).
 *
 * Keshlanadi (avval har ochilishda bazaga borardi): baza uxlab yotsa,
 * birinchi mijoz uning uyg'onishini kutardi. Kalit — faqat MAVJUD slug
 * (loadVisibleSlugs). React `cache` — generateMetadata va sahifa bitta
 * so'rovda ikki marta chaqiradi; avval bu ikkita baza so'rovi edi.
 */
export const getProductBySlug = cache(async (slug) => {
  if (typeof slug !== 'string' || slug.length === 0 || slug.length > 200) return null

  const visible = await loadVisibleSlugs()
  if (!visible.includes(slug)) return null

  return loadProductBySlug(slug)
})

const loadProductBySlug = unstable_cache(
  async (slug) => queryProductBySlug(slug),
  ['product-by-slug'],
  { revalidate: CACHE_SECONDS, tags: ['catalog'] }
)

async function queryProductBySlug(slug) {
  const product = await prisma.product.findFirst({
    where: { slug, ...VISIBLE_PRODUCT },
    include: {
      brand: { select: { name: true, slug: true } },
      images: { orderBy: { sortOrder: 'asc' } },
      variants: {
        include: { size: { select: { id: true, label: true, valueMl: true } } },
      },
    },
  })

  if (!product) return null

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brandName: product.brand.name,
    brandSlug: product.brand.slug,
    gender: product.gender,
    shortDescription: product.shortDescription,
    description: product.description,
    images: product.images.map((img) => ({ url: img.url, id: img.id })),
    variants: product.variants
      .sort((a, b) => a.size.valueMl - b.size.valueMl)
      .map((v) => ({
        id: v.id,
        sizeId: v.sizeId,
        sizeLabel: v.size.label,
        price: toNumber(v.price),
        finalPrice: toNumber(v.finalPrice),
        discountPercent: v.discountPercent,
        available: v.inStock && v.stockQty > 0,
        stockQty: v.stockQty,
      })),
  }
}

/**
 * "O'xshash atirlar": avval shu brend, yetmasa shu jins.
 *
 * Keshlanadi. Kalit — mavjud atirning ID'si (getProductBySlug darvozasidan
 * o'tgan), ya'ni yozuvlar soni atirlar soni bilan cheklangan.
 */
export function getSimilarProducts(product, limit = 8) {
  return loadSimilarProducts(product.id, product.brandSlug, product.gender, limit)
}

const loadSimilarProducts = unstable_cache(
  async (productId, brandSlug, gender, limit) =>
    querySimilarProducts({ id: productId, brandSlug, gender }, limit),
  ['similar-products'],
  { revalidate: CACHE_SECONDS, tags: ['catalog'] }
)

async function querySimilarProducts(product, limit) {
  const sameBrand = await prisma.product.findMany({
    where: {
      ...VISIBLE_PRODUCT,
      brand: { ...VISIBLE_PRODUCT.brand, slug: product.brandSlug },
      NOT: { id: product.id },
    },
    take: limit,
    orderBy: { viewCount: 'desc' },
    include: CARD_INCLUDE,
  })

  if (sameBrand.length >= limit) return sameBrand.map(toCardProduct)

  const sameGender = await prisma.product.findMany({
    where: {
      ...VISIBLE_PRODUCT,
      gender: product.gender,
      NOT: { id: { in: [product.id, ...sameBrand.map((p) => p.id)] } },
    },
    take: limit - sameBrand.length,
    orderBy: { viewCount: 'desc' },
    include: CARD_INCLUDE,
  })

  return [...sameBrand, ...sameGender].map(toCardProduct)
}

/**
 * sitemap.xml uchun: ko'rinadigan barcha atirlar va brendlar.
 *
 * Faqat manzil va o'zgargan sana kerak — narx, rasm va variantlar
 * olinmaydi, chunki sitemap ularni ishlatmaydi va katalog o'sganda
 * bu so'rov og'irlashib ketardi.
 */
export const getSitemapEntries = unstable_cache(
  async () => {
    const [products, brands] = await Promise.all([
      prisma.product.findMany({
        where: VISIBLE_PRODUCT,
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.brand.findMany({
        where: { isActive: true, products: { some: VISIBLE_PRODUCT } },
        select: { slug: true },
        orderBy: { name: 'asc' },
      }),
    ])
    return { products, brands }
  },
  ['sitemap-entries'],
  { revalidate: CACHE_SECONDS, tags: ['catalog'] }
)

/** Ko'rishlar sonini oshiradi. Xatosi sahifani buzmasligi kerak. */
export async function incrementViewCount(productId) {
  try {
    await prisma.product.update({
      where: { id: productId },
      data: { viewCount: { increment: 1 } },
    })
  } catch {
    // Statistika — sahifa ochilishidan muhimroq emas
  }
}
