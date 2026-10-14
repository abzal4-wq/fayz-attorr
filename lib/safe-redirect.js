/**
 * `?keyin=` parametri foydalanuvchi nazoratida bo'ladi. Uni tekshirmasdan
 * redirect qilish ochiq redirect zaifligi: hujumchi
 * `/kirish?keyin=https://zararli.uz` havolasini tarqatishi mumkin.
 *
 * Shuning uchun faqat shu saytning ichki, nisbiy yo'llariga ruxsat beriladi.
 */
export function safeRedirectPath(value, fallback = '/') {
  if (typeof value !== 'string' || value.length === 0) return fallback

  // Faqat "/" bilan boshlanishi kerak, lekin "//" yoki "/\" emas —
  // bular brauzerda tashqi manzil sifatida talqin qilinadi.
  if (!value.startsWith('/')) return fallback
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback

  // Protokol belgisi bo'lmasin
  if (value.includes(':')) return fallback

  return value
}
