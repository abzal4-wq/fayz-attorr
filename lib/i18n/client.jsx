'use client'

import { createContext, useContext, useMemo } from 'react'
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from './config'
import { createTranslator } from './translate'
import { createMoney } from '@/lib/format'

const I18nContext = createContext(null)

/**
 * Lug'at serverda tanlanadi va shu yerga prop sifatida keladi — faqat
 * BITTA til brauzerga yuboriladi, uchalasi emas.
 *
 * Fallback alohida yuborilmaydi: server allaqachon kerakli tilni bergan,
 * va o'zbekchani ikkinchi marta yuborish bundle'ni ikki barobar qiladi.
 * Kalit tushib qolsa client'da kalit nomi ko'rinadi — `npm run i18n`
 * aynan shuni oldini oladi.
 */
export function I18nProvider({ locale, messages, children }) {
  const value = useMemo(
    () => ({ locale, messages, t: createTranslator(messages, locale) }),
    [locale, messages]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

function useI18n() {
  const value = useContext(I18nContext)

  if (!value) {
    throw new Error('useT faqat I18nProvider ichida ishlaydi')
  }
  return value
}

/** Client komponentlarida tarjima: `const t = useT()` */
export function useT() {
  return useI18n().t
}

/**
 * Narx formatlagich: `const money = useMoney()` -> `money(450000)`.
 * Valyuta so'zi tanlangan tildan olinadi.
 */
export function useMoney() {
  const { t } = useI18n()
  return useMemo(() => createMoney(t), [t])
}

/** Tanlangan til kodi ('uz' | 'ru' | 'en'). */
export function useLocale() {
  return useI18n().locale
}

/**
 * Tilni cookie'ga yozadi.
 *
 * httpOnly EMAS va shart emas: bu maxfiy ma'lumot emas, oddiy tanlov.
 * Shuning uchun server action ham kerak emas — cookie'ni brauzer o'zi
 * yozadi, keyin `router.refresh()` sahifani yangi tilda qayta oladi.
 */
export function setLocaleCookie(locale) {
  document.cookie = [
    `${LOCALE_COOKIE}=${locale}`,
    'path=/',
    `max-age=${LOCALE_COOKIE_MAX_AGE}`,
    'samesite=lax',
  ].join('; ')
}

export { DEFAULT_LOCALE }
