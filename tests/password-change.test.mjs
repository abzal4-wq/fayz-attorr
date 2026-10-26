import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { makePasswordChangeSchema } from '@/lib/validation/auth'
import { LIMITS } from '@/lib/auth/rate-limit'
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password'

const t = (key, vars) => (vars ? `${key}:${JSON.stringify(vars)}` : key)

describe('parolni o‘zgartirish sxemasi', () => {
  const schema = makePasswordChangeSchema(t)

  test("joriy va yangi parol bilan o‘tadi", () => {
    const parsed = schema.safeParse({
      currentPassword: 'eskiParol1',
      newPassword: 'yangiParol2',
    })
    assert.ok(parsed.success)
  })

  test('joriy parol bo‘sh bo‘lsa rad etiladi', () => {
    /*
     * Joriy parol SHART: brauzeri ochiq qolgan hisobga o'tirib
     * olgan odam parolni almashtirib, egasini butunlay chiqarib
     * yuborishi mumkin bo'lardi.
     */
    const parsed = schema.safeParse({
      currentPassword: '',
      newPassword: 'yangiParol2',
    })
    assert.equal(parsed.success, false)
  })

  test('yangi parol eskisi bilan bir xil bo‘lsa rad etiladi', () => {
    // Amal ma'nosiz, lekin barcha sessiyalar uzilib ketardi
    const parsed = schema.safeParse({
      currentPassword: 'birXilParol1',
      newPassword: 'birXilParol1',
    })
    assert.equal(parsed.success, false)

    // Xato aynan yangi parol maydoniga biriktirilsin
    const paths = parsed.error.issues.map((i) => i.path.join('.'))
    assert.ok(paths.includes('newPassword'), `xato joyi: ${paths.join(', ')}`)
  })

  test('qisqa yangi parol rad etiladi', () => {
    const short = 'a'.repeat(MIN_PASSWORD_LENGTH - 1)
    const parsed = schema.safeParse({
      currentPassword: 'eskiParol1',
      newPassword: short,
    })
    assert.equal(parsed.success, false)
  })

  test('bcrypt cheklovidan uzun parol rad etiladi', () => {
    // bcrypt 72 baytdan keyingisini e'tiborsiz qoldiradi — undan
    // uzun parol qabul qilinsa, foydalanuvchi yolg'on xavfsizlik
    // hissida qolardi
    const parsed = schema.safeParse({
      currentPassword: 'eskiParol1',
      newPassword: 'a'.repeat(73),
    })
    assert.equal(parsed.success, false)
  })
})

describe('parolni o‘zgartirish cheklovi', () => {
  test('hisob va IP bo‘yicha cheklov bor', () => {
    assert.ok(LIMITS['password-change'])
    assert.ok(LIMITS['password-change-ip'])
  })

  test('login bilan bir xil qattiqlikda', () => {
    // Joriy parol so'ralgani uchun bu ham parol tanlash nuqtasi
    assert.ok(LIMITS['password-change'].limit <= LIMITS.login.limit)
  })

  test('IP cheklovi hisob cheklovidan yumshoqroq', () => {
    // CGNAT: bitta IP ortida ko'p abonent
    assert.ok(
      LIMITS['password-change-ip'].limit > LIMITS['password-change'].limit
    )
  })
})
