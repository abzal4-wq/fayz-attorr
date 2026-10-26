import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { LIMITS } from '@/lib/auth/rate-limit'

/*
 * Bu yerda bazaga tegmaydigan, sof sozlama tekshiruvlari.
 * `consumeAttempt` ning o'zi bazaga yozadi — u jonli serverda
 * sinaladi (hisoblagichlar to'g'ri ajralishi tasdiqlangan).
 */

describe('rate limit sozlamalari', () => {
  const ACTIONS = ['login', 'register', 'order', 'reset']

  for (const action of ACTIONS) {
    test(`${action} uchun hisob bo'yicha cheklov bor`, () => {
      assert.ok(LIMITS[action], `${action} yo'q`)
      assert.ok(LIMITS[action].limit > 0)
      assert.ok(LIMITS[action].windowSeconds > 0)
    })

    /*
     * Har bir amal uchun IP varianti SHART. Busiz cheklov yana
     * faqat bitta o'lchovda qolib ketadi — O'zbekistonda operatorlar
     * CGNAT ishlatgani uchun bu bitta odam tufayli butun operatorni
     * bloklashga olib boradi.
     */
    test(`${action} uchun IP bo'yicha cheklov ham bor`, () => {
      const ipKey = `${action}-ip`
      assert.ok(LIMITS[ipKey], `${ipKey} yo'q — CGNAT muammosi qaytadi`)
    })

    test(`${action}: IP cheklovi hisob cheklovidan yumshoqroq`, () => {
      // IP ortida ko'p odam bor, shuning uchun u kengroq bo'lishi kerak
      assert.ok(
        LIMITS[`${action}-ip`].limit > LIMITS[action].limit,
        `${action}-ip (${LIMITS[`${action}-ip`].limit}) ` +
          `${action} (${LIMITS[action].limit}) dan katta bo'lishi kerak`
      )
    })
  }

  test("login cheklovi haddan tashqari yumshoq emas", () => {
    assert.ok(LIMITS.login.limit <= 10, 'parol tanlashga juda ko‘p imkon beradi')
    assert.ok(LIMITS.login.windowSeconds >= 10 * 60)
  })
})
