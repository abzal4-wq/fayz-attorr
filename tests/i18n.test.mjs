import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createTranslator } from '@/lib/i18n/translate'
import { normalizeLocale, LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/config'

const load = (locale) =>
  JSON.parse(
    readFileSync(new URL(`../lib/i18n/messages/${locale}.json`, import.meta.url), 'utf8')
  )

const uz = load('uz')
const ru = load('ru')
const en = load('en')

describe('normalizeLocale', () => {
  const cases = [
    ['uz', 'uz'], ['ru', 'ru'], ['en', 'en'],
    ['RU', 'ru'], ['ru-RU', 'ru'], ['en_US', 'en'],
    ['de', DEFAULT_LOCALE], ['', DEFAULT_LOCALE], ['zzz', DEFAULT_LOCALE],
    [null, DEFAULT_LOCALE], [undefined, DEFAULT_LOCALE], [123, DEFAULT_LOCALE],
  ]
  for (const [input, expected] of cases) {
    test(`${JSON.stringify(input)} -> ${expected}`, () => {
      assert.equal(normalizeLocale(input), expected)
    })
  }
})

describe('tarjimon', () => {
  test("o'rin egallovchini almashtiradi", () => {
    const t = createTranslator(uz, 'uz')
    assert.equal(t('catalog.count', { n: 5 }), '5 ta atir')
  })

  test("noma'lum kalit kalitning o'zini qaytaradi", () => {
    const t = createTranslator(uz, 'uz')
    assert.equal(t('yoq.kalit'), 'yoq.kalit')
  })

  test("tushib qolgan kalit o'zbekchaga tushadi", () => {
    const partial = JSON.parse(JSON.stringify(ru))
    delete partial.catalog.title
    const t = createTranslator(partial, 'ru', uz)
    assert.equal(t('catalog.title'), uz.catalog.title)
  })

  test("berilmagan o'rin egallovchi o'z holicha qoladi", () => {
    const t = createTranslator(uz, 'uz')
    assert.equal(t('catalog.count', {}), '{n} ta atir')
  })
})

describe('plural shakllari', () => {
  test('rus tilida uchta shakl', () => {
    const t = createTranslator(ru, 'ru')
    assert.equal(t('catalog.count', { n: 1 }), '1 аромат')
    assert.equal(t('catalog.count', { n: 2 }), '2 аромата')
    assert.equal(t('catalog.count', { n: 5 }), '5 ароматов')
    assert.equal(t('catalog.count', { n: 21 }), '21 аромат')
    assert.equal(t('catalog.count', { n: 11 }), '11 ароматов')
  })

  test('ingliz tilida ikkita shakl', () => {
    const t = createTranslator(en, 'en')
    assert.equal(t('catalog.count', { n: 1 }), '1 perfume')
    assert.equal(t('catalog.count', { n: 2 }), '2 perfumes')
  })

  test('o‘zbek tilida shakl o‘zgarmaydi', () => {
    const t = createTranslator(uz, 'uz')
    assert.equal(t('catalog.count', { n: 1 }), '1 ta atir')
    assert.equal(t('catalog.count', { n: 5 }), '5 ta atir')
  })
})

describe('lug‘atlar to‘liqligi', () => {
  const PLURAL = ['zero', 'one', 'two', 'few', 'many', 'other']
  const isPlural = (v) =>
    v && typeof v === 'object' && Object.keys(v).every((k) => PLURAL.includes(k))

  function keys(node, prefix = '', out = new Set()) {
    for (const [k, v] of Object.entries(node)) {
      const path = prefix ? `${prefix}.${k}` : k
      if (typeof v === 'string' || isPlural(v)) out.add(path)
      else if (v && typeof v === 'object') keys(v, path, out)
    }
    return out
  }

  const base = keys(uz)

  for (const [name, dict] of [['ru', ru], ['en', en]]) {
    test(`${name}: barcha kalitlar bor`, () => {
      const missing = [...base].filter((k) => !keys(dict).has(k))
      assert.deepEqual(missing, [], `tushib qolgan: ${missing.join(', ')}`)
    })
    test(`${name}: ortiqcha kalit yo‘q`, () => {
      const extra = [...keys(dict)].filter((k) => !base.has(k))
      assert.deepEqual(extra, [], `ortiqcha: ${extra.join(', ')}`)
    })
  }

  test('uchta til e‘lon qilingan', () => {
    assert.deepEqual(LOCALES, ['uz', 'ru', 'en'])
  })
})
