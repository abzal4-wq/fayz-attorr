import { fail, ok, readJson } from '@/lib/api'
import { consumeAttempt, consumeAttemptPair, getClientIp } from '@/lib/auth/rate-limit'
import { getCurrentUser } from '@/lib/auth/session'
import { OrderError, createOrder } from '@/lib/orders'
import { notifyNewOrder } from '@/lib/telegram'
import { makeOrderSchema } from '@/lib/validation/order'
import { formatZodError } from '@/lib/validation/auth'
import { getT } from '@/lib/i18n/server'

export async function POST(request) {
  const ip = getClientIp(request)
  const t = await getT()

  // Buyurtmada ham IP yolg'iz yetarli emas (CGNAT) — foydalanuvchi
  // bo'yicha ham hisoblanadi. Mehmon buyurtmasi joriy etilganda
  // bu yerga telefon raqami beriladi.
  const limit = await consumeAttempt('order-ip', ip)
  if (!limit.allowed) {
    return fail(
      t('errors.tooManyAttempts', {
        minutes: Math.ceil(limit.retryAfterSeconds / 60),
      }),
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    )
  }

  // Buyurtma berish uchun ro'yxatdan o'tish shart
  const user = await getCurrentUser()
  if (!user) {
    return fail(t('errors.orderLoginRequired'), { status: 401 })
  }

  const body = await readJson(request)
  if (!body) return fail(t('errors.badRequest'))

  const parsed = makeOrderSchema(t).safeParse(body)
  if (!parsed.success) {
    const { fieldErrors, formErrors } = formatZodError(parsed.error)
    return fail(formErrors[0] ?? t('errors.checkData'), { fieldErrors })
  }

  const { items, ...customer } = parsed.data

  let order
  try {
    // `t` ham beriladi: "mahsulot tugab qoldi" kabi xabarlar mijoz
    // tilida bo'lishi kerak. Telegram xabari esa baribir o'zbekcha —
    // uni admin o'qiydi, mijoz emas.
    order = await createOrder({ items, customer, userId: user.id, t })
  } catch (error) {
    if (error instanceof OrderError) {
      // Qaysi mahsulot muammoli ekanini ham yuboramiz — forma ularni
      // ro'yxat qilib ko'rsatadi.
      return fail(error.message, { status: 409, details: error.details })
    }
    console.error('Buyurtma yaratishda xato:', error)
    return fail(t('errors.orderFailed'), { status: 500 })
  }

  // Telegram xatosi buyurtmani BUZMASLIGI kerak — shuning uchun
  // alohida try/catch ichida va javobga ta'sir qilmaydi.
  try {
    await notifyNewOrder(order)
  } catch (error) {
    console.error('Telegram xabari yuborilmadi:', error?.message)
  }

  return ok({ orderNumber: order.orderNumber }, { status: 201 })
}
