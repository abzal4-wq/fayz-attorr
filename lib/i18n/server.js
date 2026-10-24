import { cache } from 'react'
import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale } from './config'
import { createTranslator } from './translate'
import { createMoney } from '@/lib/format'
import uz from './messages/uz.json'
import ru from './messages/ru.json'
import en from './messages/en.json'

const MESSAGES = { uz, ru, en }

/**
 * Tanlangan til. Cookie'da bo'lmasa — o'zbekcha.
 *
 * `cache` bilan: bitta so'rov ichida layout, sahifa va bir nechta
 * komponent chaqirsa ham cookie bir marta o'qiladi.
 */
export const getLocale = cache(async () => {
  const store = await cookies()
  return normalizeLocale(store.get(LOCALE_COOKIE)?.value)
})

/** Server komponentiga beriladigan lug'at (client'ga ham shu yuboriladi). */
export function getMessages(locale) {
  return MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE]
}

/**
 * Server komponentlari va API yo'llari uchun tarjimon.
 *
 *   const t = await getT()
 *   t('cart.empty')
 */
export const getT = cache(async () => {
  const locale = await getLocale()
  return createTranslator(
    getMessages(locale),
    locale,
    locale === DEFAULT_LOCALE ? undefined : MESSAGES[DEFAULT_LOCALE]
  )
})

/** Server komponentlari uchun narx formatlagich. */
export const getMoney = cache(async () => createMoney(await getT()))

/** Til va tarjimon birga kerak bo'lganda. */
export const getI18n = cache(async () => {
  const locale = await getLocale()
  return { locale, t: await getT(), messages: getMessages(locale) }
})
