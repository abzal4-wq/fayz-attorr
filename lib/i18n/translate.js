import { DEFAULT_LOCALE } from './config'

const PLURAL_FORMS = ['zero', 'one', 'two', 'few', 'many', 'other']

/**
 * Lug'atdagi qiymat plural shakllari to'plamimi?
 *
 * Masalan ruscha "{n} aromat / aromata / aromatov":
 *   { "one": "{n} аромат", "few": "{n} аромата", "many": "{n} ароматов" }
 */
function isPluralForms(node) {
  if (node === null || typeof node !== 'object') return false

  const keys = Object.keys(node)
  return keys.length > 0 && keys.every((key) => PLURAL_FORMS.includes(key))
}

/** "cart.empty" kabi nuqtali kalitni lug'at ichidan topadi. */
function lookup(messages, key) {
  let node = messages

  for (const part of key.split('.')) {
    if (node === null || typeof node !== 'object') return undefined
    node = node[part]
  }

  if (typeof node === 'string' || isPluralForms(node)) return node
  return undefined
}

/**
 * Sondan kelib chiqib to'g'ri shaklni tanlaydi.
 *
 * `Intl.PluralRules` — brauzer va Node'ning o'zida bor, qo'shimcha paket
 * kerak emas. O'zbek tilida bu yerda shakl o'zgarmaydi ("5 ta atir"),
 * rus tilida uchta shakl bor, ingliz tilida ikkita.
 */
function selectPlural(forms, locale, count) {
  if (typeof count !== 'number' || !Number.isFinite(count)) {
    return forms.other ?? forms.many ?? forms.one ?? Object.values(forms)[0]
  }

  let category = 'other'
  try {
    category = new Intl.PluralRules(locale).select(count)
  } catch {
    // Noma'lum til kodi — "other" bilan davom etamiz
  }

  return (
    forms[category] ??
    forms.other ??
    forms.many ??
    forms.one ??
    Object.values(forms)[0]
  )
}

/** "{n} ta atir" -> "12 ta atir" */
function interpolate(template, vars) {
  if (!vars) return template

  return template.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
  )
}

/**
 * Tarjimon yaratadi.
 *
 * Kalit tanlangan tilda topilmasa — o'zbekchasiga tushadi. Bu ataylab:
 * ru/en lug'atida biror kalit yozilmay qolsa, foydalanuvchi bo'sh joy
 * emas, hech bo'lmasa o'zbekcha matnni ko'radi. `npm run i18n` esa
 * bunday tushib qolgan kalitlarni topib beradi.
 *
 * @param {object} messages tanlangan tildagi lug'at
 * @param {string} locale plural qoidalari uchun til kodi
 * @param {object} [fallback] o'zbekcha lug'at (asosiy tilning o'zida kerak emas)
 * @returns {(key: string, vars?: object) => string}
 */
export function createTranslator(messages, locale = DEFAULT_LOCALE, fallback) {
  return function t(key, vars) {
    let found = lookup(messages, key)

    if (found === undefined && fallback) {
      found = lookup(fallback, key)
    }

    if (found === undefined) {
      // Ishlab chiqish paytida ko'zga tashlanishi uchun
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[i18n] kalit topilmadi: ${key}`)
      }
      return key
    }

    const template = isPluralForms(found)
      ? selectPlural(found, locale, vars?.n)
      : found

    return interpolate(template, vars)
  }
}
