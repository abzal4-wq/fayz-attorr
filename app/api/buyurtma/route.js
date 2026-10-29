import { fail, ok, readJson } from '@/lib/api'
import { consumeAttempt, consumeAttemptPair, getClientIp } from '@/lib/auth/rate-limit'
import { normalizePhone } from '@/lib/auth/phone'
import { getCurrentUser } from '@/lib/auth/session'
import { OrderError, createOrder } from '@/lib/orders'
import { notifyNewOrder } from '@/lib/telegram'
import { makeOrderSchema } from '@/lib/validation/order'
import { formatZodError } from '@/lib/validation/auth'
import { getT } from '@/lib/i18n/server'

export async function POST(request) {
  const ip = getClientIp(request)
  const t = await getT()

  const tooMany = (limit) =>
    fail(
      t('errors.tooManyAttempts', {
        minutes: Math.ceil(limit.retryAfterSeconds / 60),
      }),
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    )

  /*
   * Tana cheklovdan OLDIN o'qiladi — telefon raqami kerak.
   *
   * Buyurtma endi ro'yxatdan o'tmasdan ham beriladi, ya'ni
   * foydalanuvchi ID'si bo'lmasligi mumkin. Cheklovning ikkinchi
   * o'lchovi shuning uchun telefon raqami bo'ladi: IP yolg'iz
   * yetarli emas, O'zbekistonda operatorlar CGNAT ishlatadi va
   * bitta tashqi IP ortida minglab abonent turadi.
   */
  const body = await readJson(request)
  if (!body) {
    // Buzuq so'rov ham hisoblansin
    const limit = await consumeAttempt('order-ip', ip)
    if (!limit.allowed) return tooMany(limit)
    return fail(t('errors.badRequest'))
  }

  const parsed = makeOrderSchema(t).safeParse(body)

  // Telefon xato formatda bo'lsa ham IP hisoblanadi
  const phone = parsed.success
    ? parsed.data.customerPhone
    : normalizePhone(body?.customerPhone)

  const limit = await consumeAttemptPair('order', phone, ip)
  if (!limit.allowed) return tooMany(limit)

  if (!parsed.success) {
    const { fieldErrors, formErrors } = formatZodError(parsed.error)
    return fail(formErrors[0] ?? t('errors.checkData'), { fieldErrors })
  }

  /*
   * Kirgan bo'lsa buyurtma hisobiga bog'lanadi va profilidagi
   * tarixda ko'rinadi. Mehmon buyurtmasida `userId` null bo'ladi,
   * lekin buyurtmaning o'zi to'liq: ism, telefon va manzil
   * nusxasi har holda saqlanadi.
   */
  const user = await getCurrentUser()

  const { items, ...customer } = parsed.data

  let order
  try {
    // `t` ham beriladi: "mahsulot tugab qoldi" kabi xabarlar mijoz
    // tilida bo'lishi kerak. Telegram xabari esa baribir o'zbekcha —
    // uni admin o'qiydi, mijoz emas.
    order = await createOrder({ items, customer, userId: user?.id ?? null, t })
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
