import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adjustStockForStatusChange } from '@/lib/orders'
import {
  answerCallback,
  editMessageText,
  formatOrderMessage,
  isAdminChat,
  isWebhookAuthorized,
  sendMessage,
  REMOVE_KEYBOARD,
  REQUEST_CONTACT_KEYBOARD,
} from '@/lib/telegram'
import {
  RESET_START_PREFIX,
  RESET_TTL_SECONDS,
  attachChatToRequest,
  issueCode,
} from '@/lib/auth/reset'
import { ORDER_STATUS_LABELS } from '@/lib/validation/admin'

/**
 * Telegram webhook — inline tugmalar bosilganda chaqiriladi.
 *
 * Himoya uchta qatlam:
 *  1. `X-Telegram-Bot-Api-Secret-Token` sarlavhasi (setWebhook da o'rnatiladi)
 *  2. Tugmani bosgan chat admin ro'yxatida bo'lishi shart
 *  3. callback_data qat'iy shaklda tekshiriladi
 *
 * Telegram har doim 200 kutadi: xato kodi qaytarsak, u xabarni qayta-qayta
 * yuboraveradi. Shuning uchun muammoda ham 200 qaytariladi.
 */

const ALLOWED_STATUSES = ['CONFIRMED', 'CANCELLED']

function okResponse() {
  return NextResponse.json({ ok: true })
}

/** Status o'zgargandan keyingi xabar matni. */
/**
 * Status o'zgargandan keyingi xabar matni — yangi buyurtma xabari bilan
 * BIR XIL funksiyadan (lib/telegram.js, formatOrderMessage), aks holda
 * tasdiqlangandan keyin xarita havolasi kabi qismlar yo'qolardi.
 */
function buildMessage(order, statusLabel, actorName) {
  return formatOrderMessage(order, { title: 'BUYURTMA', statusLabel, actorName })
}

/* ------------------- Parolni tiklash (oddiy xabarlar) ------------------- */

/**
 * `/start tiklash_<token>` — saytdagi havoladan kelgan foydalanuvchi.
 *
 * Bu yerda token FAQAT urinishni shu chatga bog'laydi. Kod hali
 * berilmaydi: avval Telegram raqamni tasdiqlashi kerak, aks holda
 * havolani qo'lga kiritgan har kim kodni olib qo'yardi.
 */
async function handleResetStart(chatId, token) {
  const attached = await attachChatToRequest(token, chatId)

  if (!attached.ok) {
    await sendMessage(
      chatId,
      attached.reason === 'expired'
        ? "⏳ Havolaning muddati o'tgan. Saytda qaytadan urinib ko'ring."
        : "❌ Havola yaroqsiz. Saytda qaytadan urinib ko'ring.",
      { reply_markup: REMOVE_KEYBOARD }
    )
    return
  }

  await sendMessage(
    chatId,
    '🔐 <b>Parolni tiklash</b>\n\n' +
      "Hisobingiz haqiqatan sizga tegishli ekanini tekshirishimiz kerak.\n\n" +
      'Pastdagi <b>"📱 Raqamni yuborish"</b> tugmasini bosing — ' +
      'Telegram raqamingizni o\'zi yuboradi.',
    { reply_markup: REQUEST_CONTACT_KEYBOARD }
  )
}

/**
 * Telegram tasdiqlagan raqam keldi.
 *
 * ENG MUHIM TEKSHIRUV: `contact.user_id === from.id`.
 *
 * "Raqamni yuborish" tugmasi foydalanuvchining o'z raqamini yuboradi,
 * lekin odam QO'LDA istalgan kontakt kartasini ham yuborishi mumkin.
 * Busiz hujumchi qurbonning kontaktini yuborib, uning hisobiga kod
 * oldirib olardi.
 */
async function handleContact(message, chatId) {
  const contact = message.contact

  if (!contact?.user_id || contact.user_id !== message.from?.id) {
    await sendMessage(
      chatId,
      "❌ Faqat o'zingizning raqamingizni yuborishingiz mumkin. " +
        'Tugmani bosib yuboring.',
      { reply_markup: REQUEST_CONTACT_KEYBOARD }
    )
    return
  }

  const issued = await issueCode(chatId, contact.phone_number)

  if (!issued.ok) {
    /*
     * "Raqam mos kelmadi" deb aytiladi, lekin hisobdagi raqam
     * KO'RSATILMAYDI — aks holda bot orqali birovning raqamini
     * bilib olish mumkin bo'lardi.
     */
    const text =
      issued.reason === 'phone-mismatch'
        ? '❌ Bu raqam hisobda ko\'rsatilgan raqam bilan mos kelmadi.\n\n' +
          "Parolni tiklash faqat hisobdagi raqam egasi uchun ishlaydi."
        : "⏳ Ochiq so'rov topilmadi yoki muddati o'tgan. " +
          "Saytda qaytadan urinib ko'ring."

    await sendMessage(chatId, text, { reply_markup: REMOVE_KEYBOARD })
    return
  }

  const minutes = Math.round(RESET_TTL_SECONDS / 60)

  await sendMessage(
    chatId,
    '✅ Raqam tasdiqlandi.\n\n' +
      `Tasdiqlash kodi: <b><code>${issued.code}</code></b>\n\n` +
      `Kodni saytdagi maydonga kiriting. Kod ${minutes} daqiqa amal qiladi.\n\n` +
      '⚠️ Bu kodni hech kimga bermang.',
    { reply_markup: REMOVE_KEYBOARD }
  )
}

