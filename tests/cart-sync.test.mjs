import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { applySnapshot, cartTotal, hasUnavailable } from '@/lib/cart-store'

/*
 * Savat brauzerda mahsulot QO'SHILGAN paytdagi ma'lumot bilan saqlanadi.
 * Bu testlar serverdan kelgan joriy holat qanday qo'llanishini tekshiradi
 * (lib/cart-sync.js -> applySnapshot).
 */

const OLD = {
  variantId: 'v1',
  name: 'Eski nom',
  brandName: 'Chanel',
  sizeLabel: '100 ml',
  slug: 'eski-slug',
  imageUrl: 'https://res.cloudinary.com/x/image/upload/ochirilgan.jpg',
  unitPrice: 2_980_000,
  quantity: 2,
}

const fresh = (over = {}) => ({
  name: 'Chanel Chance Eau Splendide',
  brandName: 'Chanel',
  sizeLabel: '100 ml',
  slug: 'chanel-chance',
  imageUrl: 'https://res.cloudinary.com/x/image/upload/yangi.jpg',
  unitPrice: 2_682_000,
  stockQty: 16,
  available: true,
  ...over,
})

describe('savatni serverdagi holat bilan yangilash', () => {
  test("o'lik rasm havolasi yangisiga almashadi", () => {
    // "Rasm abadiy yuklanayotgandek" turishining sababi shu edi
    const { items } = applySnapshot([OLD], { v1: fresh() })
    assert.equal(items[0].imageUrl, 'https://res.cloudinary.com/x/image/upload/yangi.jpg')
    assert.equal(items[0].name, 'Chanel Chance Eau Splendide')
  })

  test('rasmi o‘chirilgan mahsulotda havola null bo‘ladi (belgi chiqadi)', () => {
    const { items } = applySnapshot([OLD], { v1: fresh({ imageUrl: null }) })
    assert.equal(items[0].imageUrl, null)
  })

  test("narx o'zgargani aytiladi va savatda yangisi turadi", () => {
    const { items, changes } = applySnapshot([OLD], { v1: fresh() })
    assert.equal(items[0].unitPrice, 2_682_000)
    assert.deepEqual(changes.priceChanged, ['v1'])
  })

  test('narx o‘zgarmasa xabar yo‘q', () => {
    const { changes } = applySnapshot([{ ...OLD, unitPrice: 2_682_000 }], { v1: fresh() })
    assert.deepEqual(changes.priceChanged, [])
  })

  test("o'chirilgan mahsulot savatdan O'CHMAYDI, lekin belgilanadi", () => {
    // Mijoz nima bo'lganini ko'rishi kerak — jimgina yo'qolmasin
    const { items, changes } = applySnapshot([OLD], {})
    assert.equal(items.length, 1)
    assert.equal(items[0].available, false)
    assert.deepEqual(changes.unavailable, ['v1'])
  })

  test('tugagan mahsulot belgilanadi', () => {
    const { items, changes } = applySnapshot([OLD], { v1: fresh({ available: false, stockQty: 0 }) })
    assert.equal(items[0].available, false)
    assert.deepEqual(changes.unavailable, ['v1'])
  })

  test('miqdor qoldiqdan ko‘p bo‘lsa qoldiqqa tushiriladi va aytiladi', () => {
    // Checkout'da xato berib to'xtatgandan ko'ra yaxshi
    const { items, changes } = applySnapshot([{ ...OLD, quantity: 5 }], { v1: fresh({ stockQty: 3 }) })
    assert.equal(items[0].quantity, 3)
    assert.deepEqual(changes.quantityReduced, ['v1'])
  })

  test("miqdor o'zgartirilmasa (qoldiq yetarli) xabar yo'q", () => {
    const { items, changes } = applySnapshot([OLD], { v1: fresh({ stockQty: 2 }) })
    assert.equal(items[0].quantity, 2)
    assert.deepEqual(changes.quantityReduced, [])
  })
})

describe('jami summa va buyurtmaga ruxsat', () => {
  test('sotuvda yo‘q mahsulot jami summaga KIRMAYDI', () => {
    const items = [
      { ...OLD, unitPrice: 100, quantity: 1, available: true },
      { ...OLD, variantId: 'v2', unitPrice: 999, quantity: 1, available: false },
    ]
    assert.equal(cartTotal(items), 100)
  })

  test('yangilanmagan (eski) savat elementlari ham hisoblanadi', () => {
    // `available` maydoni yo'q eski savatlar buzilmasin
    assert.equal(cartTotal([{ ...OLD, unitPrice: 100, quantity: 2 }]), 200)
    assert.equal(hasUnavailable([OLD]), false)
  })

  test('sotuvda yo‘q mahsulot bo‘lsa buyurtma to‘siladi', () => {
    assert.equal(hasUnavailable([{ ...OLD, available: false }]), true)
  })
})
