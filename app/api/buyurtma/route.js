import { fail, ok, readJson } from '@/lib/api'
import { consumeAttempt, getClientIp } from '@/lib/auth/rate-limit'
import { getCurrentUser } from '@/lib/auth/session'
import { OrderError, createOrder } from '@/lib/orders'
import { notifyNewOrder } from '@/lib/telegram'
import { orderSchema } from '@/lib/validation/order'
import { formatZodError } from '@/lib/validation/auth'

export async function POST(request) {
  const ip = getClientIp(request)

  const limit = await consumeAttempt('order', ip)
  if (!limit.allowed) {
    return fail(
      `Juda ko'p urinish. ${Math.ceil(limit.retryAfterSeconds / 60)} daqiqadan keyin qayta urinib ko'ring.`,
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    )
  }

  // Buyurtma berish uchun ro'yxatdan o'tish shart
  const user = await getCurrentUser()
  if (!user) {
    return fail("Buyurtma berish uchun avval tizimga kiring", { status: 401 })
  }

  const body = await readJson(request)
  if (!body) return fail("So'rov formati noto'g'ri")

  const parsed = orderSchema.safeParse(body)
  if (!parsed.success) {
    const { fieldErrors, formErrors } = formatZodError(parsed.error)
    return fail(formErrors[0] ?? "Ma'lumotlarni tekshiring", { fieldErrors })
  }

  const { items, ...customer } = parsed.data

  let order
  try {
    order = await createOrder({ items, customer, userId: user.id })
  } catch (error) {
    if (error instanceof OrderError) {
      // Qaysi mahsulot muammoli ekanini ham yuboramiz — forma ularni
      // ro'yxat qilib ko'rsatadi.
      return fail(error.message, { status: 409, details: error.details })
    }
    console.error('Buyurtma yaratishda xato:', error)
    return fail(
      "Buyurtmani qabul qilib bo'lmadi. Birozdan keyin qayta urinib ko'ring.",
      { status: 500 }
    )
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
