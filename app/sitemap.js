import { getSitemapEntries } from '@/lib/catalog'
import { GENDERS } from '@/lib/catalog-params'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/**
 * sitemap.xml
 *
 * Til sitemap'da ajratilmaydi: uch til ham BITTA manzilda yashaydi
 * (til cookie'da, `lib/i18n/config.js`). Shuning uchun har sahifa bir
 * marta yoziladi — aks holda bir xil manzilni uch marta yuborgan
 * bo'lardik.
 *
 * Shaxsiy sahifalar (savat, profil, buyurtma) ataylab yo'q: ularda
 * indekslanadigan mazmun yo'q (robots.js da ham yopilgan).
 *
 * So'rov paytida tuziladi, build paytida emas.
 *
 * Avval Next uni build paytida "pishirib" qo'yardi — ya'ni build
 * JONLI bazaga bog'liq bo'lib qolgandi: Neon bir lahza javob bermasa
 * (masalan uyqudan uyg'onayotganda) butun deploy yiqilardi. Ustiga
 * sitemap keyingi deploy'gacha eskirib turardi.
 *
 * Endi u har so'rovda tuziladi, lekin baza so'rovi 60 soniya
 * keshlanadi (`getSitemapEntries`), ya'ni robot tez-tez kelsa ham
 * bazaga yuk tushmaydi.
 */
export const dynamic = 'force-dynamic'

export default async function sitemap() {
  const now = new Date()

  // Baza ishlamasa ham sitemap qaytishi kerak: statik sahifalar
  // baribir indekslansin, xato esa butun javobni buzmasin.
  let products = []
  let brands = []
  try {
    ;({ products, brands } = await getSitemapEntries())
  } catch (error) {
    console.error('sitemap: katalogni oqib bolmadi:', error?.message)
  }

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/katalog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // Jins bo'yicha katalog: mijozlar aynan shunday qidiradi
    ...GENDERS.map((gender) => ({
      url: `${siteUrl}/katalog?gender=${gender}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    })),
    ...brands.map((brand) => ({
      url: `${siteUrl}/katalog?brend=${brand.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    })),
    ...products.map((product) => ({
      url: `${siteUrl}/atir/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    })),
  ]
}
