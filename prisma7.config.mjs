// Prisma CLI konfiguratsiyasi (migration, generate, studio uchun).
// `.ts` emas, `.mjs` — loyihada TypeScript ishlatilmaydi.
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

/**
 * Ulanishni kutish vaqti: 30 soniya (standart 5).
 *
 * NEGA: Neon bepul tarifi 5 daqiqa ishlatilmagan bazani "uxlatadi".
 * Uyg'onish + O'zbekistondan Frankfurt'gacha ulanish (o'lchangan: 1.1s
 * to'g'ridan-to'g'ri, 4.8s pooler orqali) 5 soniyadan oshib ketadi va
 * `migrate deploy` "P1001: Can't reach database server" bilan yiqilardi
 * — baza ishlab turgan bo'lsa ham.
 *
 * Faqat CLI (migratsiya) uchun. Saytning o'zi Vercel'da, bazaning
 * yonida (fra1) ishlaydi va bunga muhtoj emas.
 */
function withConnectTimeout(url, seconds = 30) {
  if (!url) return url
  try {
    const parsed = new URL(url)
    if (!parsed.searchParams.has('connect_timeout')) {
      parsed.searchParams.set('connect_timeout', String(seconds))
    }
    return parsed.toString()
  } catch {
    return url
  }
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.mjs',
  },
  datasource: {
    // Migration'lar unpooled ulanish orqali ketadi — Neon'ning PgBouncer
    // pooler'i advisory lock'ni qo'llab-quvvatlamaydi va migration osilib qoladi.
    // Ilova runtime'i esa pooled DATABASE_URL dan foydalanadi (lib/prisma.js).
    url: withConnectTimeout(process.env.DIRECT_URL || process.env.DATABASE_URL),
  },
})
