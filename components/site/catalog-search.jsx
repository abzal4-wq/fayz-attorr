'use client'

import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { MAX_QUERY_LENGTH, buildCatalogQuery } from '@/lib/catalog-params'
import { useT } from '@/lib/i18n/client'

/**
 * Katalogdagi qidiruv maydoni.
 *
 * Qidiruv URL'da (`?q=`) yashaydi — xuddi filtrlar kabi. Shuning
 * uchun natijani ulashsa bo'ladi, "orqaga" tugmasi ishlaydi va
 * sahifa serverda to'liq render bo'ladi.
 */
export function CatalogSearch({ filters }) {
  const t = useT()
  const router = useRouter()
  const [value, setValue] = useState(filters.query ?? '')
  const timer = useRef(null)

  /*
   * URL tashqi sabab bilan o'zgarsa (orqaga tugmasi, filtr tozalash)
   * maydon ham yangilanadi. Busiz brauzer "orqaga" qilganda ro'yxat
   * o'zgarib, maydonda eski so'z qolib ketardi.
   */
  useEffect(() => {
    setValue(filters.query ?? '')
  }, [filters.query])

  // Komponent yo'q bo'lsa kutib turgan o'tish bekor qilinadi
  useEffect(() => () => clearTimeout(timer.current), [])

  function go(next) {
    const query = buildCatalogQuery({ ...filters, query: next, page: 1 })
    router.push(query ? `/katalog?${query}` : '/katalog')
  }

  /*
   * Har harfdan keyin emas, 400ms jimlikdan keyin yuboriladi.
   *
   * Nega: har bosilgan tugma serverda yangi so'rov va yangi render
   * bo'lardi. Telefon tarmog'ida bu ro'yxatni sakratib,
   * yozayotgan odamni chalg'itadi.
   */
  function onChange(next) {
    setValue(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => go(next.trim()), 400)
  }

  function clear() {
    clearTimeout(timer.current)
    setValue('')
    go('')
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        // Enter bosilsa kutmaymiz
        clearTimeout(timer.current)
        go(value.trim())
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
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={MAX_QUERY_LENGTH}
        placeholder={t('catalog.searchPlaceholder')}
        // text-[16px] shart: kichikroq bo'lsa iOS fokusda sahifani zoom qiladi
        className="w-full min-h-12 rounded-lg border border-input bg-card pl-11 pr-12 text-[16px] text-card-foreground transition-colors duration-200 placeholder:text-muted-foreground focus:border-brand-mid focus:outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 [&::-webkit-search-cancel-button]:hidden"
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
