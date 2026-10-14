/**
 * Telegram Bot API — kutubxonasiz, oddiy fetch orqali.
 *
 * ENG MUHIM QOIDA: Telegram javob bermasa yoki xato bersa, buyurtma
 * BARIBIR bazaga yoziladi. Bu yerdagi hech bir funksiya chaqiruvchiga
 * xato otmaydi — faqat log qiladi va natijani qaytaradi.
 */

import { formatDateTime, formatSom } from '@/lib/format'
import { formatPhone } from '@/lib/auth/phone'

const API = 'https://api.telegram.org/bot'

function token() {
  return process.env.TELEGRAM_BOT_TOKEN || ''
}

/** Vergul bilan ajratilgan chat ID'lar ro'yxati. */
export function getAdminChatIds() {
  return (process.env.TELEGRAM_ADMIN_CHAT_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

export function isTelegramConfigured() {
  return Boolean(token()) && getAdminChatIds().length > 0
}

/**
 * Bot API chaqiruvi. Hech qachon xato otmaydi.
 * @returns {Promise<{ok: boolean, result?: any, error?: string}>}
 */
async function call(method, payload, { timeoutMs = 8000 } = {}) {
  if (!token()) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN o'rnatilmagan" }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${API}${token()}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload ?? {}),
      signal: controller.signal,
      cache: 'no-store',
    })

    const data = await res.json().catch(() => null)

    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.description || `HTTP ${res.status}` }
    }

    return { ok: true, result: data.result }
  } catch (error) {
    return {
      ok: false,
      error: error?.name === 'AbortError' ? 'Telegram javob bermadi' : error.message,
    }
  } finally {
    clearTimeout(timer)
  }
}

/** Bot haqida ma'lumot (admin paneldagi holat uchun). */
export async function getBotInfo() {
  const res = await call('getMe', {}, { timeoutMs: 5000 })
  return res.ok ? res.result : null
}

export { call as telegramCall }

/** Telegram HTML rejimida xavfli belgilarni ekranlaydi. */
function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Yangi buyurtma haqida adminlarga xabar.
 *
 * HECH QACHON xato otmaydi: Telegram ishlamasa ham buyurtma bazada qoladi.
 * Natija faqat log uchun qaytariladi.
 */
export async function notifyNewOrder(order) {
  const chatIds = getAdminChatIds()
  if (chatIds.length === 0) {
    return { ok: false, error: "TELEGRAM_ADMIN_CHAT_IDS bo'sh" }
  }

  const lines = order.items
    .map(
      (item) =>
        `• ${escapeHtml(item.productName)} (${escapeHtml(item.brandName)}) — ` +
        `${escapeHtml(item.sizeLabel)} × ${item.quantity} = ` +
        `${escapeHtml(formatSom(Number(item.unitPrice) * item.quantity))}`
    )
    .join('\n')

  const text =
    `🆕 <b>YANGI BUYURTMA #${order.orderNumber}</b>\n\n` +
    `👤 ${escapeHtml(order.customerName)}\n` +
    `📞 ${escapeHtml(formatPhone(order.customerPhone))}\n` +
    `📍 ${escapeHtml(order.address)}\n` +
    (order.comment ? `💬 ${escapeHtml(order.comment)}\n` : '') +
    `\n🛍 <b>Mahsulotlar:</b>\n${lines}\n\n` +
    `💰 <b>Jami: ${escapeHtml(formatSom(Number(order.totalAmount)))}</b>\n` +
    `🕐 ${escapeHtml(formatDateTime(order.createdAt))}`

  const results = await Promise.all(
    chatIds.map((chatId) =>
      call('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      })
    )
  )

  const failed = results.filter((r) => !r.ok)
  if (failed.length > 0) {
    console.error(
      `Telegram: ${failed.length}/${chatIds.length} chatga yuborilmadi —`,
      failed.map((f) => f.error).join('; ')
    )
  }

  return { ok: failed.length < results.length, sent: results.length - failed.length }
}
