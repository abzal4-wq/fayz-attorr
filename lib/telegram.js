/**
 * Telegram Bot API — kutubxonasiz, oddiy fetch orqali.
 *
 * ENG MUHIM QOIDA: Telegram javob bermasa yoki xato bersa, buyurtma
 * BARIBIR bazaga yoziladi. Bu yerdagi hech bir funksiya chaqiruvchiga
 * xato otmaydi — faqat log qiladi va natijani qaytaradi.
 */

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
