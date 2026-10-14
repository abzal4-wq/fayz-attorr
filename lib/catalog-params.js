import { GENDER_LABELS } from '@/lib/format'

/**
 * Katalog filtrlari URL query parametrlarida yashaydi:
 *   /katalog?gender=WOMEN&brend=dior,chanel&hajm=50,100&narxdan=100000&chegirma=1
 *
 * Shuning uchun havolani ulashsa bo'ladi, brauzerning "orqaga" tugmasi
 * ishlaydi va sahifa serverda to'liq render bo'ladi.
 */

export const SORTS = {
  yangi: 'Yangi',
  arzon: 'Avval arzoni',
  qimmat: 'Avval qimmati',
  ommabop: 'Ommabop',
}

const GENDERS = Object.keys(GENDER_LABELS)

function list(value) {
  return String(value ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

function int(value) {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) ? n : null
}

/** URL parametrlarini tekshirilgan filtr obyektiga aylantiradi. */
export function parseCatalogParams(params = {}) {
  const gender = GENDERS.includes(params.gender) ? params.gender : null
  const sort = Object.keys(SORTS).includes(params.saralash) ? params.saralash : 'yangi'
  const page = Math.max(1, int(params.sahifa) ?? 1)

  let minPrice = int(params.narxdan)
  let maxPrice = int(params.narxgacha)
  // Teskari kiritilgan oraliqni to'g'rilaymiz
  if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
    ;[minPrice, maxPrice] = [maxPrice, minPrice]
  }

  return {
    gender,
    brandSlugs: list(params.brend),
    sizeMl: list(params.hajm).map(int).filter((n) => n != null),
    minPrice,
    maxPrice,
    onlyDiscount: params.chegirma === '1',
    sort,
    page,
  }
}

/** Filtr obyektidan yana URL query satrini yasaydi. */
export function buildCatalogQuery(filters) {
  const params = new URLSearchParams()

  if (filters.gender) params.set('gender', filters.gender)
  if (filters.brandSlugs?.length) params.set('brend', filters.brandSlugs.join(','))
  if (filters.sizeMl?.length) params.set('hajm', filters.sizeMl.join(','))
  if (filters.minPrice != null) params.set('narxdan', String(filters.minPrice))
  if (filters.maxPrice != null) params.set('narxgacha', String(filters.maxPrice))
  if (filters.onlyDiscount) params.set('chegirma', '1')
  if (filters.sort && filters.sort !== 'yangi') params.set('saralash', filters.sort)
  if (filters.page && filters.page > 1) params.set('sahifa', String(filters.page))

  return params.toString()
}

/** Nechta filtr qo'llanganini sanaydi — mobil tugmadagi badge uchun. */
export function countActiveFilters(filters) {
  return (
    (filters.gender ? 1 : 0) +
    (filters.brandSlugs?.length ?? 0) +
    (filters.sizeMl?.length ?? 0) +
    (filters.minPrice != null || filters.maxPrice != null ? 1 : 0) +
    (filters.onlyDiscount ? 1 : 0)
  )
}
