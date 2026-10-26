import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { generateResetCode } from '@/lib/auth/reset'
import {
  RESET_CODE_LENGTH,
  RESET_MAX_ATTEMPTS,
  RESET_TTL_SECONDS,
} from '@/lib/auth/reset-constants'
import { makeResetConfirmSchema, makeResetRequestSchema } from '@/lib/validation/auth'

/*
 * Bazaga tegadigan qismlar (`createResetRequest`, `issueCode`,
 * `completeReset`) jonli serverda sinaladi. Bu yerda bazasiz
 * tekshirib bo'ladigan narsalar: kod formati, forma validatsiyasi
 * va o'lchamlar.
 */

// Xato matnlari muhim emas, shuning uchun soxta tarjimon
const t = (key, vars) =>
  vars ? `${key}:${JSON.stringify(vars)}` : key

describe('tiklash kodi', () => {
  test('har doim roppa-rosa 6 xonali raqam', () => {
    /*
     * 2000 marta: `randomInt(0, 1000000)` 100000 dan kichik son
     * qaytarishi ~10% hollarda sodir bo'ladi, ya'ni `padStart`
     * olib tashlansa bu test deyarli aniq yiqiladi.
     */
    for (let i = 0; i < 2000; i += 1) {
      const code = generateResetCode()
      assert.match(code, /^\d{6}$/, `buzuq kod: ${code}`)
      assert.equal(code.length, RESET_CODE_LENGTH)
    }
  })

  test('yetakchi nolli kodlar ham uchraydi', () => {
    // padStart haqiqatan ishlayotganining isboti
    let seenPadded = false
    for (let i = 0; i < 5000 && !seenPadded; i += 1) {
      if (generateResetCode().startsWith('0')) seenPadded = true
    }
    assert.ok(seenPadded, "0 bilan boshlanadigan kod hech chiqmadi")
  })

  test('kodlar takrorlanmaydi (tasodifiylik bor)', () => {
    const codes = new Set()
    for (let i = 0; i < 500; i += 1) codes.add(generateResetCode())
    // Qat'iy emas, lekin doimiy qiymat qaytarilsa darhol ko'rinadi
    assert.ok(codes.size > 400, `juda ko'p takror: ${codes.size}/500`)
  })
})

describe('tiklash o‘lchamlari', () => {
  test('muddat odam uchun yetarli, lekin cheksiz emas', () => {
    assert.ok(RESET_TTL_SECONDS >= 5 * 60, 'Telegram ochib qaytishga ulgurmaydi')
    assert.ok(RESET_TTL_SECONDS <= 60 * 60)
  })

  test('urinishlar soni kodni tanlashga yetmaydi', () => {
    // 6 xonali kod = million variant; 5 urinish bilan ehtimol ~0
    assert.ok(RESET_MAX_ATTEMPTS <= 10)
    assert.ok(RESET_MAX_ATTEMPTS >= 3, 'xato bosilganda ham imkon qolsin')
  })
})

describe('tiklash so‘rovi sxemasi', () => {
  const schema = makeResetRequestSchema(t)

  test('telefon E.164 ga aylantiriladi', () => {
    const parsed = schema.safeParse({ phone: '+998 (90) 123-45-67' })
    assert.ok(parsed.success)
    assert.equal(parsed.data.phone, '+998901234567')
  })

  test("noto‘g‘ri telefon rad etiladi", () => {
    assert.equal(schema.safeParse({ phone: '12345' }).success, false)
  })
})

describe('tiklashni tasdiqlash sxemasi', () => {
  const schema = makeResetConfirmSchema(t)

  test("to‘g‘ri kod va parol o‘tadi", () => {
    const parsed = schema.safeParse({ code: '123456', password: 'yangiParol1' })
    assert.ok(parsed.success)
    assert.equal(parsed.data.code, '123456')
  })

  test('yetakchi nolli kod ham qabul qilinadi', () => {
    // Kodlarning ~10% i shunday — rad etilsa tiklash ishlamaydi
    const parsed = schema.safeParse({ code: '012345', password: 'yangiParol1' })
    assert.ok(parsed.success)
    assert.equal(parsed.data.code, '012345')
  })

  test("nusxalashda qo‘shilgan bo‘sh joy va chiziqlar tozalanadi", () => {
    /*
     * Telegram'dan kodni nusxalaganda bo'sh joy qo'shilib qolishi
     * juda keng tarqalgan. Tozalanmasa to'g'ri kod ham xato
     * sanalib, `attempts` hisoblagichini bekordan yeydi.
     */
    for (const raw of [' 123456 ', '123 456', '123-456', ' 123456']) {
      const parsed = schema.safeParse({ code: raw, password: 'yangiParol1' })
      assert.ok(parsed.success, `rad etildi: "${raw}"`)
      assert.equal(parsed.data.code, '123456')
    }
  })

  test("qisqa yoki uzun kod rad etiladi", () => {
    for (const bad of ['12345', '1234567', '', 'abcdef']) {
      assert.equal(
        schema.safeParse({ code: bad, password: 'yangiParol1' }).success,
        false,
        `qabul qilindi: "${bad}"`
      )
    }
  })

  test("qisqa parol rad etiladi", () => {
    assert.equal(
      schema.safeParse({ code: '123456', password: '123' }).success,
      false
    )
  })
})
