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

  /*
   * Avvalgi test imzoning OXIRGI belgisini almashtirardi va ~12 yugurishda
   * bir marta yiqilardi. Sabab: HS256 imzosi 32 bayt = 43 base64url belgi,
   * 43 x 6 = 258 bit, ya'ni oxirgi belgining pastki 2 biti hech narsani
   * bildirmaydi. Almashtirish faqat shu bitlarga tushsa ("b" -> "a"),
   * imzo baytlari O'ZGARMASDI — token aslida buzilmagan edi va to'g'ri
   * qabul qilinardi. Imzo har soniyada boshqa (iat), shuning uchun
   * tasodifiy. Xavfsizlik xatosi emas, test xatosi edi.
   *
   * Endi haqiqiy hujumlar sinaladi.
   */
  test('payload almashtirilsa (boshqa foydalanuvchi) rad etiladi', async () => {
    const [header, , signature] = (await signUserToken('u1', 0)).split('.')
    const forged = Buffer.from(
      JSON.stringify({ sub: 'boshqa-foydalanuvchi', tv: 0, iss: 'fayz-attor', aud: 'user' })
    ).toString('base64url')
    assert.equal(await verifyUserToken(`${header}.${forged}.${signature}`), null)
  })

  test('imzo buzilsa rad etiladi', async () => {
    const token = await signUserToken('u1', 0)
    const [header, payload, signature] = token.split('.')
    // O'rtadagi belgi — uning 6 biti ham imzoning haqiqiy qismi
    const mid = Math.floor(signature.length / 2)
    const swapped = signature[mid] === 'A' ? 'B' : 'A'
    const broken = signature.slice(0, mid) + swapped + signature.slice(mid + 1)
    assert.equal(await verifyUserToken(`${header}.${payload}.${broken}`), null)
  })

  test('imzo umuman yo‘q bo‘lsa rad etiladi ("alg: none" hujumi)', async () => {
    const [, payload] = (await signUserToken('u1', 0)).split('.')
    const none = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
    assert.equal(await verifyUserToken(`${none}.${payload}.`), null)
  })

  test('bo‘sh qiymatlar null qaytaradi', async () => {
    for (const bad of [null, undefined, '', 'not-a-token']) {
      assert.equal(await verifyUserToken(bad), null, `qabul qilindi: ${bad}`)
    }
  })
})
