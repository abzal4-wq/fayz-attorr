/** @type {import('next').NextConfig} */

/**
 * Hamma sahifaga qo'yiladigan sarlavhalar.
 *
 * DIQQAT — `X-Frame-Options: DENY` bu yerda YO'Q va bo'lmasligi kerak:
 * Telegram Mini App desktop versiyasida saytni iframe ichida ochadi.
 * DENY qo'ysak Mini App oq ekran bo'lib qoladi. Shuning uchun
 * `frame-ancestors` orqali faqat Telegram'ga ruxsat beramiz — bu
 * clickjacking'dan himoya qiladi, lekin Mini App'ni buzmaydi.
 */
const baseHeaders = [
  // Brauzer fayl turini "taxmin qilmasin" (masalan matnni skript deb o'qimasin)
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Boshqa saytga o'tganda to'liq manzil yuborilmasin
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  /*
   * Ishlatmaydigan qurilma imkoniyatlari o'chirilsin.
   *
   * geolocation=(self): checkout'dagi "Joylashuvim" tugmasi uchun. Avval
   * `geolocation=()` edi — bu GPS'ni butun saytda o'chirib qo'yadi va
   * tugma hech qanday xatosiz jimgina ishlamay qolardi. `self` faqat
   * o'z sahifalarimizga ruxsat beradi, begona iframe'larga emas.
   */
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), payment=(), usb=()',
  },
  {
    key: 'Content-Security-Policy',
    value:
      "frame-ancestors 'self' https://telegram.org https://*.telegram.org https://*.t.me",
  },
]

/**
 * Admin panel hech qachon Mini App bo'lmaydi — demak uni iframe ichiga
 * solishga umuman hojat yo'q. Bu yerda eng qattiq himoya qo'yiladi.
 */
const adminHeaders = [
  ...baseHeaders.filter(
    (h) => h.key !== 'Content-Security-Policy' && h.key !== 'Permissions-Policy'
  ),
  // Panelda joylashuv kerak emas — u yerda yopiq qoladi
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  // Panel qidiruv natijalarida chiqmasin (meta teg bilan birga ikkinchi qatlam)
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
]

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: `/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '**'}/**`,
      },
    ],
    formats: ['image/webp'],
    // SVG ATAYLAB yoqilmagan: Next'ning rasm optimizatsiyasidagi
    // GHSA-2464-fhr4-w9xw (kritik RCE) aynan SVG orqali ishlagan.
    // 15.5.28 da yopilgan, lekin qo'shimcha qatlam zarar qilmaydi.
    dangerouslyAllowSVG: false,
  },

  // Prisma'ning native binary'lari serverless bundle'ga to'g'ri tushishi uchun
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg'],

  // Javob sarlavhalarida Next versiyasi ko'rinmasin
  poweredByHeader: false,

  async headers() {
    return [
      { source: '/:path*', headers: baseHeaders },
      { source: '/admin/:path*', headers: adminHeaders },
    ]
  },
}

export default nextConfig
