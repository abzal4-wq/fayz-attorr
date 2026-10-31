import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { settingsSchema } from '@/lib/validation/admin'

/*
 * Ijtimoiy tarmoq havolalari har bir sahifa footer'iga chiqadi. Faqat
 * o'sha tarmoqning o'z manzili qabul qilinadi — admin hisobi buzilsa
 * ham mijozlarni begona saytga yo'naltirib bo'lmasin.
 */
const parse = (data) => settingsSchema.safeParse(data)

describe('Telegram havolasi', () => {
  test('har xil yozilish bir xil to‘liq havolaga aylanadi', () => {
    for (const input of ['fayz_attor', '@fayz_attor', 'https://t.me/fayz_attor', 'https://t.me/fayz_attor/', 'http://telegram.me/fayz_attor']) {
      const r = parse({ telegramUrl: input })
      assert.ok(r.success, input)
      assert.equal(r.data.telegramUrl, 'https://t.me/fayz_attor', input)
    }
  })

  test('begona sayt va xavfli qiymatlar rad etiladi', () => {
    for (const bad of [
      'javascript:alert(1)',
      'https://evil.com/fayz_attor',
      'https://t.me.evil.com/fayz_attor',
      'https://t.me/../evil',
      'data:text/html,<script>',
      'abc', // juda qisqa
    ]) {
      assert.equal(parse({ telegramUrl: bad }).success, false, bad)
    }
  })
})

describe('Instagram havolasi', () => {
  test('har xil yozilish bir xil to‘liq havolaga aylanadi', () => {
    for (const input of ['fayz_attor', '@fayz_attor', 'https://instagram.com/fayz_attor', 'https://www.instagram.com/fayz_attor/']) {
      const r = parse({ instagramUrl: input })
      assert.ok(r.success, input)
      assert.equal(r.data.instagramUrl, 'https://www.instagram.com/fayz_attor', input)
    }
  })

  test('begona sayt rad etiladi', () => {
    for (const bad of ['javascript:alert(1)', 'https://instagram.com.evil.com/x', 'https://evil.com/fayz_attor', 'fayz attor']) {
      assert.equal(parse({ instagramUrl: bad }).success, false, bad)
    }
  })
})

test('bo‘sh satr havolani olib tashlaydi', () => {
  const r = parse({ telegramUrl: '', instagramUrl: '' })
  assert.ok(r.success)
  assert.equal(r.data.telegramUrl, '')
  assert.equal(r.data.instagramUrl, '')
})
