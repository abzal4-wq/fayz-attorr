import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  applyPhoneEdit,
  formatNational,
  isValidUzPhone,
  maskPhoneInput,
  nationalDigits,
  normalizePhone,
} from '@/lib/auth/phone'

/*
 * Brauzerdagi maydonni taqlid qiladi: har tugma applyPhoneEdit orqali
 * o'tadi (PhoneInput aynan shunday qiladi).
 *
 * MUHIM: avvalgi testlar faqat YAKUNIY qiymatni tekshirgan, shuning uchun
 * yozish paytidagi buzilish ("+998 (99) 899-89-01") va backspace'dagi
 * buzilish o'tib ketgan. Bu yerda HAR BIR oraliq holat tekshiriladi.
 */
class Field {
  constructor(value = '') {
    this.value = value
    this.caret = value.length
  }

  apply(value, caret, inputType) {
    const next = applyPhoneEdit({ value, caret, previous: this.value, inputType })
    this.value = next.value
    this.caret = next.caret
    return this
  }

  type(text) {
    const states = []
    for (const ch of text) {
      const v = this.value.slice(0, this.caret) + ch + this.value.slice(this.caret)
      this.apply(v, this.caret + 1, 'insertText')
      states.push(this.value)
    }
    return states
  }

  backspace(times = 1) {
    const states = []
    for (let i = 0; i < times; i += 1) {
      if (this.caret === 0) break
      const v = this.value.slice(0, this.caret - 1) + this.value.slice(this.caret)
      this.apply(v, this.caret - 1, 'deleteContentBackward')
      states.push(this.value)
    }
    return states
  }

  moveTo(caret) {
    this.caret = caret
    return this
  }
}

const digitsOf = (s) => s.replace(/\D/g, '')

