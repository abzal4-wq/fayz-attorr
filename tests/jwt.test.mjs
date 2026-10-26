import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { SignJWT } from 'jose'
import {
  signAdminToken,
  signUserToken,
  verifyAdminToken,
  verifyUserToken,
} from '@/lib/auth/jwt'

/*
 * Sessiyani bekor qilish (AUDIT-002) tokendagi `tv` maydoniga
 * tayanadi. Bu yerda uning tokenga tushishi va eski tokenlar bilan
 * moslik tekshiriladi. Bazaga tegadigan qism (`tokenVersion` ni
 * solishtirish) jonli serverda sinaladi.
 */

describe('token versiyasi', () => {
  test('mijoz tokeniga tv yoziladi', async () => {
    const payload = await verifyUserToken(await signUserToken('u1', 7))
    assert.equal(payload.sub, 'u1')
    assert.equal(payload.tv, 7)
  })

  test('admin tokeniga tv va rol yoziladi', async () => {
    const payload = await verifyAdminToken(
      await signAdminToken('a1', 'admin', 3)
    )
    assert.equal(payload.sub, 'a1')
    assert.equal(payload.role, 'admin')
    assert.equal(payload.tv, 3)
  })

  test('tv berilmasa 0 bo‘ladi', async () => {
    const payload = await verifyUserToken(await signUserToken('u1'))
    assert.equal(payload.tv, 0)
  })

  test('tv maydonisiz ESKI token ham tekshiruvdan o‘tadi', async () => {
    /*
     * Bu eng muhim test: `tokenVersion` qo'shilishidan oldin
     * berilgan tokenlarda `tv` yo'q. Agar kod ularni rad etsa,
     * deploy paytida HAMMA foydalanuvchi tizimdan chiqib ketardi.
     *
     * `session.js` dagi `?? 0` aynan shu holat uchun. Shuning
     * uchun eski shakldagi token qo'lda yasalib tekshiriladi.
     */
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const old = await new SignJWT({ sub: 'u1' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('fayz-attor')
      .setAudience('user')
      .setSubject('u1')
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret)

    const payload = await verifyUserToken(old)
    assert.ok(payload, 'eski token rad etildi')
    assert.equal(payload.tv, undefined)
    // Kod shuni 0 deb o'qiydi, bazadagi standart qiymat ham 0
    assert.equal(payload.tv ?? 0, 0)
  })
})

describe('mijoz va admin tokenlari ajratilgan', () => {
  test('mijoz tokeni admin sifatida qabul qilinmaydi', async () => {
    const token = await signUserToken('u1', 0)
    assert.equal(await verifyAdminToken(token), null)
  })

  test('admin tokeni mijoz sifatida qabul qilinmaydi', async () => {
    const token = await signAdminToken('a1', 'admin', 0)
    assert.equal(await verifyUserToken(token), null)
  })

  test('buzilgan token rad etiladi', async () => {
    const token = await signUserToken('u1', 0)
    // Oxirgi belgini o'zgartirish imzoni buzadi
    const broken = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a')
    assert.equal(await verifyUserToken(broken), null)
  })

  test('bo‘sh qiymatlar null qaytaradi', async () => {
    for (const bad of [null, undefined, '', 'not-a-token']) {
      assert.equal(await verifyUserToken(bad), null, `qabul qilindi: ${bad}`)
    }
  })
})
