'use client'

import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { MAX_QUERY_LENGTH, buildCatalogQuery, parseQuery } from '@/lib/catalog-params'
import { useT } from '@/lib/i18n/client'

/**
 * Katalogdagi qidiruv maydoni.
 *
 * Qidiruv URL'da (`?q=`) yashaydi — xuddi filtrlar kabi. Shuning
 * uchun natijani ulashsa bo'ladi, "orqaga" tugmasi ishlaydi va
 * sahifa serverda to'liq render bo'ladi.
 *
 * DIQQAT: bu komponent katalogdagi `<Suspense key=...>` TASHQARISIDA
 * turishi shart (app/(site)/katalog/page.js). Ichida bo'lganida har
 * qidiruvda kalit o'zgarib, maydon skeleton bilan almashtirilardi:
 * fokus yo'qolardi va odam yozishda davom etsa harflar hech qayerga
 * tushmasdi.
 */
export function CatalogSearch({ filters }) {
  const t = useT()
  const router = useRouter()
  const [value, setValue] = useState(filters.query ?? '')
  const timer = useRef(null)

  /*
   * Oxirgi marta O'ZIMIZ URL'ga yozgan qiymat.
   *
   * Maydon endi qayta yaratilmaydi, ya'ni server javobi kelganda
   * `filters.query` o'zgaradi va uni maydonga yozish kerakmi, degan
   * savol tug'iladi. Agar har doim yozilsa — POYGA: odam "dior"
   * yozadi, so'rov ketadi, u "dior s" gacha yozib ulguradi, keyin
   * "dior" javobi kelib maydonni orqaga qaytarib yuboradi.
   *
   * Shuning uchun faqat TASHQI o'zgarish (orqaga tugmasi, filtrni
   * tozalash, havola) maydonga yoziladi; o'z so'rovimizning aks-sadosi
   * e'tiborsiz qoldiriladi.
   */
  const lastPushed = useRef(filters.query ?? '')

  useEffect(() => {
    const incoming = filters.query ?? ''
    if (incoming === lastPushed.current) return
    lastPushed.current = incoming
    setValue(incoming)
  }, [filters.query])

  // Komponent yo'q bo'lsa kutib turgan o'tish bekor qilinadi
  useEffect(() => () => clearTimeout(timer.current), [])

  /**
   * @param raw maydondagi qiymat
   * @param mode 'replace' — yozish paytida, 'push' — Enter va tozalash
   */
  function go(raw, mode) {
    /*
     * Server ham aynan shu funksiya bilan tozalaydi. Bu yerda ham
     * qo'llanmasa, "dior  s" (ikki bo'sh joy) yuborilib, "dior s"
     * qaytardi — `lastPushed` bilan mos kelmay, maydon yozish
     * paytida o'zgarib ketardi.
     */
    const next = parseQuery(raw)
    if (next === lastPushed.current) return
    lastPushed.current = next

    const query = buildCatalogQuery({ ...filters, query: next, page: 1 })
    const url = query ? `/katalog?${query}` : '/katalog'

    /*
     * Yozish paytida `replace`: aks holda har 400ms lik to'xtash
     * tarixga yozilib, "orqaga" tugmasi "d", "di", "dio" bo'ylab
     * yurardi. `scroll: false` — yozayotganda sahifa tepaga sakramasin.
     */
    if (mode === 'push') router.push(url, { scroll: false })
    else router.replace(url, { scroll: false })
  }

  /*
   * Har harfdan keyin emas, 400ms jimlikdan keyin yuboriladi —
   * har bosilgan tugma yangi server renderi bo'lardi va telefon
   * tarmog'ida ro'yxatni sakratardi.
   */
  function onChange(next) {
    setValue(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => go(next, 'replace'), 400)
  }

  function clear() {
    clearTimeout(timer.current)
    setValue('')
    go('', 'push')
  }

  return (
    <form
      role="search"
      /*
       * JS'SIZ HAM ISHLAYDI: sahifa JavaScript'dan 1-2 soniya oldin
       * ko'rinadi (sekin tarmoqda o'lchangan). Shu orada Enter bosilsa,
       * brauzer oddiy GET /katalog?q=... yuboradi va server natijani
       * o'zi chiqaradi. JS yuklangach onSubmit buni o'z qo'liga oladi
       * (filtrlar ham saqlanadi).
       */
      action="/katalog"
      method="get"
      onSubmit={(e) => {
        e.preventDefault()
        // Enter bosilsa kutmaymiz
        clearTimeout(timer.current)
        go(value, 'push')
      }}
      className="relative"
    >
      <label htmlFor="catalog-search" className="sr-only">
        {t('catalog.searchLabel')}
      </label>

      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-deep"
        aria-hidden="true"
      />

      <input
        id="catalog-search"
        // name="q": JS'siz yuborishda URL parametri (form izohiga qarang)
        name="q"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={MAX_QUERY_LENGTH}
        placeholder={t('catalog.searchPlaceholder')}
        // text-[16px] shart: kichikroq bo'lsa iOS fokusda sahifani zoom qiladi
        className="w-full min-h-11 rounded-lg border border-input bg-card pl-11 pr-12 text-[16px] text-card-foreground transition-colors duration-200 placeholder:text-muted-foreground focus:border-brand-mid focus:outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 [&::-webkit-search-cancel-button]:hidden"
      />

      {value ? (
        <button
          type="button"
          onClick={clear}
          aria-label={t('catalog.searchClear')}
          className="absolute right-0.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-deep transition-colors hover:text-card-foreground"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      ) : null}
    </form>
  )
}
