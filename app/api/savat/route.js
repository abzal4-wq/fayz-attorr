import { fail, ok, readJson } from '@/lib/api'
import { MAX_SYNC_ITEMS, getCartSnapshot } from '@/lib/cart-sync'

/**
 * Savatdagi variantlarning joriy holati (faqat o'qish).
 *
 * POST, GET emas: savatda 50 tagacha ID bo'lishi mumkin — URL'ga
 * sig'dirish noqulay. Hech narsa yozilmaydi, shuning uchun kirish
 * talab qilinmaydi.
 */
export async function POST(request) {
  const body = await readJson(request)
  const ids = body?.variantIds

  if (
    !Array.isArray(ids) ||
    ids.length > MAX_SYNC_ITEMS ||
    !ids.every((id) => typeof id === 'string' && id.length > 0 && id.length <= 64)
  ) {
    return fail("So'rov formati noto'g'ri")
  }

  try {
    return ok({ items: await getCartSnapshot(ids) })
  } catch (error) {
    console.error('Savatni yangilab bo\'lmadi:', error?.message)
    // Savat eski ma'lumot bilan ishlashda davom etadi — bu xato emas
    return fail('Vaqtincha mavjud emas', { status: 503 })
  }
}
