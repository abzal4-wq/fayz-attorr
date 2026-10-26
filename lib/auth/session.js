import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import {
  SESSION_MAX_AGE_SECONDS,
  signAdminToken,
  signUserToken,
  verifyAdminToken,
  verifyUserToken,
} from './jwt'

export const USER_COOKIE = 'fa_session'
export const ADMIN_COOKIE = 'fa_admin'

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  }
}

/**
 * Tokendagi `tv` bazadagi `tokenVersion` bilan solishtiriladi.
 *
 * MIGRATSIYAGA MOSLIK: `tokenVersion` qo'shilishidan OLDIN berilgan
 * tokenlarda `tv` maydoni yo'q. `?? 0` ularni 0 deb o'qiydi, bazadagi
 * standart qiymat ham 0 — shuning uchun o'zgarishdan keyin hech kim
 * tizimdan chiqib ketmaydi. Birinchi chiqishdan keyin esa raqam
 * oshadi va eski token kuchini yo'qotadi.
 */
function versionMatches(payload, row) {
  return (payload?.tv ?? 0) === row.tokenVersion
}

/* ------------------------- Mijoz sessiyasi ------------------------- */

/** Cookie'dagi tokenni o'qiydi. Bazaga murojaat qilmaydi. */
async function readUserPayload() {
  const store = await cookies()
  return verifyUserToken(store.get(USER_COOKIE)?.value)
}

export async function createUserSession(userId) {
  // Token joriy versiya bilan imzolanadi — aks holda u darhov eskirgan
  // hisoblanardi (masalan parol tiklangandan keyin)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokenVersion: true },
  })

  const token = await signUserToken(userId, user?.tokenVersion ?? 0)
  const store = await cookies()
  store.set(USER_COOKIE, token, cookieOptions())
}

/**
 * Chiqish.
 *
 * Cookie'ni o'chirish YETARLI EMAS: tokenning nusxasi olingan bo'lsa
 * u 30 kun ishlayverardi. Shuning uchun bazadagi `tokenVersion` ham
 * oshiriladi — bu barcha qurilmalardagi eski tokenlarni bekor qiladi.
 */
export async function destroyUserSession() {
  const payload = await readUserPayload()

  if (payload?.sub) {
    try {
      await prisma.user.update({
        where: { id: payload.sub },
        data: { tokenVersion: { increment: 1 } },
      })
    } catch {
      // Hisob bazadan o'chirilgan bo'lishi mumkin — chiqish baribir
      // davom etishi kerak, aks holda cookie o'chmay qolardi
    }
  }

  const store = await cookies()
  store.set(USER_COOKIE, '', { ...cookieOptions(), maxAge: 0 })
}

/**
 * Tokendagi foydalanuvchi ID'si — bekor qilinmaganligi tekshirilgan.
 *
 * NEGA BAZAGA MUROJAAT QILADI: bu funksiya "allaqachon kirgan bo'lsa
 * ichkariga yubor" qo'riqchilarida ishlatiladi (`/kirish`,
 * `/royxatdan-otish`, `/parolni-tiklash`). Agar u faqat imzoni
 * tekshirsa, bekor qilingan token bilan `/profil` -> `/kirish` ->
 * `/profil` HALQASI paydo bo'lardi: `/profil` foydalanuvchini topmay
 * kirish sahifasiga yuboradi, kirish sahifasi esa tokenni haqiqiy
 * deb bilib yana orqaga qaytaradi.
 */
export async function getUserId() {
  const payload = await readUserPayload()
  if (!payload?.sub) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { tokenVersion: true },
  })

  if (!user || !versionMatches(payload, user)) return null

  return payload.sub
}

/**
 * Joriy foydalanuvchi. Token haqiqiy bo'lsa ham, foydalanuvchi
 * bazadan o'chirilgan yoki sessiyasi bekor qilingan bo'lishi mumkin.
 */
export async function getCurrentUser() {
  const payload = await readUserPayload()
  if (!payload?.sub) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      phone: true,
      fullName: true,
      createdAt: true,
      tokenVersion: true,
    },
  })

  if (!user || !versionMatches(payload, user)) return null

  // `tokenVersion` ichki ma'lumot — chaqiruvchiga chiqarilmaydi
  const { tokenVersion: _tokenVersion, ...rest } = user
  return rest
}

/* ------------------------- Admin sessiyasi ------------------------- */

async function readAdminPayload() {
  const store = await cookies()
  return verifyAdminToken(store.get(ADMIN_COOKIE)?.value)
}

export async function createAdminSession(adminId, role) {
  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: { tokenVersion: true },
  })

  const token = await signAdminToken(adminId, role, admin?.tokenVersion ?? 0)
  const store = await cookies()
  store.set(ADMIN_COOKIE, token, cookieOptions())
}

export async function destroyAdminSession() {
  const payload = await readAdminPayload()

  if (payload?.sub) {
    try {
      await prisma.adminUser.update({
        where: { id: payload.sub },
        data: { tokenVersion: { increment: 1 } },
      })
    } catch {
      // Mijoz tomonidagi kabi — chiqish to'xtamasligi kerak
    }
  }

  const store = await cookies()
  store.set(ADMIN_COOKIE, '', { ...cookieOptions(), maxAge: 0 })
}

export async function getCurrentAdmin() {
  const payload = await readAdminPayload()
  if (!payload?.sub) return null

  const admin = await prisma.adminUser.findUnique({
    where: { id: payload.sub },
    select: { id: true, username: true, role: true, tokenVersion: true },
  })

  if (!admin || !versionMatches(payload, admin)) return null

  const { tokenVersion: _tokenVersion, ...rest } = admin
  return rest
}

/**
 * Admin API route'lari uchun qo'riqchi.
 * Admin bo'lmasa null qaytaradi — chaqiruvchi 404 bilan javob beradi
 * (401 emas: panel borligini oshkor qilmaymiz).
 */
export async function requireAdmin() {
  return getCurrentAdmin()
}