describe('normalizePhone', () => {
  const same = [
    '+998935554433',
    '998935554433',
    '935554433',
    '+998 (93) 555-44-33',
    '(93) 555-44-33', // maydonning yangi ko'rinishi
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

describe('maska: maydonda faqat milliy raqam', () => {
  test("ko'rinish", () => {
    assert.equal(maskPhoneInput('901234567'), '(90) 123-45-67')
  })

  test('"+998" maydon qiymatiga QO‘SHILMAYDI', () => {
    // U maydon tashqarisida ko'rsatiladi. Qiymatda bo'lganida maska uni
    // mijozning raqami deb qayta o'qirdi — butun xatoning ildizi shu edi.
    for (const input of ['9', '90', '901234567', '+998901234567']) {
      assert.ok(!maskPhoneInput(input).includes('998'), `${input} -> ${maskPhoneInput(input)}`)
    }
  })

  test('joylashtirilgan yoki avto-to‘ldirilgan to‘liq raqam', () => {
    for (const input of [
      '+998901234567',
      '998901234567',
      '00998901234567',
      '+998 (90) 123-45-67',
      '+998 90 123 45 67',
      '(90) 123-45-67',
    ]) {
      assert.equal(maskPhoneInput(input), '(90) 123-45-67', input)
    }
  })

  test('operator 99 bilan boshlanadigan haqiqiy raqam buzilmaydi', () => {
    // "998123456" = operator 99, abonent 8123456 — mamlakat kodi EMAS
    assert.equal(maskPhoneInput('998123456'), '(99) 812-34-56')
    assert.equal(normalizePhone(maskPhoneInput('998123456')), '+998998123456')
  })

  test('9 tadan ortiq raqam qabul qilinmaydi', () => {
    assert.equal(maskPhoneInput('93555443399999'), '(93) 555-44-33')
  })

  test("bo'sh va harfli kiritish", () => {
    assert.equal(maskPhoneInput(''), '')
    assert.equal(maskPhoneInput('abc'), '')
  })

  test('qiymat har doim RAQAM bilan tugaydi (backspace qotib qolmasin)', () => {
    // Avval 2 raqamda "(90)" bo'lardi: backspace ")" ni o'chirar, maska
    // uni qaytarar edi va tugma ishlamay qolardi
    for (let n = 1; n <= 9; n += 1) {
      const v = formatNational('901234567'.slice(0, n))
      assert.match(v, /\d$/, `${n} ta raqam: "${v}"`)
    }
  })
})

describe('yozish — HAR BIR oraliq holat (REGRESSIYA)', () => {
  test('raqamni harfma-harf yozganda begona raqam paydo bo‘lmaydi', () => {
    /*
     * Jonli saytda brauzerda qayta hosil qilingan xato:
     *   "9" -> "+998 (9"  "0" -> "+998 (99) 890"  "1" -> "+998 (99) 899-89-01"
     * Har bir holatda maydondagi raqamlar AYNAN yozilganlar bo'lishi kerak.
     */
    const field = new Field()
    const typed = '901234567'
    const states = field.type(typed)
    states.forEach((state, i) => {
      assert.equal(digitsOf(state), typed.slice(0, i + 1), `${i + 1}-tugma: "${state}"`)
    })
    assert.equal(field.value, '(90) 123-45-67')
    assert.equal(normalizePhone(field.value), '+998901234567')
  })

  test('mijoz "+998" ni o‘zi yozsa ham oxirida to‘g‘ri chiqadi', () => {
    for (const input of ['+998935554433', '+998 93 555 44 33', '998935554433']) {
      const field = new Field()
      field.type(input)
      assert.equal(field.value, '(93) 555-44-33', input)
      assert.equal(normalizePhone(field.value), '+998935554433')
    }
  })
})

describe('backspace (REGRESSIYA)', () => {
  test('oxiridan o‘chirganda har safar AYNAN bitta raqam o‘chadi', () => {
    /*
     * Avval: "+998 (90) 123-45" -> backspace -> "+998 (99) 890-12-34" —
     * raqam butunlay boshqasiga aylanardi.
     */
    const field = new Field()
    field.type('901234567')
    const states = field.backspace(9)
    states.forEach((state, i) => {
      assert.equal(digitsOf(state), '901234567'.slice(0, 8 - i), `${i + 1}-backspace: "${state}"`)
    })
    assert.equal(field.value, '')
  })

  test('kursor ajratuvchidan keyin bo‘lsa, undan oldingi raqam o‘chadi', () => {
    // "(90) 123-45-67": kursor birinchi "-" dan keyin (8-o'rin)
    const field = new Field('(90) 123-45-67')
    field.moveTo(9)
    assert.equal(field.value[8], '-')
    field.backspace(1)
    // "3" o'chdi, "-" qaytib keldi — tugma "qotib" qolmadi
    assert.equal(digitsOf(field.value), '90124567')
  })
})

describe('kursor joyida qoladi', () => {
  test('o‘rtaga raqam qo‘shilganda kursor o‘sha raqamdan keyin', () => {
    // "(90) 124-56-7" -> "12" va "4" orasiga "3" yozamiz
    const field = new Field('(90) 124-56-7')
    field.moveTo(7) // "(90) 12|4"
    field.type('3')
    assert.equal(field.value, '(90) 123-45-67')
    // Kursor "3" dan keyin, oxirida emas
    assert.equal(field.value.slice(0, field.caret), '(90) 123')
  })

  test('to‘liq raqam joylashtirilsa kursor oxiriga', () => {
    const next = applyPhoneEdit({ value: '+998901234567', caret: 13, previous: '' })
    assert.equal(next.value, '(90) 123-45-67')
    assert.equal(next.caret, next.value.length)
  })
})

describe('nationalDigits', () => {
  test('mamlakat kodi faqat 9 tadan oshganda olinadi', () => {
    assert.equal(nationalDigits('998901234567'), '901234567')
    assert.equal(nationalDigits('998123456'), '998123456')
  })
})

describe('isValidUzPhone', () => {
  test('to‘g‘ri raqam', () => {
    assert.equal(isValidUzPhone('+998935554433'), true)
    assert.equal(isValidUzPhone('(93) 555-44-33'), true)
  })
  test('noto‘g‘ri raqam', () => {
    assert.equal(isValidUzPhone('123'), false)
  })
})
