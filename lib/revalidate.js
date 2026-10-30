import { revalidateTag } from 'next/cache'

/**
 * Admin biror narsani o'zgartirgach keshni darhol bo'shatadi.
 *
 * NEGA KERAK: sayt ma'lumotlari keshlanadi (muddati `lib/cache.js` da).
 * Kesh bo'shatilmasa, admin yangi atir qo'shib saytni ochganda bir
 * soatgacha "hech narsa o'zgarmadi" degan tuyg'u paydo bo'lardi va
 * u o'zgarishini ikki-uch marta takrorlab yuborishi mumkin.
 *
 * Xatosi hech qachon so'rovni buzmasligi kerak: kesh bo'shamasa ham
 * o'zgarish baribir kesh muddati tugagach chiqadi, lekin saqlangan ma'lumot
 * yo'qolib ketmasligi kerak.
 */
export function revalidateCatalog() {
  try {
    revalidateTag('catalog')
  } catch (error) {
    console.error('Katalog keshini bo\'shatib bo\'lmadi:', error?.message)
  }
}

export function revalidateSettings() {
  try {
    revalidateTag('settings')
  } catch (error) {
    console.error('Sozlamalar keshini bo\'shatib bo\'lmadi:', error?.message)
  }
}
