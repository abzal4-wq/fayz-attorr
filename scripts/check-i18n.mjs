/**
 * Lug'atlarni solishtiradi: uz asosiy til, ru va en undan ortda qolmasligi kerak.
 *
 *   npm run i18n
 *
 * Nega kerak: tarjima yetishmasa tarjimon o'zbekchaga tushadi, ya'ni sayt
 * buzilmaydi — lekin ruscha sahifada o'zbekcha matn paydo bo'ladi va buni
 * hech kim sezmaydi. Shu skript aytib beradi.
 */
import { readFileSync } from 'node:fs'

const PLURAL_FORMS = ['zero', 'one', 'two', 'few', 'many', 'other']

function load(locale) {
  const url = new URL(`../lib/i18n/messages/${locale}.json`, import.meta.url)
  return JSON.parse(readFileSync(url, 'utf8'))
}

/** Plural obyekti bitta kalit deb hisoblanadi, ichkarisiga kirilmaydi. */
function isPlural(node) {
  return (
    node !== null &&
    typeof node === 'object' &&
    Object.keys(node).length > 0 &&
    Object.keys(node).every((k) => PLURAL_FORMS.includes(k))
  )
}

function collect(node, prefix = '', out = new Map()) {
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'string' || isPlural(value)) {
      out.set(path, value)
    } else if (value !== null && typeof value === 'object') {
      collect(value, path, out)
    } else {
      out.set(path, value)
    }
  }
  return out
}

/** "{n} ta atir" -> ["n"] */
function placeholders(value) {
  const texts = typeof value === 'string' ? [value] : Object.values(value ?? {})
  const names = new Set()

  for (const text of texts) {
    if (typeof text !== 'string') continue
    for (const match of text.matchAll(/\{(\w+)\}/g)) names.add(match[1])
  }
  return names
}

const base = collect(load('uz'))
let problems = 0

for (const locale of ['ru', 'en']) {
  const target = collect(load(locale))

  for (const [key, value] of base) {
    if (!target.has(key)) {
      console.error(`${locale}: kalit yo'q -> ${key}`)
      problems++
      continue
    }

    // O'rin egallovchilar mos kelmasa, matnda "{n}" ko'rinib qoladi
    const expected = placeholders(value)
    const actual = placeholders(target.get(key))

    for (const name of expected) {
      if (!actual.has(name)) {
        console.error(`${locale}: {${name}} tushib qolgan -> ${key}`)
        problems++
      }
    }
    for (const name of actual) {
      if (!expected.has(name)) {
        console.error(`${locale}: ortiqcha {${name}} -> ${key}`)
        problems++
      }
    }
  }

  for (const key of target.keys()) {
    if (!base.has(key)) {
      console.error(`${locale}: uz'da yo'q, ortiqcha kalit -> ${key}`)
      problems++
    }
  }
}

if (problems > 0) {
  console.error(`\n${problems} ta muammo topildi.`)
  process.exit(1)
}

console.log(`Lug'atlar mos: ${base.size} ta kalit x 3 til.`)
