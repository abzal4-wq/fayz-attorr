import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { makeAccountDeleteSchema } from '@/lib/validation/auth'
import { LIMITS } from '@/lib/auth/rate-limit'

const t = (key, vars) => (vars ? `${key}:${JSON.stringify(vars)}` : key)

describe('hisobni o‘chirish sxemasi', () => {
  const schema = makeAccountDeleteSchema(t)

  test('parol va tasdiq bilan o‘tadi', () => {
    const parsed = schema.safeParse({ password: 'parolim123', confirm: true })
    assert.ok(parsed.success)
  })

  test('tasdiq belgisi qo‘yilmasa rad etiladi', () => {
    /*
     * Amal qaytarilmaydi, shuning uchun bitta beixtiyor bosishdan
     * sodir bo'lmasligi kerak. Faqat parol yetarli emas: brauzer
     * parolni avtomatik to'ldirib qo'yishi mumkin.
     */
    const parsed = schema.safeParse({ password: 'parolim123', confirm: false })
    assert.equal(parsed.success, false)

    const paths = parsed.error.issues.map((i) => i.path.join('.'))
    assert.ok(paths.includes('confirm'), `xato joyi: ${paths.join(', ')}`)
  })

  test('tasdiq maydoni butunlay yuborilmasa ham rad etiladi', () => {
    assert.equal(schema.safeParse({ password: 'parolim123' }).success, false)
  })

  test('parolsiz rad etiladi', () => {
    assert.equal(schema.safeParse({ password: '', confirm: true }).success, false)
  })

  test("“true” satri tasdiq o‘rniga o‘tmaydi", () => {
    // Faqat haqiqiy `true`: satr ham qabul qilinsa, tasodifiy
    // yuborilgan qiymat hisobni o'chirib yuborishi mumkin bo'lardi
    assert.equal(
      schema.safeParse({ password: 'parolim123', confirm: 'true' }).success,
      false
    )
  })
})

describe('hisobni o‘chirish cheklovi', () => {
  test('hisob va IP bo‘yicha cheklov bor', () => {
    assert.ok(LIMITS['account-delete'])
    assert.ok(LIMITS['account-delete-ip'])
  })

  test('parol almashtirishdan ALOHIDA hisoblanadi', () => {
    /*
     * Bir hisoblagich bo'lsa, o'chirishga qilingan muvaffaqiyatsiz
     * urinishlar foydalanuvchini parolini almashtirish imkonidan
     * ham mahrum qilardi — aynan hisobi xavf ostida bo'lgan paytda.
     */
    assert.notEqual(LIMITS['account-delete'], LIMITS['password-change'])
  })

  test('IP cheklovi hisob cheklovidan yumshoqroq', () => {
    assert.ok(LIMITS['account-delete-ip'].limit > LIMITS['account-delete'].limit)
  })
})
