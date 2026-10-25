// Test ishga tushishidan oldin import yechuvchini ro'yxatdan o'tkazadi.
import { register } from 'node:module'

/*
 * Testlar bazaga ULANMAYDI, lekin ba'zi modullar (masalan
 * `lib/auth/rate-limit.js`) `lib/prisma.js` ni import qiladi, u esa
 * import paytidayoq `DATABASE_URL` yo'qligidan xato tashlaydi.
 *
 * Shuning uchun soxta qiymat qo'yiladi. Allaqachon o'rnatilgan
 * bo'lsa tegilmaydi — CI o'z qiymatini beradi.
 */
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test'
process.env.DIRECT_URL ??= process.env.DATABASE_URL
process.env.JWT_SECRET ??= 'test-uchun-soxta-kalit-kamida-32-belgi-bolsin'
process.env.ADMIN_JWT_SECRET ??= 'test-uchun-boshqa-soxta-kalit-32-belgi-kerak'

register('./resolver.mjs', import.meta.url)
