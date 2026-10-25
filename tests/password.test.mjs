import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, verifyPassword, MIN_PASSWORD_LENGTH } from '@/lib/auth/password'

async function timed(fn) {
  const start = process.hrtime.bigint()
  const value = await fn()
  return { value, ms: Number(process.hrtime.bigint() - start) / 1e6 }
}

describe('hashPassword', () => {
  test('bcrypt formatida 60 belgilik hash beradi', async () => {
    const hash = await hashPassword('parol12345')
    assert.equal(hash.length, 60)
    assert.match(hash, /^\$2[aby]\$\d{2}\$/)
  })

  test('qisqa parolni rad etadi', async () => {
    await assert.rejects(() => hashPassword('a'.repeat(MIN_PASSWORD_LENGTH - 1)))
  })

  test('bir xil parol har safar boshqa hash beradi (tuz)', async () => {
    const [a, b] = await Promise.all([hashPassword('parol12345'), hashPassword('parol12345')])
    assert.notEqual(a, b)
  })
})

describe('verifyPassword', () => {
  test("to'g'ri parol true", async () => {
    const hash = await hashPassword('parol12345')
    assert.equal(await verifyPassword('parol12345', hash), true)
  })

  test('xato parol false', async () => {
    const hash = await hashPassword('parol12345')
    assert.equal(await verifyPassword('boshqa12345', hash), false)
  })

  for (const bad of [undefined, null, '', 'buzuq-hash', 123]) {
    test(`buzuq hash ${JSON.stringify(bad)} -> false`, async () => {
      assert.equal(await verifyPassword('parol12345', bad), false)
    })
  }
})

describe('verifyPassword — javob vaqti (REGRESSIYA)', () => {
  /*
   * Haqiqiy xato edi: hash yo'q bo'lganda vaqtni tenglashtirish uchun
   * qo'yilgan soxta hash NOTO'G'RI formatda (66 belgi) edi. bcryptjs
   * uni darhol rad etardi — 0 ms. Natijada login javob vaqti
   * telefon raqami ro'yxatdan o'tganini oshkor qilardi:
   *   mavjud ~500 ms / mavjud emas ~270 ms.
   *
   * Test shuni qo'riqlaydi: hash bor-yo'qligidan qat'i nazar, ish
   * hajmi taxminan bir xil bo'lishi kerak.
   */
  test('hash bor va yo‘q holatlar bir xil vaqt oladi', async () => {
    const hash = await hashPassword('parol12345')

    // Birinchi chaqiruv "isitish" uchun — o'lchovga kirmaydi
    await verifyPassword('parol12345', hash)

    const withHash = await timed(() => verifyPassword('xato-parol', hash))
    const withoutHash = await timed(() => verifyPassword('xato-parol', undefined))

    assert.equal(withHash.value, false)
    assert.equal(withoutHash.value, false)

    // Ikkalasi ham haqiqiy bcrypt ishini bajarishi kerak
    assert.ok(
      withoutHash.ms > 20,
      `hash yo'q holat juda tez tugadi (${withoutHash.ms.toFixed(1)}ms) — ` +
        'vaqtni tenglashtirish ishlamayapti'
    )

    // Nisbat: biri ikkinchisidan 3 barobardan ko'p farq qilmasin
    const ratio = Math.max(withHash.ms, withoutHash.ms) / Math.min(withHash.ms, withoutHash.ms)
    assert.ok(
      ratio < 3,
      `vaqt farqi juda katta (${withHash.ms.toFixed(1)}ms va ` +
        `${withoutHash.ms.toFixed(1)}ms, nisbat ${ratio.toFixed(1)}x)`
    )
  })
})
