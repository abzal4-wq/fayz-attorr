import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { variantSchema } from '@/lib/validation/admin'
import { safeRedirectPath } from '@/lib/safe-redirect'
import { makeOrderSchema } from '@/lib/validation/order'
import { makeLoginSchema } from '@/lib/validation/auth'

/** Testlarda tarjimon o'rniga: kalitning o'zini qaytaradi. */
const t = (key) => key

const variant = (over = {}) => ({
  sizeId: 'size_1',
  price: 100000,
  discountPercent: 0,
  stockQty: 5,
  inStock: true,
  ...over,
})

describe('variantSchema — narx (REGRESSIYA)', () => {
  /*
   * Haqiqiy xato edi: `price` uchun `.min(0)` turgani uchun narxi 0
   * bo'lgan mahsulot yaratilardi va mijoz undan bepul buyurtma bera
   * olardi (sinab tasdiqlangan: 3 dona, jami 0).
   * Nolga ikki yo'l bor edi — narx 0, yoki chegirma 100%.
   */
  test("narx 0 rad etiladi", () => {
    const r = variantSchema.safeParse(variant({ price: 0 }))
    assert.equal(r.success, false)
  })

  test('chegirma 100% rad etiladi (yakuniy narx 0 bo‘ladi)', () => {
    const r = variantSchema.safeParse(variant({ price: 150000, discountPercent: 100 }))
    assert.equal(r.success, false)
  })

  test('chegirma 99% o‘tadi', () => {
    assert.equal(variantSchema.safeParse(variant({ discountPercent: 99 })).success, true)
  })

  test('eng kichik narx 1 so‘m o‘tadi', () => {
    assert.equal(variantSchema.safeParse(variant({ price: 1 })).success, true)
  })

  test('manfiy narx rad etiladi', () => {
    assert.equal(variantSchema.safeParse(variant({ price: -1 })).success, false)
  })

  test('chegirma 100 dan katta rad etiladi', () => {
    assert.equal(variantSchema.safeParse(variant({ discountPercent: 150 })).success, false)
  })

  test('manfiy qoldiq rad etiladi', () => {
    assert.equal(variantSchema.safeParse(variant({ stockQty: -5 })).success, false)
  })

  test('odatiy variant o‘tadi', () => {
    assert.equal(variantSchema.safeParse(variant()).success, true)
  })
})

describe('safeRedirectPath — ochiq yo‘naltirishdan himoya', () => {
  const blocked = [
    'https://evil.com',
    'http://evil.com',
    '//evil.com',
    '/\\evil.com',
    'javascript:alert(1)',
    'data:text/html,<script>',
  ]
  for (const bad of blocked) {
    test(`bloklanadi: ${bad}`, () => {
      assert.equal(safeRedirectPath(bad), '/')
    })
  }

  const allowed = ['/profil', '/buyurtma', '/katalog?gender=MEN', '/atir/abc']
  for (const good of allowed) {
    test(`ruxsat: ${good}`, () => {
      assert.equal(safeRedirectPath(good), good)
    })
  }

  test("bo'sh/yaroqsiz -> /", () => {
    assert.equal(safeRedirectPath(''), '/')
    assert.equal(safeRedirectPath(null), '/')
    assert.equal(safeRedirectPath(undefined), '/')
  })
})

describe('orderSchema — narx mijozdan olinmaydi', () => {
  const base = {
    customerName: 'Aziz Karimov',
    customerPhone: '+998935554433',
    address: 'Toshkent, Chilonzor 19-kvartal, 45-uy',
    items: [{ variantId: 'v1', quantity: 2 }],
  }

  test('to‘g‘ri buyurtma o‘tadi', () => {
    assert.equal(makeOrderSchema(t).safeParse(base).success, true)
  })

  test('narx maydonlari sxemada YO‘Q (server o‘zi hisoblaydi)', () => {
    const parsed = makeOrderSchema(t).parse({
      ...base,
      items: [{ variantId: 'v1', quantity: 2, unitPrice: 1, price: 1 }],
      totalAmount: 1,
    })
    assert.equal(parsed.totalAmount, undefined)
    assert.equal(parsed.items[0].unitPrice, undefined)
    assert.equal(parsed.items[0].price, undefined)
  })

  test("bo'sh savat rad etiladi", () => {
    assert.equal(makeOrderSchema(t).safeParse({ ...base, items: [] }).success, false)
  })

  test('0 va manfiy miqdor rad etiladi', () => {
    for (const q of [0, -1]) {
      const r = makeOrderSchema(t).safeParse({ ...base, items: [{ variantId: 'v1', quantity: q }] })
      assert.equal(r.success, false, `quantity=${q} o'tib ketdi`)
    }
  })

  test('juda katta miqdor rad etiladi', () => {
    const r = makeOrderSchema(t).safeParse({ ...base, items: [{ variantId: 'v1', quantity: 9999 }] })
    assert.equal(r.success, false)
  })

  test('qisqa manzil rad etiladi', () => {
    assert.equal(makeOrderSchema(t).safeParse({ ...base, address: 'uy' }).success, false)
  })
})

describe('loginSchema', () => {
  test('telefon E.164 ga aylantiriladi', () => {
    const r = makeLoginSchema(t).parse({ phone: '93 555 44 33', password: 'parol123' })
    assert.equal(r.phone, '+998935554433')
  })

  test('noto‘g‘ri telefon rad etiladi', () => {
    assert.equal(makeLoginSchema(t).safeParse({ phone: '123', password: 'x' }).success, false)
  })
})
