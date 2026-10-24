const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/**
 * robots.txt
 *
 * Yopiq sahifalar ro'yxatida `/admin` ATAYLAB YO'Q: uni yozish panel
 * mavjudligini oshkor qilardi, loyiha qoidasi esa aksincha — admin
 * yo'llari 404 qaytaradi va mavjudligi bilinmaydi. Panel sahifalari
 * baribir indekslanmaydi: `app/admin/layout.js` da `robots: noindex`.
 *
 * Qolganlari — shaxsiy yoki foydasiz sahifalar: ularda indekslanadigan
 * mazmun yo'q, lekin qidiruv roboti ularga bekorga kirib yuradi.
 */
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/profil',
        '/buyurtma',
        '/savat',
        '/kirish',
        '/royxatdan-otish',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
