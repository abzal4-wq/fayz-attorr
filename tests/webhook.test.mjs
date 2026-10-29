import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { isWebhookAuthorized } from '@/lib/telegram'

describe('Telegram webhook kaliti', () => {
  const SECRET = 'maxfiy-kalit-48-belgi'

  test("to'g'ri kalit qabul qilinadi", () => {
    assert.equal(isWebhookAuthorized(SECRET, SECRET, 'production'), true)
  })

  test("noto'g'ri yoki yo'q sarlavha rad etiladi", () => {
    for (const header of ['boshqa', '', null, undefined]) {
      assert.equal(
        isWebhookAuthorized(header, SECRET, 'production'),
        false,
        `qabul qilindi: ${String(header)}`
      )
    }
  })

  test("production'da kalit o'rnatilmagan bo'lsa HAMMASI rad etiladi", () => {
    /*
     * Eng muhim holat. Avval kalit yo'q bo'lsa tekshiruv jimgina
     * o'chardi va webhook ochiq qolardi — callback'dagi chat ID so'rov
     * tanasidan olingani uchun istalgan odam o'zini admin qilib
     * ko'rsatib buyurtma holatini o'zgartira olardi.
     */
    for (const secret of [undefined, null, '']) {
      assert.equal(
        isWebhookAuthorized(undefined, secret, 'production'),
        false,
        `kalitsiz production ochiq qoldi (${String(secret)})`
      )
      assert.equal(isWebhookAuthorized('istalgan', secret, 'production'), false)
    }
  })

  test('mahalliy ishlab chiqishda kalitsiz ham ishlaydi', () => {
    assert.equal(isWebhookAuthorized(undefined, undefined, 'development'), true)
  })
})
