import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  MIN_IMAGE_SIDE,
  UPLOAD_FOLDER,
  minImageSideFor,
} from '@/lib/cloudinary'

/*
 * `confirmUpload` ning o'zi Cloudinary'ga so'rov yuboradi, shuning
 * uchun bu yerda faqat chegara tanlash mantig'i sinaladi.
 *
 * NEGA bu muhim: jonli saytdagi atir rasmlari 395x410 va 587x587
 * bo'lib chiqdi, ya'ni telefonda DPR 2 da talab qilinadigan ~750px
 * dan ikki baravar kichik. Next.js kichik manbani kattalashtirmaydi,
 * shuning uchun yuklash vaqtida to'xtatmasa, xira rasm katalogga
 * kirib ketadi va keyin faqat qo'lda topiladi.
 */

describe('rasm o\u2018lchami chegarasi', () => {
  test('atir rasmi uchun telefon retina ekraniga yetadigan chegara', () => {
    // 375px kenglikdagi telefonda rasm butun kenglikni egallaydi,
    // DPR 2 da bu 750px. Chegara shundan kam bo'lmasligi kerak.
    assert.ok(MIN_IMAGE_SIDE.atirlar >= 750)
  })

  test('brend logosi uchun chegara yumshoqroq', () => {
    // Logotip 32-80px joyda ko'rsatiladi — atir rasmi bilan bir xil
    // talab qo'yilsa, oddiy logotiplar ham rad etilardi
    assert.ok(MIN_IMAGE_SIDE.brendlar < MIN_IMAGE_SIDE.atirlar)
    assert.ok(MIN_IMAGE_SIDE.brendlar >= 200)
  })

  test('papkaga qarab chegara tanlanadi', () => {
    assert.equal(
      minImageSideFor(`${UPLOAD_FOLDER}/atirlar/abc123`),
      MIN_IMAGE_SIDE.atirlar
    )
    assert.equal(
      minImageSideFor(`${UPLOAD_FOLDER}/brendlar/abc123`),
      MIN_IMAGE_SIDE.brendlar
    )
  })

  test('notanish papka chegarasiz qolmaydi', () => {
    // Yangi papka qo'shilsa, tekshiruv jimgina o'chib qolmasin
    const value = minImageSideFor(`${UPLOAD_FOLDER}/boshqa/abc123`)
    assert.ok(Number.isFinite(value) && value > 0)
  })

  test('buzuq qiymatlar ham chegara qaytaradi', () => {
    for (const bad of [null, undefined, '', 42, {}, 'boshqa-papka/x']) {
      const value = minImageSideFor(bad)
      assert.ok(
        Number.isFinite(value) && value > 0,
        `${String(bad)} uchun chegara yo'q`
      )
    }
  })

  test('papkasiz publicId ham chegaraga tushadi', () => {
    const value = minImageSideFor(`${UPLOAD_FOLDER}/abc123`)
    assert.ok(Number.isFinite(value) && value > 0)
  })
})
