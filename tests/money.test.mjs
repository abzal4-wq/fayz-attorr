import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { formatSom, createMoney, priceAfterDiscount } from '@/lib/format'

describe('formatSom (REGRESSIYA: server va brauzer bir xil chiqarishi)', () => {
  /*
   * Haqiqiy xato edi: guruhlash `Intl.NumberFormat('uz-UZ')` bilan
   * qilinardi va natija muhitga bog'liq edi — Node "410 000"
   * (bo'shliq), Chrome "410,000" (vergul). Narx komponentlari client
   * bo'lgani uchun raqam hydration'dan keyin ko'z oldida o'zgarardi
   * va React hydration mismatch berardi.
   *
   * Shuning uchun guruhlash qo'lda. Test kutilgan AYNAN satrni
   * tekshiradi — Intl ga qaytilsa darhol yiqiladi.
   */
  const cases = [
    [0, "0 so'm"],
    [1, "1 so'm"],
    [999, "999 so'm"],
    [1000, "1 000 so'm"],
    [410000, "410 000 so'm"],
    [1250000, "1 250 000 so'm"],
    [999999999, "999 999 999 so'm"],
  ]

  for (const [input, expected] of cases) {
    test(`${input} -> "${expected}"`, () => {
      assert.equal(formatSom(input), expected)
    })
  }

  test('ajratuvchi oddiy bo‘shliq (tor bo‘shliq emas)', () => {
    const out = formatSom(410000)
    assert.ok(!/[  ]/.test(out), 'tor/uzilmas bo‘shliq topildi')
    assert.ok(out.includes(' '), 'oddiy bo‘shliq yo‘q')
  })

  test('vergul ishlatilmaydi (ba‘zi tillarda kasr ajratuvchisi)', () => {
    assert.ok(!formatSom(1250000).includes(','))
  })

  test('suffikssiz', () => {
    assert.equal(formatSom(410000, { withSuffix: false }), '410 000')
  })

  test('manfiy va yaroqsiz qiymatlar', () => {
    assert.equal(formatSom(-5000), "-5 000 so'm")
    assert.equal(formatSom(NaN), "0 so'm")
    assert.equal(formatSom(null), "0 so'm")
    assert.equal(formatSom(undefined), "0 so'm")
  })
})

describe('createMoney — valyuta so‘zi tildan olinadi', () => {
  test('uch til', () => {
    assert.equal(createMoney(() => "so'm")(450000), "450 000 so'm")
    assert.equal(createMoney(() => 'сум')(450000), '450 000 сум')
    assert.equal(createMoney(() => 'UZS')(450000), '450 000 UZS')
  })
})

describe('priceAfterDiscount', () => {
  const cases = [
    [100000, 0, 100000],
    [100000, 10, 90000],
    [100000, 50, 50000],
    [100000, 100, 0],
    [120000, 15, 102000],
    [99999, 33, 66999],
  ]
  for (const [price, discount, expected] of cases) {
    test(`${price} - ${discount}% = ${expected}`, () => {
      assert.equal(priceAfterDiscount(price, discount), expected)
    })
  }

  test('natija har doim butun son', () => {
    assert.ok(Number.isInteger(priceAfterDiscount(99999, 33)))
  })
})
