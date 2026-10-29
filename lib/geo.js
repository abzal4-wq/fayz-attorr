/**
 * Xarita bilan bog'liq sof yordamchilar — serverda ham, brauzerda ham.
 * Hech narsa import qilmaydi.
 */

/** Toshkent markazi — xarita birinchi ochilganda. */
export const TASHKENT_CENTER = { lat: 41.3111, lon: 69.2797 }

/**
 * O'zbekiston chegarasini o'rab turgan to'rtburchak.
 *
 * NEGA KERAK: koordinata mijozdan keladi. Busiz istalgan son (masalan
 * 0,0 — okean o'rtasi) buyurtmaga yozilib, kuryer noto'g'ri joyga
 * yuborilardi. Aniq chegara emas, lekin bema'ni qiymatlarni to'xtatadi.
 */
export const UZ_BOUNDS = {
  minLat: 37.1,
  maxLat: 45.6,
  minLon: 55.9,
  maxLon: 73.2,
}

/** Koordinata O'zbekiston ichidami. */
export function isInUzbekistan(lat, lon) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= UZ_BOUNDS.minLat &&
    lat <= UZ_BOUNDS.maxLat &&
    lon >= UZ_BOUNDS.minLon &&
    lon <= UZ_BOUNDS.maxLon
  )
}

/**
 * Mijozdan kelgan juftlikni tozalaydi.
 *
 * Ikkalasi ham to'g'ri va O'zbekiston ichida bo'lsa — saqlanadi, aks
 * holda IKKALASI ham null. Bittasi bor, ikkinchisi yo'q holat bo'lmaydi.
 *
 * Noto'g'ri koordinata buyurtmani TO'XTATMAYDI: matnli manzil asosiy,
 * nuqta qo'shimcha. GPS xatosi tufayli savdoni yo'qotish ma'nosiz.
 *
 * @returns {{ latitude: number|null, longitude: number|null }}
 */
export function cleanCoordinates(lat, lon) {
  const la = typeof lat === 'string' ? Number(lat) : lat
  const lo = typeof lon === 'string' ? Number(lon) : lon

  if (!isInUzbekistan(la, lo)) return { latitude: null, longitude: null }
  return { latitude: la, longitude: lo }
}

/**
 * Nominatim (OpenStreetMap) teskari geokodlash manzili.
 *
 * Brauzerdan to'g'ridan-to'g'ri chaqiriladi, server orqali EMAS: Nominatim
 * soniyasiga 1 so'rovdan oshirmaslikni talab qiladi va bu chegarani
 * manzil (IP) bo'yicha qo'yadi. Vercel'ning umumiy IP'lari ortida
 * boshqa loyihalar ham turadi — ular tufayli bizning so'rovlarimiz ham
 * bloklanib qolishi mumkin edi. Brauzerdan esa har mijoz o'z IP'si bilan.
 */
export function reverseGeocodeUrl(lat, lon, locale = 'uz') {
  // Toshkentda OSM nomlari asosan o'zbekcha va ruscha
  const language = locale === 'en' ? 'en' : locale === 'ru' ? 'ru' : 'uz,ru'
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lon),
    zoom: '18',
    addressdetails: '1',
    'accept-language': language,
  })
  return `https://nominatim.openstreetmap.org/reverse?${params}`
}

/**
 * OSM manzil qismlaridan kuryerga kerakli QISQA matn yasaydi:
 * "Bunyodkor ko'chasi 12, Qatortol, Chilonzor tumani, Toshkent".
 *
 * `display_name` ishlatilmaydi: u pochta indeksi, viloyat va mamlakatni
 * ham qo'shadi — manzil maydoniga sig'maydi va kuryerga keraksiz.
 *
 * @returns {string} bo'sh satr — hech narsa topilmasa
 */
export function formatOsmAddress(address) {
  if (!address || typeof address !== 'object') return ''

  const street = [address.road || address.pedestrian || address.footway, address.house_number]
    .filter(Boolean)
    .join(' ')

  const parts = [
    street,
    address.neighbourhood || address.quarter || address.residential || address.suburb,
    address.city_district || address.county,
    address.city || address.town || address.village,
  ]

  // Bir xil nom ikki marta chiqmasin (masalan suburb va city_district bir xil)
  const seen = new Set()
  return parts
    .filter((part) => {
      if (!part) return false
      const key = part.trim().toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .join(', ')
}

/**
 * Kuryer uchun xarita havolalari.
 *
 * Yandex birinchi: O'zbekistonda kuryerlar va taksi asosan shundan
 * foydalanadi. Google — zaxira. E'tibor bering: Yandex "uzunlik,kenglik"
 * tartibini kutadi (lon,lat), Google esa aksincha (lat,lon) — aralashib
 * ketsa nuqta boshqa qit'aga tushadi.
 *
 * @returns {{ yandex: string, google: string } | null}
 */
export function mapLinks(lat, lon) {
  if (!isInUzbekistan(lat, lon)) return null

  // 6 xona ~ 10 sm aniqlik — undan ko'pi ma'nosiz
  const la = lat.toFixed(6)
  const lo = lon.toFixed(6)

  return {
    yandex: `https://yandex.uz/maps/?pt=${lo},${la}&z=17&l=map`,
    google: `https://www.google.com/maps/search/?api=1&query=${la},${lo}`,
  }
}
