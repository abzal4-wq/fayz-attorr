import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adjustStockForStatusChange } from '@/lib/orders'
import {
  answerCallback,
  editMessageText,
  isAdminChat,
} from '@/lib/telegram'
import { ORDER_STATUS_LABELS } from '@/lib/validation/admin'
import { formatDateTime, formatSom } from '@/lib/format'
import { formatPhone } from '@/lib/auth/phone'
import { toNumber } from '@/lib/admin-api'

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

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Status o'zgargandan keyingi xabar matni. */
function buildMessage(order, statusLabel, actorName) {
  const lines = order.items
    .map(
      (item) =>
        `• ${escapeHtml(item.productName)} (${escapeHtml(item.brandName)}) — ` +
        `${escapeHtml(item.sizeLabel)} × ${item.quantity} = ` +
        `${escapeHtml(formatSom(toNumber(item.unitPrice) * item.quantity))}`
    )
    .join('\n')

  return (
    `🆕 <b>BUYURTMA #${order.orderNumber}</b>\n\n` +
    `👤 ${escapeHtml(order.customerName)}\n` +
    `📞 ${escapeHtml(formatPhone(order.customerPhone))}\n` +
    `📍 ${escapeHtml(order.address)}\n` +
    (order.comment ? `💬 ${escapeHtml(order.comment)}\n` : '') +
    `\n🛍 <b>Mahsulotlar:</b>\n${lines}\n\n` +
    `💰 <b>Jami: ${escapeHtml(formatSom(toNumber(order.totalAmount)))}</b>\n` +
    `🕐 ${escapeHtml(formatDateTime(order.createdAt))}\n\n` +
    `📌 <b>Holat: ${escapeHtml(statusLabel)}</b>` +
    (actorName ? ` — ${escapeHtml(actorName)}` : '')
  )
}

export async function POST(request) {
  // 1-qatlam: maxfiy sarlavha
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secret) {
    const header = request.headers.get('x-telegram-bot-api-secret-token')
    if (header !== secret) {
      // Telegram emas — javob bermaymiz
      return NextResponse.json({ ok: false }, { status: 401 })
    }
  }

  const update = await request.json().catch(() => null)
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
