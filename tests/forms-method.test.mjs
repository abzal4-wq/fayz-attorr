import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/*
 * Har bir <form> da `method` ANIQ ko'rsatilishi shart.
 *
 * Sahifa JavaScript'dan oldin ko'rinadi (sekin tarmoqda 1-2 soniya). Shu
 * orada Enter bosilsa brauzer formani O'ZI yuboradi — standart usul GET.
 * Jonli saytda JS o'chirilgan holda tasdiqlangan:
 *
 *   /kirish?phone=901234567&password=MaxfiyParol123
 *
 * ya'ni parol URL'ga, brauzer tarixiga va server loglariga tushardi.
 *
 * Yangi forma qo'shilsa ham shu test uni tekshiradi — fayllar o'zi
 * yig'iladi, ro'yxat qo'lda yuritilmaydi.
 */

function collect(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) collect(path, out)
    else if (/\.jsx?$/.test(name)) out.push(path)
  }
  return out
}

/** Fayldagi har bir <form ...> ochuvchi tegini qaytaradi. */
function formTags(source) {
  return [...source.matchAll(/<form\b[\s\S]*?>/g)].map((m) => m[0])
}

const files = [...collect('components'), ...collect('app')].filter((file) =>
  formTags(readFileSync(file, 'utf8')).length > 0
)

describe('formalar: method aniq ko‘rsatilgan', () => {
  test('formalar topildi (test bo‘sh o‘tib ketmasin)', () => {
    assert.ok(files.length >= 10, `faqat ${files.length} ta fayl`)
  })

  for (const file of files) {
    test(file, () => {
      for (const tag of formTags(readFileSync(file, 'utf8'))) {
        const method = tag.match(/method="(get|post)"/)?.[1]
        assert.ok(method, `method yo'q: ${tag.slice(0, 80)}`)

        // GET faqat qidiruvga ruxsat: u yerda maxfiy narsa yo'q va
        // aniq manzil (action) bo'lishi kerak
        if (method === 'get') {
          assert.match(tag, /role="search"/, `GET faqat qidiruv uchun: ${file}`)
          assert.match(tag, /action="\//, `GET formada action yo'q: ${file}`)
        }
      }
    })
  }
})
