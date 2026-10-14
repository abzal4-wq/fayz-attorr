import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Prisma 7 to'g'ridan-to'g'ri ulanish uchun driver adapter talab qiladi.
// Pooled DATABASE_URL ishlatiladi — serverless'da ulanishlar tez tugab qolmasligi uchun.
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL o\'rnatilmagan. .env faylni tekshiring.')
  }
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

// Dev rejimida hot reload har safar yangi klient yaratmasligi uchun
// globalThis'da saqlanadi — aks holda baza ulanishlari tugaydi.
const globalForPrisma = globalThis

export const prisma = globalForPrisma.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma
}
