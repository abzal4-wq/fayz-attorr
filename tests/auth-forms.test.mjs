import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/*
 * Kirish, ro'yxat va tiklash formalarida telefon `autoComplete="username"`
 * bo'lishi SHART.
 *
 * `tel` (PhoneInput standarti) brauzerga manzillar kitobidagi raqamni
 * qo'yishni aytadi: Chrome kirish formasiga egasining profil raqamini
 * yozardi, parol menejeri esa boshqa hisobning parolini — natija
 * "Telefon raqami yoki parol noto'g'ri" (foydalanuvchi ekran rasmi
 * bilan xabar qilgan). `username` bilan telefon va parol juft saqlanadi.
 *
 * Fayl matni tekshiriladi: komponentni render qilish uchun brauzer
 * muhiti kerak, qoidaning qaytib buzilishi esa jimgina sodir bo'ladi.
 */
const FORMS = [
  'components/auth/login-form.jsx',
  'components/auth/register-form.jsx',
  'components/auth/reset-form.jsx',
]

describe('hisob formalari: telefon maydoni', () => {
  for (const file of FORMS) {
    test(`${file}: autoComplete="username"`, () => {
      const source = readFileSync(file, 'utf8')
      const block = source.match(/<PhoneInput[\s\S]*?\/>/)?.[0]
      assert.ok(block, 'PhoneInput topilmadi')
      assert.match(block, /autoComplete="username"/)
    })
  }

  test('buyurtma formasi aloqa raqami sifatida `tel` da qoladi', () => {
    // U yerda manzillar kitobidan to'ldirish aynan kerak
    const source = readFileSync('components/phone-input.jsx', 'utf8')
    assert.match(source, /autoComplete="tel"/)
  })
})

describe("raqam band bo'lsa yo'l ko'rsatiladi", () => {
  test('register route 409 qaytaradi', () => {
    const source = readFileSync('app/api/auth/register/route.js', 'utf8')
    assert.match(source, /phoneTaken[\s\S]{0,200}status: 409/)
  })

  test('forma 409 da tiklash havolasini ko\u2018rsatadi', () => {
    const source = readFileSync('components/auth/register-form.jsx', 'utf8')
    assert.match(source, /res\.status === 409/)
    assert.match(source, /href="\/parolni-tiklash"/)
  })
})
