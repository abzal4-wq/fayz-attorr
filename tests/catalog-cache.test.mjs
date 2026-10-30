import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isCacheableCatalogView, parseCatalogParams } from '@/lib/catalog-params'
import { CACHE_SECONDS } from '@/lib/cache'

/*
 * Katalog ko'rinishlari keshlanadi — baza uxlab yotsa mijoz kutmasin.
 * Lekin kesh kaliti URL'dan keladi: ixtiyoriy qiymat keshlansa, hujumchi
 * minglab har xil manzil ochib keshni to'ldirishi mumkin. Shuning uchun
 * faqat CHEKLANGAN qiymatlar keshlanadi.
 */
const view = (query) => isCacheableCatalogView(parseCatalogParams(query))

describe('katalog: nima keshlanadi', () => {
  test('asosiy kirishlar keshlanadi', () => {
    assert.equal(view({}), true) // /katalog
    assert.equal(view({ gender: 'WOMEN' }), true) // menyudagi "Ayollar"
    assert.equal(view({ chegirma: '1' }), true)
    assert.equal(view({ saralash: 'arzon' }), true)
    assert.equal(view({ sahifa: '3' }), true)
  })

  test('ixtiyoriy qiymatli filtrlar KESHLANMAYDI (keshni to‘ldirib bo‘lmasin)', () => {
    assert.equal(view({ q: 'tasodifiy-satr-123' }), false)
    assert.equal(view({ brend: 'chanel' }), false)
    assert.equal(view({ hajm: '50' }), false)
    assert.equal(view({ narxdan: '100' }), false)
    assert.equal(view({ narxgacha: '999999' }), false)
  })

  test('uzoq sahifalar keshlanmaydi', () => {
    assert.equal(view({ sahifa: '11' }), false)
    assert.equal(view({ sahifa: '999999' }), false)
  })

  test('noto‘g‘ri jins yoki saralash keshni ko‘paytirmaydi', () => {
    // parseCatalogParams noma'lum qiymatni standartga aylantiradi —
    // ya'ni ular mavjud kalitlardan biriga tushadi, yangisini yasamaydi
    const a = parseCatalogParams({ gender: 'XXX', saralash: 'yyy' })
    assert.equal(a.gender, null)
    assert.equal(a.sort, 'yangi')
    assert.equal(isCacheableCatalogView(a), true)
  })

  test('mumkin bo‘lgan kalitlar soni cheklangan', () => {
    // jins (4) x chegirma (2) x saralash (4) x sahifa (10)
    const genders = [null, 'WOMEN', 'MEN', 'UNISEX']
    const sorts = ['yangi', 'arzon', 'qimmat', 'ommabop']
    let count = 0
    for (const gender of genders)
      for (const onlyDiscount of [false, true])
        for (const sort of sorts)
          for (let page = 1; page <= 50; page += 1)
            if (isCacheableCatalogView({ gender, onlyDiscount, sort, page, query: '' })) count += 1
    assert.ok(count <= 320, `${count} ta kalit`)
  })
})

describe('kesh xavfsizligi', () => {
  test('atir sahifasi faqat MAVJUD slug uchun keshlanadi', () => {
    // Darvoza: ro'yxatda yo'q slug na bazaga, na keshga tegadi
    const source = readFileSync('lib/catalog.js', 'utf8')
    const fn = source.slice(source.indexOf('export const getProductBySlug'))
    assert.match(fn.slice(0, 600), /loadVisibleSlugs\(\)[\s\S]*includes\(slug\)/)
  })

  test('qoldiq o‘zgarganda kesh tozalanadi', () => {
    /*
     * Atir sahifasi keshlanadi; buyurtma qoldiqni o'zgartirganda kesh
     * tozalanmasa, sotilib tugagan atir "mavjud" bo'lib turaverardi.
     * Qoldiqni o'zgartiradigan IKKALA funksiyada ham chaqirilishi shart.
     */
    const source = readFileSync('lib/orders.js', 'utf8')
    for (const name of ['createOrder', 'adjustStockForStatusChange']) {
      const start = source.indexOf(`export async function ${name}`)
      const next = source.indexOf('\nexport ', start + 10)
      const body = source.slice(start, next === -1 ? undefined : next)
      assert.match(body, /revalidateCatalog\(\)/, `${name} keshni tozalamaydi`)
    }
  })

  test('kesh muddati zaxira sifatida mantiqli', () => {
    // O'zgarishlar keshni darhol tozalaydi; muddat faqat zaxira
    assert.ok(CACHE_SECONDS >= 60 && CACHE_SECONDS <= 24 * 60 * 60)
  })
})
