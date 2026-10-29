import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { prepareProductImages, syncProductImages } from '@/lib/products-admin'
import {
  MIN_IMAGE_SIDE,
  checkImageSize,
  minSideForFolder,
} from '@/lib/image-rules'
import { MAX_PRODUCT_IMAGES, productSchema } from '@/lib/validation/admin'

/*
 * Rasmlarni saqlash ikki qadamga bo'lingan:
 *   1. prepareProductImages — Cloudinary tasdig'i (tarmoq), tranzaksiyadan OLDIN
 *   2. syncProductImages    — faqat baza, tranzaksiya ICHIDA
 *
 * Avval ikkalasi bitta funksiyada, tranzaksiya ichida edi. Har rasm
 * Cloudinary'ga 270-880ms so'rov, Prisma tranzaksiyasining chegarasi
 * esa 5 soniya — ko'p rasm bilan saqlash yiqilardi.
 */

/** Cloudinary o'rnini bosuvchi soxta tasdiqlovchi. */
function fakeConfirm({ fail = [] } = {}) {
  const calls = []
  const confirm = async (publicId) => {
    calls.push(publicId)
    if (fail.includes(publicId)) throw new Error(`Rasm juda kichik: ${publicId}`)
    return { url: `https://cdn/${publicId}.webp`, publicId }
  }
  return { confirm, calls }
}

/** Faqat chaqiruvlarni yozib oladigan soxta tranzaksiya. */
function fakeTx() {
  const calls = []
  return {
    calls,
    productImage: {
      deleteMany: async (args) => calls.push(['deleteMany', args]),
      createMany: async (args) => calls.push(['createMany', args]),
    },
  }
}

describe('rasmlarni tayyorlash (tranzaksiyadan oldin)', () => {
  test('yangi rasmlar tasdiqlanadi, tartib saqlanadi', async () => {
    const { confirm, calls } = fakeConfirm()
    const rows = await prepareProductImages(
      [{ publicId: 'a' }, { publicId: 'b' }, { publicId: 'c' }],
      [],
      confirm
    )
    assert.deepEqual(calls, ['a', 'b', 'c'])
    assert.deepEqual(rows.map((r) => [r.publicId, r.sortOrder]), [['a', 0], ['b', 1], ['c', 2]])
    // URL mijozdan emas, tasdiqlovchidan olinadi
    assert.equal(rows[0].url, 'https://cdn/a.webp')
  })

  test('mavjud rasm qayta tasdiqlanmaydi', async () => {
    /*
     * Tahrirlashda eski rasmlar Cloudinary'ga qayta so'ralmasligi kerak:
     * ham sekin, ham eski (1000px dan kichik) rasmlar endi rad etilib,
     * oddiy tahrirlash ham buzilib qolardi.
     */
    const { confirm, calls } = fakeConfirm()
    const existing = [{ publicId: 'eski', url: 'https://cdn/eski.webp' }]
    const rows = await prepareProductImages(
      [{ publicId: 'eski' }, { publicId: 'yangi' }],
      existing,
      confirm
    )
    assert.deepEqual(calls, ['yangi'])
    assert.equal(rows[0].url, 'https://cdn/eski.webp')
  })

  test('tasdiqlash yiqilsa xato chaqiruvchiga yetadi', async () => {
    const { confirm } = fakeConfirm({ fail: ['kichik'] })
    await assert.rejects(
      prepareProductImages([{ publicId: 'ok' }, { publicId: 'kichik' }], [], confirm),
      /Rasm juda kichik/
    )
  })

  test("tasdiqlash yiqilsa bazaga HECH NARSA yozilmaydi", async () => {
    // Route tartibi: avval prepare, keyin tranzaksiya. prepare yiqilsa
    // tranzaksiya umuman boshlanmaydi.
    const { confirm } = fakeConfirm({ fail: ['kichik'] })
    const tx = fakeTx()
    try {
      const rows = await prepareProductImages([{ publicId: 'kichik' }], [], confirm)
      await syncProductImages(tx, 'p1', rows, [])
    } catch {
      // kutilgan
    }
    assert.equal(tx.calls.length, 0)
  })
})