/**
 * Oddiy xabarlar.
 *
 * Diqqat: bu yerda admin tekshiruvi YO'Q va bo'lmasligi kerak —
 * parolni tiklayotgan mijoz admin emas. Shuning uchun har bir
 * tarmoq alohida qat'iy tekshiriladi.
 */
async function handleMessage(message) {
  const chatId = message.chat?.id
  if (!chatId) return

  if (message.contact) {
    await handleContact(message, chatId)
    return
  }

  const text = String(message.text ?? '').trim()
  if (!text.startsWith('/start')) return

  const payload = text.slice('/start'.length).trim()

  if (payload.startsWith(RESET_START_PREFIX)) {
    await handleResetStart(chatId, payload.slice(RESET_START_PREFIX.length))
    return
  }

  // Parametrsiz /start — bot jim turmasligi uchun qisqa javob
  await sendMessage(
    chatId,
    '👋 <b>FAYZ ATTOR</b>\n\nBu bot buyurtmalar va parolni tiklash uchun ishlatiladi.',
    { reply_markup: REMOVE_KEYBOARD }
  )
}

export async function POST(request) {
  // 1-qatlam: maxfiy sarlavha (nega production'da shart — funksiya izohida)
  const authorized = isWebhookAuthorized(
    request.headers.get('x-telegram-bot-api-secret-token'),
    process.env.TELEGRAM_WEBHOOK_SECRET,
    process.env.NODE_ENV
  )
  if (!authorized) {
    if (!process.env.TELEGRAM_WEBHOOK_SECRET) {
      console.error("TELEGRAM_WEBHOOK_SECRET o'rnatilmagan — webhook so'rovi rad etildi")
    }
    // Telegram emas — javob bermaymiz
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const update = await request.json().catch(() => null)

  /*
   * Oddiy xabarlar — parolni tiklash jarayoni.
   *
   * Xato bo'lsa ham 200 qaytariladi: aks holda Telegram shu
   * xabarni qayta-qayta yuboraveradi va bot halqaga tushadi.
   */
  if (update?.message) {
    try {
      await handleMessage(update.message)
    } catch (error) {
      console.error('Telegram xabar xatosi:', error?.message)
    }
    return okResponse()
  }

  const callback = update?.callback_query
  if (!callback) return okResponse()

  const chatId = callback.message?.chat?.id
  const messageId = callback.message?.message_id

  // 2-qatlam: faqat admin chatlari
  if (!isAdminChat(chatId)) {
    await answerCallback(callback.id, 'Sizda ruxsat yo\'q', { alert: true })
    return okResponse()
  }

  // 3-qatlam: callback_data shakli
  const parts = String(callback.data ?? '').split(':')
  if (parts.length !== 3 || parts[0] !== 'order') {
    await answerCallback(callback.id, "Buyruq tushunarsiz")
    return okResponse()
  }

  const [, orderId, status] = parts
  if (!ALLOWED_STATUSES.includes(status)) {
    await answerCallback(callback.id, "Bu holat qo'llab-quvvatlanmaydi")
    return okResponse()
  }

  try {
    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    })

    if (!existing) {
      await answerCallback(callback.id, 'Buyurtma topilmadi', { alert: true })
      return okResponse()
    }

    if (existing.status === status) {
      await answerCallback(
        callback.id,
        `Buyurtma allaqachon "${ORDER_STATUS_LABELS[status]}" holatida`
      )
      return okResponse()
    }

    await prisma.order.update({ where: { id: orderId }, data: { status } })
    await adjustStockForStatusChange(orderId, existing.status, status)

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    const actorName = [callback.from?.first_name, callback.from?.last_name]
      .filter(Boolean)
      .join(' ')

    await answerCallback(
      callback.id,
      `Holat: ${ORDER_STATUS_LABELS[status]}`
    )

    if (chatId && messageId) {
      await editMessageText(
        chatId,
        messageId,
        buildMessage(order, ORDER_STATUS_LABELS[status], actorName)
      )
    }
  } catch (error) {
    console.error('Telegram webhook xatosi:', error?.message)
    await answerCallback(callback.id, 'Xatolik yuz berdi', { alert: true })
  }

  return okResponse()
}
