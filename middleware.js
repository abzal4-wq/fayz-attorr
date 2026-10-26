import { NextResponse } from 'next/server'
import { verifyAdminToken, verifyUserToken } from '@/lib/auth/jwt'

const USER_COOKIE = 'fa_session'
const ADMIN_COOKIE = 'fa_admin'

// Admin tizimiga kirish uchun ochiq qoldiriladigan yo'llar.
// Qolgan barcha /admin va /api/admin manzillari admin bo'lmaganlar uchun 404.
const ADMIN_PUBLIC_PATHS = ['/admin/kirish', '/api/admin/auth/login', '/api/admin/auth/logout']

// Tizimga kirgan foydalanuvchi talab qilinadigan yo'llar.
const USER_PROTECTED_PREFIXES = ['/profil', '/buyurtma']

function isAdminPublic(pathname) {
  return ADMIN_PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

/*
 * DIQQAT: middleware Edge runtime'da ishlaydi va bazaga murojaat
 * qila olmaydi, ya'ni tokenning `tv` (tokenVersion) qiymatini
 * TEKSHIRMAYDI — faqat imzo va muddat tekshiriladi.
 *
 * Shuning uchun bu yer tez old-filtr: bekor qilingan token bu
 * yerdan o'tib ketishi mumkin. Haqiqiy to'siq keyingi qatlamda:
 *  - sahifalar: `getCurrentUser()` / `getCurrentAdmin()` null
 *    qaytaradi va sahifa o'zi qayta yo'naltiradi
 *  - admin API: `guardAdmin()` 404 beradi
 *
 * Bu qatlamlarni olib tashlab, tekshiruvni faqat shu yerga
 * tayanmaslik kerak.
 */
export async function middleware(request) {
  const { pathname, search } = request.nextUrl

  /* ---------------------- Admin panel ---------------------- */
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (isAdminPublic(pathname)) return NextResponse.next()

    const token = request.cookies.get(ADMIN_COOKIE)?.value
    const payload = await verifyAdminToken(token)

    if (!payload) {
      // Ataylab 401 emas: admin panel borligini oshkor qilmaymiz.
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { ok: false, message: 'Topilmadi' },
          { status: 404 }
        )
      }
      // Sahifalar uchun saytning o'z 404 ko'rinishi chiqadi.
      return NextResponse.rewrite(new URL('/admin-yoq', request.url), {
        status: 404,
      })
    }

    return NextResponse.next()
  }

  /* ------------------- Foydalanuvchi yo'llari ------------------- */
  if (USER_PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const token = request.cookies.get(USER_COOKIE)?.value
    const payload = await verifyUserToken(token)

    if (!payload) {
      const loginUrl = new URL('/kirish', request.url)
      // Kirgandan keyin foydalanuvchini o'sha sahifaga qaytaramiz
      loginUrl.searchParams.set('keyin', pathname + search)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/profil/:path*', '/buyurtma/:path*'],
}
