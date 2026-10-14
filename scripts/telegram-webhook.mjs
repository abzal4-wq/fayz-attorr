import 'dotenv/config'

/**
 * Telegram webhook'ini boshqarish.
 *
 *   node scripts/telegram-webhook.mjs info        — hozirgi holat
 *   node scripts/telegram-webhook.mjs set         — NEXT_PUBLIC_SITE_URL ga o'rnatish
 *   node scripts/telegram-webhook.mjs set <url>   — boshqa manzilga o'rnatish
 *   node scripts/telegram-webhook.mjs delete      — o'chirish
 *   node scripts/telegram-webhook.mjs chats       — kim botga /start bosganini ko'rish
 *
 * Webhook faqat HTTPS manzilda ishlaydi — ya'ni deploy qilingandan keyin.
 */

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET
const SITE = process.env.NEXT_PUBLIC_SITE_URL

if (!TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN .env da yo'q")
  process.exit(1)
}

async function api(method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
  })
  return res.json()
}

const [command, argument] = process.argv.slice(2)

switch (command) {
  case 'info': {
    const me = await api('getMe')
    const hook = await api('getWebhookInfo')
    console.log('Bot:', me.ok ? `@${me.result.username}` : me.description)
    console.log('Webhook URL:', hook.result?.url || "(o'rnatilmagan)")
    console.log('Kutilayotgan xabarlar:', hook.result?.pending_update_count ?? 0)
    if (hook.result?.last_error_message) {
      console.log('Oxirgi xato:', hook.result.last_error_message)
    }
    break
  }

  case 'set': {
    const base = argument || SITE
    if (!base || base.startsWith('http://')) {
      console.error(
        "HTTPS manzil kerak. Deploy qilgandan keyin ishga tushiring,\n" +
          'yoki: node scripts/telegram-webhook.mjs set https://fayzattor.uz'
      )
      process.exit(1)
    }
    const url = `${base.replace(/\/$/, '')}/api/telegram/webhook`
    const res = await api('setWebhook', {
      url,
      secret_token: SECRET || undefined,
      allowed_updates: ['callback_query'],
      drop_pending_updates: true,
    })
    console.log(res.ok ? `Webhook o'rnatildi: ${url}` : `Xato: ${res.description}`)
    break
  }

  case 'delete': {
    const res = await api('deleteWebhook', { drop_pending_updates: true })
    console.log(res.ok ? "Webhook o'chirildi" : `Xato: ${res.description}`)
    break
  }

  case 'chats': {
    // Webhook o'rnatilgan bo'lsa getUpdates ishlamaydi
    const hook = await api('getWebhookInfo')
    if (hook.result?.url) {
      console.log(
        "Webhook o'rnatilgan — avval uni o'chiring:\n" +
          '  node scripts/telegram-webhook.mjs delete'
      )
      break
    }
    const res = await api('getUpdates', { limit: 50 })
    if (!res.ok) {
      console.error('Xato:', res.description)
      break
    }
    const chats = new Map()
    for (const u of res.result) {
      const chat = u.message?.chat || u.callback_query?.message?.chat
      if (chat) {
        chats.set(
          chat.id,
          [chat.first_name, chat.last_name, chat.title, chat.username && `@${chat.username}`]
            .filter(Boolean)
            .join(' ')
        )
      }
    }
    if (chats.size === 0) {
      console.log(
        "Hech kim botga yozmagan.\n" +
          'Adminlar botni ochib /start bosishi kerak, keyin shu buyruqni qayta ishga tushiring.'
      )
      break
    }
    console.log('Botga yozgan chatlar (TELEGRAM_ADMIN_CHAT_IDS uchun):')
    for (const [id, name] of chats) console.log(`  ${id}  — ${name}`)
    break
  }

  default:
    console.log(
      'Buyruqlar: info | set [url] | delete | chats\n\n' +
        '  info    — bot va webhook holati\n' +
        '  set     — webhook o\'rnatish (HTTPS kerak, deploy\'dan keyin)\n' +
        '  delete  — webhook o\'chirish\n' +
        '  chats   — kim botga /start bosganini ko\'rish'
    )
}
