import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { brandLogoUrl, cloudinaryTransform } from '@/lib/cloudinary-url'

const CLD =
  'https://res.cloudinary.com/nshwom5v/image/upload/v1793290244/fayz-attor/brendlar/abc.png'

describe('Cloudinary URL transformatsiyasi', () => {
  test('transformatsiya /image/upload/ dan keyin qo‘yiladi', () => {
    const out = cloudinaryTransform(CLD, 'e_trim')
    assert.equal(
      out,
      'https://res.cloudinary.com/nshwom5v/image/upload/e_trim/' +
        'v1793290244/fayz-attor/brendlar/abc.png'
    )
  })

  test('versiya va papka yo‘li saqlanadi', () => {
    // Versiya (v...) yo'qolsa Cloudinary keshi eskirgan rasmni berardi
    const out = cloudinaryTransform(CLD, 'e_trim')
    assert.ok(out.includes('/v1793290244/'))
    assert.ok(out.endsWith('/fayz-attor/brendlar/abc.png'))
  })

  test('Cloudinary bo‘lmagan URL o‘zgarmaydi', () => {
    /*
     * Seed ma'lumotidagi demo rasmlar Cloudinary'da emas.
     * O'zgartirilsa ular butunlay ochilmay qolardi.
     */
    for (const url of [
      '/rasmlar/demo.png',
      'https://example.com/logo.png',
      'local:demo-1',
    ]) {
      assert.equal(cloudinaryTransform(url, 'e_trim'), url)
    }
  })

  test('buzuq qiymatlar yiqitmaydi', () => {
    assert.equal(cloudinaryTransform(null, 'e_trim'), null)
    assert.equal(cloudinaryTransform(undefined, 'e_trim'), undefined)
    assert.equal(cloudinaryTransform(CLD, ''), CLD)
    assert.equal(cloudinaryTransform(CLD, null), CLD)
  })

  test('ikki marta qo‘llanmaydi deb o‘ylamaymiz — har chaqiruv qo‘shadi', () => {
    // Hujjatlashtirilgan xulq: chaqiruvchi bir marta qo'llashi kerak
    const once = cloudinaryTransform(CLD, 'e_trim')
    const twice = cloudinaryTransform(once, 'c_pad')
    assert.ok(twice.includes('/upload/c_pad/e_trim/'))
  })
})

describe('brend logotipi URL‘i', () => {
  test('kesish va kvadratga keltirish qo‘llanadi', () => {
    const out = brandLogoUrl(CLD)

    /*
     * e_trim:0 — aniq `:0`. Standart `:10` jonli logotipda
     * "CHANEL" yozuvining pastini qirqib yuborgandi.
     */
    assert.ok(out.includes('e_trim:0'), `trim yo'q: ${out}`)
    assert.ok(out.includes('c_pad'), `pad yo'q: ${out}`)
    assert.ok(out.includes('b_auto'), `fon rangi yo'q: ${out}`)
  })

  test('kvadrat o‘lcham beriladi', () => {
    // Nisbatlar har xil bo'lsa kartochkalar qatori notekis ko'rinardi
    const out = brandLogoUrl(CLD)
    const match = out.match(/w_(\d+),h_(\d+)/)
    assert.ok(match, `o'lcham yo'q: ${out}`)
    assert.equal(match[1], match[2])
  })

  test('logotipi yo‘q brend yiqitmaydi', () => {
    assert.equal(brandLogoUrl(null), null)
  })
})
