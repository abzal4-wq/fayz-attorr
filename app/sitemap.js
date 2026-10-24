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
 */
export default async function sitemap() {
  const { products, brands } = await getSitemapEntries()
  const now = new Date()

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
