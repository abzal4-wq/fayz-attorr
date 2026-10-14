// Prisma CLI konfiguratsiyasi (migration, generate, studio uchun).
// `.ts` emas, `.mjs` — loyihada TypeScript ishlatilmaydi.
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

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
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
})
