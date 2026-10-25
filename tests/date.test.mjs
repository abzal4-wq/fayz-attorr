import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { formatDateTime, formatDate, currentShopYear } from '@/lib/format'

describe('sanalar Toshkent vaqtida (REGRESSIYA)', () => {
  /*
   * Haqiqiy xato edi: `date.getHours()` muhitning mahalliy vaqtini
   * olardi. Vercel UTC'da ishlaydi, ya'ni jonli saytda hamma sana
   * 5 soat orqada chiqardi — 26-oktabr 02:30 dagi buyurtma
   * "25.10.2026, 21:30" bo'lib ko'rinardi, sana ham noto'g'ri.
   *
   * Test server vaqt zonasiga BOG'LIQ BO'LMASLIGI kerak: shu sababli
   * kirish ham, kutilgan natija ham qat'iy yozilgan.
   */
  const cases = [
    ['2026-10-25T21:30:00Z', '26.10.2026, 02:30'], // kun chegarasidan o'tadi
    ['2026-10-25T19:00:00Z', '26.10.2026, 00:00'], // yarim tun 00:00, 24:00 emas
    ['2026-01-01T19:00:00Z', '02.01.2026, 00:00'], // yil chegarasiga yaqin
    ['2026-06-15T07:05:00Z', '15.06.2026, 12:05'],
    ['2026-03-08T00:00:00Z', '08.03.2026, 05:00'],
    ['2026-12-31T18:59:00Z', '31.12.2026, 23:59'],
    ['2026-12-31T19:00:00Z', '01.01.2027, 00:00'], // yangi yil
  ]

  for (const [iso, expected] of cases) {
    test(`${iso} -> ${expected}`, () => {
      assert.equal(formatDateTime(iso), expected)
    })
  }

  test('O‘zbekistonda yozgi vaqt yo‘q — yil bo‘yi UTC+5', () => {
    // Yanvar va iyul: ofset bir xil bo'lishi kerak
    assert.equal(formatDateTime('2026-01-15T10:00:00Z'), '15.01.2026, 15:00')
    assert.equal(formatDateTime('2026-07-15T10:00:00Z'), '15.07.2026, 15:00')
  })

  test('formatDate faqat sanani beradi', () => {
    assert.equal(formatDate('2026-10-25T21:30:00Z'), '26.10.2026')
  })

  test('Date obyekti ham qabul qilinadi', () => {
    assert.equal(formatDateTime(new Date('2026-06-15T07:05:00Z')), '15.06.2026, 12:05')
  })

  test('yaroqsiz qiymat bo‘sh satr', () => {
    for (const bad of ['salom', '', null, undefined, NaN]) {
      assert.equal(formatDateTime(bad), '')
      assert.equal(formatDate(bad), '')
    }
  })

  test('currentShopYear butun son qaytaradi', () => {
    const year = currentShopYear()
    assert.ok(Number.isInteger(year))
    assert.ok(year >= 2026 && year < 2100)
  })
})