describe('rasmlarni bazaga yozish (tranzaksiya ichida)', () => {
  test('eski qatorlar almashtiriladi, atirga bog‘lanadi', async () => {
    const tx = fakeTx()
    const rows = [
      { url: 'u1', publicId: 'a', sortOrder: 0 },
      { url: 'u2', publicId: 'b', sortOrder: 1 },
    ]
    await syncProductImages(tx, 'p1', rows, [])

    assert.deepEqual(tx.calls[0], ['deleteMany', { where: { productId: 'p1' } }])
    assert.equal(tx.calls[1][0], 'createMany')
    assert.deepEqual(
      tx.calls[1][1].data,
      rows.map((r) => ({ ...r, productId: 'p1' }))
    )
  })

  test('ro‘yxatdan chiqarilgan eski rasmlar o‘chirish uchun qaytariladi', async () => {
    const tx = fakeTx()
    const orphans = await syncProductImages(
      tx,
      'p1',
      [{ url: 'u', publicId: 'qoldi', sortOrder: 0 }],
      [{ publicId: 'qoldi' }, { publicId: 'olib-tashlandi' }]
    )
    assert.deepEqual(orphans, ['olib-tashlandi'])
  })

  test('tarmoqqa umuman murojaat qilmaydi', async () => {
    // Faqat tx ishlatiladi — tasdiqlovchi parametr ham yo'q
    assert.equal(syncProductImages.length, 3)
  })
})

describe('rasm o‘lchami qoidasi (brauzer va server umumiy)', () => {
  const min = MIN_IMAGE_SIDE.atirlar

  test('aynan chegaradagi rasm o‘tadi', () => {
    assert.equal(checkImageSize(min, min, min), null)
  })

  test('bir tomoni kichik bo‘lsa rad etiladi', () => {
    assert.match(checkImageSize(min - 1, 2000, min), /juda kichik/)
    assert.match(checkImageSize(2000, min - 1, min), /juda kichik/)
  })

  test('jonli saytdagi haqiqiy kichik rasm rad etiladi', () => {
    // Cloudinary'dan o'lchangan: 587x587 — telefonda xira edi
    const message = checkImageSize(587, 587, min)
    assert.match(message, /587×587px/)
    assert.match(message, new RegExp(`${min}×${min}px`))
  })

  test("o'lcham aniqlanmasa rad etiladi", () => {
    assert.ok(checkImageSize(NaN, 500, min))
    assert.ok(checkImageSize(undefined, undefined, min))
  })

  test('papkaga qarab chegara', () => {
    assert.equal(minSideForFolder('atirlar'), MIN_IMAGE_SIDE.atirlar)
    assert.equal(minSideForFolder('brendlar'), MIN_IMAGE_SIDE.brendlar)
    assert.ok(minSideForFolder('boshqa') > 0)
  })
})

describe('rasmlar soni chegarasi', () => {
  const base = {
    name: 'Sinov atiri',
    brandId: 'b1',
    gender: 'UNISEX',
    variants: [{ sizeId: 's1', price: 100000 }],
  }
  const images = (n) => Array.from({ length: n }, (_, i) => ({ publicId: `r${i}` }))

  test(`${MAX_PRODUCT_IMAGES} ta rasm qabul qilinadi`, () => {
    const parsed = productSchema.safeParse({ ...base, images: images(MAX_PRODUCT_IMAGES) })
    const imageIssues = parsed.error?.issues.filter((i) => i.path[0] === 'images') ?? []
    assert.equal(imageIssues.length, 0, JSON.stringify(imageIssues))
  })

  test('chegaradan oshsa rad etiladi', () => {
    const parsed = productSchema.safeParse({ ...base, images: images(MAX_PRODUCT_IMAGES + 1) })
    const imageIssues = parsed.error?.issues.filter((i) => i.path[0] === 'images') ?? []
    assert.ok(imageIssues.length > 0, "chegaradan oshgan ro'yxat o'tib ketdi")
  })
})
