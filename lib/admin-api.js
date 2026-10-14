import { notFound } from '@/lib/api'
import { getCurrentAdmin } from '@/lib/auth/session'

/**
 * Admin API route'lari uchun qo'riqchi.
 *
 * Middleware ham tekshiradi, lekin bu ikkinchi qatlam: token haqiqiy
 * bo'lsa ham admin hisobi bazadan o'chirilgan bo'lishi mumkin.
 *
 * Ruxsat bo'lmasa 404 qaytaradi — 401 emas, panel borligini oshkor qilmaslik uchun.
 *
 * @returns {Promise<{admin: object}|{response: Response}>}
 */
export async function guardAdmin() {
  const admin = await getCurrentAdmin()
  if (!admin) return { response: notFound() }
  return { admin }
}

/** Prisma'ning Decimal qiymatlarini JSON uchun songa aylantiradi. */
export function toNumber(value) {
  if (value === null || value === undefined) return value
  return typeof value === 'object' && 'toNumber' in value
    ? value.toNumber()
    : Number(value)
}

/**
 * Nomdan slug yasaydi. O'zbek lotin harflarini ham hisobga oladi.
 * "Dior Sauvage" -> "dior-sauvage", "Oʻzbek atiri" -> "ozbek-atiri"
 */
export function slugify(input) {
  return String(input ?? '')
    .toLowerCase()
    .replace(/[''`ʻʼ]/g, '') // apostroflar olib tashlanadi: o'zbek -> ozbek
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // diakritik belgilar
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/**
 * Slug band bo'lsa oxiriga raqam qo'shadi: dior, dior-2, dior-3...
 * @param check - slug bandligini tekshiruvchi async funksiya
 */
export async function uniqueSlug(base, check) {
  const root = slugify(base) || 'element'
  let candidate = root
  let n = 2

  while (await check(candidate)) {
    candidate = `${root}-${n}`
    n += 1
    if (n > 200) throw new Error("Slug yaratib bo'lmadi")
  }

  return candidate
}
