import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { LIMITS } from '@/lib/auth/rate-limit'
import { makeOrderSchema } from '@/lib/validation/order'

const t = (key, vars) => (vars ? `${key}:${JSON.stringify(vars)}` : key)

describe('mehmon buyurtmasi: cheklov', () => {
  test('buyurtma uchun telefon bo‘yicha cheklov bor', () => {
    /*
     * Ro'yxatdan o'tish talab qilinmagandan keyin cheklovning
     * ikkinchi o'lchovi foydalanuvchi ID'si bo'la olmaydi — mehmonda
     * u yo'q. Shuning uchun telefon raqami bo'yicha hisoblanadi.
     */
    assert.ok(LIMITS.order, "order cheklovi yo'q")
    assert.ok(LIMITS['order-ip'], "order-ip cheklovi yo'q")
  })

  test('IP cheklovi telefon cheklovidan yumshoqroq', () => {
    // CGNAT: bitta tashqi IP ortida minglab abonent
    assert.ok(LIMITS['order-ip'].limit > LIMITS.order.limit)
  })
})

describe('mehmon buyurtmasi: forma', () => {
  const schema = makeOrderSchema(t)

  const valid = {
    customerName: 'Aziz Karimov',
    customerPhone: '+998 90 123 45 67',
    address: 'Toshkent sh., Chilonzor 5-kvartal, 12-uy',
    items: [{ variantId: 'v1', quantity: 1 }],
  }

  test('hisobsiz ham to‘liq buyurtma o‘tadi', () => {
    /*
     * Sxemada foydalanuvchi ID'si YO'Q va bo'lmasligi kerak:
     * buyurtmaning to'liqligi ism, telefon va manzilga tayanadi,
     * hisobga emas.
     */
    const parsed = schema.safeParse(valid)
    assert.ok(parsed.success, JSON.stringify(parsed.error?.issues))
    assert.equal(parsed.data.customerPhone, '+998901234567')
  })

  test('ism, telefon va manzil baribir SHART', () => {
    // Mehmon buyurtmasida do'konning yagona aloqa nuqtasi shu
    for (const field of ['customerName', 'customerPhone', 'address']) {
      const body = { ...valid, [field]: '' }
      assert.equal(
        schema.safeParse(body).success,
        false,
        `${field} bo'sh bo'lsa ham o'tdi`
      )
    }
  })

  test('narx yuborilsa ham e‘tiborsiz qoldiriladi', () => {
    // Narx faqat serverda hisoblanadi — mehmon buyurtmasida ham
    const parsed = schema.safeParse({
      ...valid,
      items: [{ variantId: 'v1', quantity: 1, unitPrice: 1 }],
    })
    assert.ok(parsed.success)
    assert.equal(parsed.data.items[0].unitPrice, undefined)
  })
})

describe('mehmon buyurtmasi: to‘siqlar olib tashlandi', () => {
  test('middleware /buyurtma ni qo‘riqlamaydi', () => {
    /*
     * Fayl matni bo'yicha tekshiriladi: middleware'ni testda ishga
     * tushirish uchun Next so'rov konteksti kerak. Qo'riqlash
     * qaytib qo'shilsa, mehmon buyurtmasi jimgina ishlamay qoladi —
     * odam savatdan kirish sahifasiga tushib qoladi.
     */
    const source = readFileSync('middleware.js', 'utf8')

    const match = source.match(/USER_PROTECTED_PREFIXES\s*=\s*\[([^\]]*)\]/)
    assert.ok(match, 'USER_PROTECTED_PREFIXES topilmadi')
    assert.ok(
      !match[1].includes('/buyurtma'),
      "/buyurtma yana qo'riqlanadigan yo'llar ro'yxatida"
    )
  })

  test('buyurtma route‘i kirishni talab qilmaydi', () => {
    const source = readFileSync('app/api/buyurtma/route.js', 'utf8')

    // Kirish talab qilingan paytdagi 401 qaytarish olib tashlangan
    assert.ok(
      !source.includes('orderLoginRequired'),
      "route hamon kirishni talab qiladi"
    )
    // Mehmonda userId null bo'lishi mumkin
    assert.ok(
      source.includes('user?.id'),
      'userId mehmon uchun ixtiyoriy emas'
    )
  })
})
