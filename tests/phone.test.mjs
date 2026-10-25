import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { normalizePhone, maskPhoneInput, isValidUzPhone } from '@/lib/auth/phone'

/** Brauzerdagi kabi harf-harf yozishni taqlid qiladi. */
function typeIt(text) {
  let field = ''
  for (const ch of text) field = maskPhoneInput(field + ch)
  return field
}

describe('normalizePhone', () => {
  const same = [
    '+998935554433',
    '998935554433',
    '935554433',
    '+998 (93) 555-44-33',
    '93 555 44 33',
    '00998935554433',
  ]
  for (const input of same) {
    test(`"${input}" -> +998935554433`, () => {
      assert.equal(normalizePhone(input), '+998935554433')
    })
  }

  for (const bad of ['', '123', 'salom', '+1 555 123 4567', '9355544', null, undefined]) {
    test(`noto'g'ri: ${JSON.stringify(bad)} -> null`, () => {
      assert.equal(normalizePhone(bad), null)
    })
  }
})

describe('maskPhoneInput — harf-harf yozish (REGRESSIYA)', () => {
  /*
   * Haqiqiy xato edi: foydalanuvchi "+998 93 555 44 33" deb yozsa,
   * mask o'zining "+998" ini qo'shib yuborib, maydonda
   * "+998 (99) 893-55-54" paydo bo'lardi — boshqa odamning raqami.
   * Shunday ro'yxatdan o'tgan mijozga qo'ng'iroq qilib bo'lmasdi.
   */
  const variants = [
    '935554433',
    '93 555 44 33',
    '998935554433',
    '+998935554433',
    '+998 93 555 44 33',
    '+998 (93) 555-44-33',
  ]

  for (const input of variants) {
    test(`yozilgan "${input}"`, () => {
      assert.equal(typeIt(input), '+998 (93) 555-44-33')
      assert.equal(normalizePhone(typeIt(input)), '+998935554433')
    })
    test(`joylashtirilgan "${input}"`, () => {
      assert.equal(normalizePhone(maskPhoneInput(input)), '+998935554433')
    })
  }

  test('operator 99 bilan boshlanadigan haqiqiy raqam buzilmaydi', () => {
    // 998123456 = operator 99, abonent 8123456. Mamlakat kodi emas.
    assert.equal(normalizePhone(typeIt('998123456')), '+998998123456')
  })

  test("bo'sh kiritish bo'sh qoladi", () => {
    assert.equal(maskPhoneInput(''), '')
    assert.equal(maskPhoneInput('abc'), '')
  })

  test("9 tadan ortiq raqam qabul qilinmaydi", () => {
    assert.equal(maskPhoneInput('93555443399999'), '+998 (93) 555-44-33')
  })
})

describe('isValidUzPhone', () => {
  test('to‘g‘ri raqam', () => {
    assert.equal(isValidUzPhone('+998935554433'), true)
  })
  test('noto‘g‘ri raqam', () => {
    assert.equal(isValidUzPhone('123'), false)
  })
})
