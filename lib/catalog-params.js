
/**
 * Katalog filtrlari URL query parametrlarida yashaydi:
 *   /katalog?gender=WOMEN&brend=dior,chanel&hajm=50,100&narxdan=100000&chegirma=1
 *
 * Shuning uchun havolani ulashsa bo'ladi, brauzerning "orqaga" tugmasi
 * ishlaydi va sahifa serverda to'liq render bo'ladi.
 */

/**
 * Ruxsat etilgan saralash kalitlari. Nomlari bu yerda yo'q: ular uch
 * tilda lug'atda (`catalog.sortNew` va h.k.). Ikki joyda saqlansa,
 * biri o'zgarib ikkinchisi qolib ketadi.
 */
export const SORTS = ['yangi', 'arzon', 'qimmat', 'ommabop']

/**
 * Ruxsat etilgan jins qiymatlari. Tarjima bilan bog'liq emas: bu URL va
 * bazadagi kalitlar, ularning uch tildagi nomi lug'atda (`gender.*`).
 */
export const GENDERS = ['WOMEN', 'MEN', 'UNISEX']

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

/** Qidiruv satrining eng uzun joiz uzunligi. */
export const MAX_QUERY_LENGTH = 60

/** Qidiruvda hisobga olinadigan eng ko'p so'z. */
export const MAX_QUERY_WORDS = 5

/**
 * Qidiruv satrini tozalaydi.
 *
 * Uzunlik cheklanadi va so'zlar soni kesiladi: har bir so'z bazada
 * alohida `contains` sharti bo'ladi (`lib/catalog.js`), ya'ni uzun
 * satr og'ir so'rovga aylanishi mumkin edi.
 */
export function parseQuery(value) {
  if (typeof value !== 'string') return ''

  return value
    .trim()
    .slice(0, MAX_QUERY_LENGTH)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_QUERY_WORDS)
    .join(' ')
}

/**
 * Qidiruv so'zidagi LIKE joker belgilarini ekranlaydi.
 *
 * Prisma `contains` ni `LIKE '%qiymat%'` ga aylantiradi, lekin
 * qiymat ichidagi `%` va `_` ni EKRANLAMAYDI. Jonli bazada
 * tasdiqlangan edi:
 *   q=%        -> butun katalog chiqardi
 *   q=_        -> butun katalog chiqardi
 *   q=chan%el  -> "Chanel" topilardi
 *
 * Bu nafaqat kutilmagan natija (odam "50%" deb qidirsa ham shu),
 * balki ko'p joker belgili satr bazani ortiqcha ishlatadi.
 *
 * `parseQuery` ICHIDA chaqirilmaydi: uning natijasi foydalanuvchiga
 * qaytib ko'rsatiladi ("... bo'yicha natijalar") va u yerda teskari
 * chiziqlar ko'rinib qolardi. Ekranlash faqat baza so'rovi
 * qurilayotganda qo'llanadi (`lib/catalog.js`).
 */
export function escapeLike(value) {
  return String(value ?? '').replace(/[\\%_]/g, '\\$&')
}

/** URL parametrlarini tekshirilgan filtr obyektiga aylantiradi. */
export function parseCatalogParams(params = {}) {
  const gender = GENDERS.includes(params.gender) ? params.gender : null
  const sort = SORTS.includes(params.saralash) ? params.saralash : 'yangi'
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
    query: parseQuery(params.q),
    sort,
    page,
  }
}

/** Filtr obyektidan yana URL query satrini yasaydi. */
export function buildCatalogQuery(filters) {
  const params = new URLSearchParams()

  // Qidiruv birinchi turadi — ulashilgan havolada eng ko'zga
  // tashlanadigan qism shu bo'lsin
  if (filters.query) params.set('q', filters.query)
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

/**
 * Nechta filtr qo'llanganini sanaydi — mobil tugmadagi badge uchun.
 *
 * Qidiruv ATAYLAB sanalmaydi: u alohida maydonda ko'rinib turadi va
 * filtr panelidan tozalanmaydi. Badge'ga qo'shilsa, foydalanuvchi
 * panelni ochib qidiruvni o'chirishga urinardi.
 */
export function countActiveFilters(filters) {
  return (
    (filters.gender ? 1 : 0) +
    (filters.brandSlugs?.length ?? 0) +
    (filters.sizeMl?.length ?? 0) +
    (filters.minPrice != null || filters.maxPrice != null ? 1 : 0) +
    (filters.onlyDiscount ? 1 : 0)
  )
}
