import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_QUERY_LENGTH,
  MAX_QUERY_WORDS,
  buildCatalogQuery,
  countActiveFilters,
  escapeLike,
  parseCatalogParams,
  parseQuery,
} from '@/lib/catalog-params'

describe('LIKE joker belgilarini ekranlash', () => {
  /*
   * Bu jonli bazada topilgan haqiqiy nuqson edi: Prisma `contains`
   * ichidagi % va _ ni ekranlamaydi, shuning uchun "q=%" butun
   * katalogni qaytarardi.
   */
  test('foiz belgisi ekranlanadi', () => {
    assert.equal(escapeLike('%'), '\\%')
    assert.equal(escapeLike('50%'), '50\\%')
  })

  test('pastki chiziq ekranlanadi', () => {
    // LIKE da `_` bitta ixtiyoriy belgini bildiradi
    assert.equal(escapeLike('_'), '\\_')
  })

  test('teskari chiziqning O‘ZI ham ekranlanadi', () => {
    /*
     * Tartib muhim: avval `\` ekranlanmasa, `\%` ni ekranlab
     * `\\%` olinardi — bu LIKE uchun "teskari chiziq + istalgan
     * narsa" degani, ya'ni joker yana tiklanib qolardi.
     */
    assert.equal(escapeLike('\\'), '\\\\')
    assert.equal(escapeLike('\\%'), '\\\\\\%')
  })

  test('oddiy so‘zlar o‘zgarmaydi', () => {
    for (const word of ['chanel', 'blue de chanel', 'Dior', "l'eau"]) {
      assert.equal(escapeLike(word), word)
    }
  })

  test('buzuq qiymatlar yiqitmaydi', () => {
    for (const bad of [null, undefined, 42]) {
      assert.equal(typeof escapeLike(bad), 'string')
    }
  })
})

describe('qidiruv satrini tozalash', () => {
  test('bo‘sh joylar olib tashlanadi', () => {
    assert.equal(parseQuery('  dior  '), 'dior')
  })

  test("so‘zlar orasidagi ortiqcha bo‘sh joy bittaga tushadi", () => {
    /*
     * Bu MUHIM: har bir so'z bazada alohida shart bo'ladi. Bo'sh
     * satrlar qolsa, `contains ""` sharti paydo bo'lib hamma narsa
     * mos kelib ketardi.
     */
    assert.equal(parseQuery('dior    sauvage'), 'dior sauvage')
    assert.equal(parseQuery('dior\t\nsauvage'), 'dior sauvage')
  })

  test('uzunlik cheklanadi', () => {
    const long = 'a'.repeat(MAX_QUERY_LENGTH + 50)
    assert.ok(parseQuery(long).length <= MAX_QUERY_LENGTH)
  })

  test("so‘zlar soni cheklanadi", () => {
    // Har so'z alohida SQL sharti — uzun satr og'ir so'rovga aylanardi
    const many = Array.from({ length: MAX_QUERY_WORDS + 10 }, (_, i) => `s${i}`)
    const parsed = parseQuery(many.join(' '))
    assert.equal(parsed.split(' ').length, MAX_QUERY_WORDS)
  })

  test('buzuq qiymatlar bo‘sh satr beradi', () => {
    for (const bad of [null, undefined, 42, {}, [], '   ']) {
      assert.equal(parseQuery(bad), '', `qiymat: ${String(bad)}`)
    }
  })
})

describe('qidiruv URL parametrlarida', () => {
  test('q parametri o‘qiladi', () => {
    const filters = parseCatalogParams({ q: 'dior sauvage' })
    assert.equal(filters.query, 'dior sauvage')
  })

  test('q bo‘lmasa bo‘sh satr', () => {
    assert.equal(parseCatalogParams({}).query, '')
  })

  test('URL qayta yasalganda qidiruv saqlanadi', () => {
    const filters = parseCatalogParams({ q: 'chanel', gender: 'WOMEN' })
    const query = buildCatalogQuery(filters)

    // Aylanib qaytish: natija bir xil bo'lishi kerak
    const back = parseCatalogParams(Object.fromEntries(new URLSearchParams(query)))
    assert.equal(back.query, 'chanel')
    assert.equal(back.gender, 'WOMEN')
  })

  test('bo‘sh qidiruv URL‘ga yozilmaydi', () => {
    const query = buildCatalogQuery(parseCatalogParams({}))
    assert.ok(!query.includes('q='), `URL: ${query}`)
  })

  test("qidiruv o‘zgarganda sahifa 1 ga qaytariladi", () => {
    /*
     * Komponent `page: 1` ni o'zi uzatadi. Bu test shuni
     * ta'minlaydi: 5-sahifada turib yangi so'z yozsa, eski sahifa
     * raqami qolib ketsa, natija bo'sh ko'rinardi.
     */
    const query = buildCatalogQuery({ query: 'dior', page: 1 })
    assert.ok(!query.includes('sahifa='), `URL: ${query}`)
  })
})

describe('qidiruv filtr badge‘iga qo‘shilmaydi', () => {
  test('faqat qidiruv bo‘lsa badge 0', () => {
    /*
     * Qidiruv alohida maydonda ko'rinib turadi va filtr panelidan
     * tozalanmaydi. Badge'ga qo'shilsa, foydalanuvchi panelni ochib
     * qidiruvni o'chirishga urinardi va topa olmasdi.
     */
    const filters = parseCatalogParams({ q: 'dior' })
    assert.equal(countActiveFilters(filters), 0)
  })

  test('haqiqiy filtrlar sanaladi', () => {
    const filters = parseCatalogParams({ q: 'dior', gender: 'MEN', chegirma: '1' })
    assert.equal(countActiveFilters(filters), 2)
  })
})
