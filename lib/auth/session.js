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

/* ------------------------- Mijoz sessiyasi ------------------------- */

export async function createUserSession(userId) {
  const token = await signUserToken(userId)
  const store = await cookies()
  store.set(USER_COOKIE, token, cookieOptions())
}

export async function destroyUserSession() {
  const store = await cookies()
  store.set(USER_COOKIE, '', { ...cookieOptions(), maxAge: 0 })
}

/** Tokendagi foydalanuvchi ID'si. Bazaga murojaat qilmaydi. */
export async function getUserId() {
  const store = await cookies()
  const payload = await verifyUserToken(store.get(USER_COOKIE)?.value)
  return payload?.sub ?? null
}

/**
 * Joriy foydalanuvchi. Token haqiqiy bo'lsa ham, foydalanuvchi
 * bazadan o'chirilgan bo'lishi mumkin — shuning uchun tekshiriladi.
 */
export async function getCurrentUser() {
  const userId = await getUserId()
  if (!userId) return null

  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true, fullName: true, createdAt: true },
  })
}

/* ------------------------- Admin sessiyasi ------------------------- */

export async function createAdminSession(adminId, role) {
  const token = await signAdminToken(adminId, role)
  const store = await cookies()
  store.set(ADMIN_COOKIE, token, cookieOptions())
}

export async function destroyAdminSession() {
  const store = await cookies()
  store.set(ADMIN_COOKIE, '', { ...cookieOptions(), maxAge: 0 })
}

export async function getCurrentAdmin() {
  const store = await cookies()
  const payload = await verifyAdminToken(store.get(ADMIN_COOKIE)?.value)
  if (!payload?.sub) return null

  return prisma.adminUser.findUnique({
    where: { id: payload.sub },
    select: { id: true, username: true, role: true },
  })
}

/**
 * Admin API route'lari uchun qo'riqchi.
 * Admin bo'lmasa null qaytaradi — chaqiruvchi 404 bilan javob beradi
 * (401 emas: panel borligini oshkor qilmaymiz).
 */
export async function requireAdmin() {
  return getCurrentAdmin()
}
