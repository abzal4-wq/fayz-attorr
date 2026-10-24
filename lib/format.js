/**
 * Narxni so'mda ko'rsatadi: 450000 -> "450 000 so'm"
 *
 * Raqam ajratuvchisi uch tilda ham bir xil (oddiy bo'shliq) — faqat
 * valyuta so'zi tarjima qilinadi. Shuning uchun `suffix` tashqaridan
 * beriladi: `createMoney(t)` yoki `useMoney()` dan foydalaning.
 */
export function formatSom(value, { withSuffix = true, suffix = "so'm" } = {}) {
  const number = Number(value ?? 0)
  if (!Number.isFinite(number)) return withSuffix ? `0 ${suffix}` : '0'

  /*
   * Guruhlash ATAYLAB qo'lda, `Intl.NumberFormat` bilan emas.
   *
   * Intl natijasi muhitdagi ICU ma'lumotiga bog'liq: Node 'uz-UZ' uchun
   * "410 000" (bo'shliq), Chrome esa "410,000" (vergul) beradi. Narx
   * ko'rsatadigan komponentlar client bo'lgani uchun server HTML'ida
   * bo'shliq, hydration dan keyin vergul chiqardi — raqam ko'z oldida
   * o'zgarib ketardi va React hydration mismatch berardi. Brauzerda
   * rasmga olib tekshirganda topildi (npm run audit -- --shot).
   *
   * Uch tilda ham ajratuvchi bir xil — bo'shliq. Vergul xavfli ham:
   * ba'zi tillarda u kasr ajratuvchisi sifatida o'qiladi.
   */
  const grouped = String(Math.round(Math.abs(number))).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ' '
  )
  const formatted = number < 0 ? `-${grouped}` : grouped

  return withSuffix ? `${formatted} ${suffix}` : formatted
}

/**
 * Tanlangan tilga bog'langan narx formatlagich.
 *
 * Komponentlarda `formatSom` o'rniga shu ishlatiladi, aks holda ruscha
 * sahifada ham "so'm" yozilib qoladi.
 */
export function createMoney(t) {
  const suffix = t('common.som')
  return (value, options) => formatSom(value, { ...options, suffix })
}

/** Chegirmadan keyingi narx. Hisob SERVERDA ham takrorlanadi. */
export function priceAfterDiscount(price, discountPercent) {
  const base = Number(price ?? 0)
  const discount = Number(discountPercent ?? 0)
  if (!discount) return base
  return Math.round(base * (1 - discount / 100))
}

/** Sana: 13.10.2026, 16:45 */
export function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}` +
    `, ${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

export function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`
}

export const GENDER_LABELS = {
  WOMEN: 'Ayollar',
  MEN: 'Erkaklar',
  UNISEX: 'Unisex',
}
