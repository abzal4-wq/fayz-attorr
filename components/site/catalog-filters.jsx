'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import {
  GENDERS,
  buildCatalogQuery,
  countActiveFilters,
} from '@/lib/catalog-params'
import { useMoney, useT } from '@/lib/i18n/client'
import { cn } from '@/lib/utils'

function Section({ title, children }) {
  return (
    <div className="border-b border-border py-5 first:pt-0 last:border-b-0">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  )
}

function Checkbox({ checked, onChange, label, count }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 cursor-pointer accent-brand-mid"
      />
      <span className="flex-1 text-foreground">{label}</span>
      {count != null ? (
        <span className="text-xs text-muted-deep">{count}</span>
      ) : null}
    </label>
  )
}

/** Filtr tarkibi — sidebar va bottom sheet ichida bir xil ishlatiladi. */
function FilterBody({ draft, setDraft, options }) {
  const t = useT()
  const money = useMoney()

  function toggleIn(key, value) {
    const current = draft[key]
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    setDraft({ ...draft, [key]: next })
  }

  return (
    <div>
      <Section title={t('catalog.sectionGender')}>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((value) => {
            const active = draft.gender === value
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setDraft({ ...draft, gender: active ? null : value })
                }
                className={cn(
                  'min-h-11 rounded-lg border px-4 text-sm font-medium transition-colors duration-200',
                  active
                    ? 'border-brand-deep bg-secondary text-secondary-foreground'
                    : 'border-border text-foreground hover:border-brand-mid'
                )}
              >
                {t(`gender.${value}`)}
              </button>
            )
          })}
        </div>
      </Section>

      {options.brands.length > 0 ? (
        <Section title={t('catalog.sectionBrand')}>
          <div className="max-h-64 space-y-0.5 overflow-y-auto">
            {options.brands.map((brand) => (
              <Checkbox
                key={brand.slug}
                checked={draft.brandSlugs.includes(brand.slug)}
                onChange={() => toggleIn('brandSlugs', brand.slug)}
                label={brand.name}
                count={brand.count}
              />
            ))}
          </div>
        </Section>
      ) : null}

      {options.sizes.length > 0 ? (
        <Section title={t('catalog.sectionSize')}>
          <div className="flex flex-wrap gap-2">
            {options.sizes.map((size) => {
              const active = draft.sizeMl.includes(size.valueMl)
              return (
                <button
                  key={size.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleIn('sizeMl', size.valueMl)}
                  className={cn(
                    'min-h-11 rounded-lg border px-3.5 text-sm transition-colors duration-200',
                    active
                      ? 'border-brand-deep bg-secondary text-secondary-foreground'
                      : 'border-border text-foreground hover:border-brand-mid'
                  )}
                >
                  {size.label}
                </button>
              )
            })}
          </div>
        </Section>
      ) : null}

      <Section title={t('catalog.sectionPrice')}>
        <div className="flex items-center gap-2">
          <label className="flex-1">
            <span className="sr-only">{t('catalog.minPrice')}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={money(options.minPrice, { withSuffix: false })}
              value={draft.minPrice ?? ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  minPrice: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              className="w-full min-h-11 rounded-lg border border-input bg-card px-3 text-[16px] text-card-foreground focus:border-brand-mid focus:outline-none"
            />
          </label>
          <span className="text-muted-deep">—</span>
          <label className="flex-1">
            <span className="sr-only">{t('catalog.maxPrice')}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={money(options.maxPrice, { withSuffix: false })}
              value={draft.maxPrice ?? ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  maxPrice: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              className="w-full min-h-11 rounded-lg border border-input bg-card px-3 text-[16px] text-card-foreground focus:border-brand-mid focus:outline-none"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-deep">
          {t('catalog.priceRange', {
            min: money(options.minPrice),
            max: money(options.maxPrice),
          })}
        </p>
      </Section>

      <Section title={t('catalog.sectionExtra')}>
        <Checkbox
          checked={draft.onlyDiscount}
          onChange={(v) => setDraft({ ...draft, onlyDiscount: v })}
          label={t('catalog.onlyDiscount')}
        />
      </Section>
    </div>
  )
}

export function CatalogFilters({ filters, options, total }) {
  const t = useT()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [draft, setDraft] = useState(filters)

  // Orqaga/oldinga bosilganda yoki havola almashganda qoralama yangilanadi
  useEffect(() => {
    setDraft(filters)
  }, [filters])

  function apply(next = draft) {
    const query = buildCatalogQuery({ ...next, page: 1 })
    setSheetOpen(false)
    startTransition(() => {
      router.push(query ? `/katalog?${query}` : '/katalog')
    })
  }

  function clearAll() {
    const empty = {
      gender: null,
      brandSlugs: [],
      sizeMl: [],
      minPrice: null,
      maxPrice: null,
      onlyDiscount: false,
      sort: filters.sort,
      /*
       * Qidiruv SAQLANADI. U filtr emas: alohida maydonda ko'rinib
       * turadi va badge'da sanalmaydi (countActiveFilters izohi).
       * Avval bu yerda yo'q edi — "chanel" deb qidirib, filtrni
       * tozalasa, qidiruv ham jimgina yo'qolardi.
       */
      query: filters.query,
    }
    setDraft(empty)
    apply(empty)
  }

  /*
   * "Ko'rsatish (N)" tugmasidagi son QORALAMA tanlovga mos bo'lishi
   * kerak. Avval u joriy natijadan (`total`) olinardi va tanlov
   * o'zgarganda yangilanmasdi: "Erkaklar"ni belgilasangiz ham
   * "Ko'rsatish (2)" deb turardi, bosganda esa 0 chiqishi mumkin edi —
   * tugma yolg'on va'da berardi.
   *
   * Endi qoralama qo'llangan filtrdan farq qilsa, son serverdan
   * so'raladi; javob kelguncha tugmada son ko'rsatilmaydi.
   */
  const [draftTotal, setDraftTotal] = useState(total)

  useEffect(() => {
    if (!sheetOpen) return

    const appliedKey = buildCatalogQuery({ ...filters, page: 1 })
    const draftKey = buildCatalogQuery({ ...draft, page: 1 })

    if (draftKey === appliedKey) {
      setDraftTotal(total)
      return
    }

    setDraftTotal(null)
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/katalog?${draftKey}`, {
          signal: controller.signal,
        })
        const data = await res.json()
        if (data?.ok) setDraftTotal(data.total)
      } catch {
        // Bekor qilindi yoki tarmoq xatosi — tugma sonsiz qoladi
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [draft, filters, total, sheetOpen])

  const activeCount = countActiveFilters(filters)

  return (
    <>
      {/* Desktop: chapdagi sidebar */}
      {/* order-first: DOM da oxirida, ko'rinishda chapda (katalog/page.js izohi) */}
      <aside className="hidden w-64 shrink-0 lg:order-first lg:block">
        <div className="sticky top-24">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-xl text-foreground">
              {t('catalog.filter')}
            </h2>
            {activeCount > 0 ? (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex min-h-11 items-center text-sm text-muted-deep underline-offset-4 hover:text-foreground hover:underline"
              >
                {t('catalog.clear')}
              </button>
            ) : null}
          </div>

          <FilterBody draft={draft} setDraft={setDraft} options={options} />

          <button
            type="button"
            onClick={() => apply()}
            disabled={isPending}
            className="mt-5 flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light disabled:opacity-70"
          >
            {t('catalog.apply')}
          </button>
        </div>
      </aside>

      {/* Mobil: sticky tugma */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-20 left-1/2 z-30 flex min-h-12 -translate-x-1/2 items-center gap-2 rounded-full bg-brand-deep px-5 text-sm font-semibold text-ivory shadow-lg lg:hidden"
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        {t('catalog.filter')}
        {activeCount > 0 ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-gold text-xs font-bold text-brand-darker">
            {activeCount}
          </span>
        ) : null}
      </button>

      {/* Mobil: pastdan chiqadigan shisha panel */}
      {sheetOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('catalog.filter')}
          className="fixed inset-0 z-50 flex items-end lg:hidden"
        >
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-brand-darker/50"
          />

          {/*
            Fon ATAYLAB qattiq (bg-background), shisha emas.

            Avval bu yerda `glass-light` turardi — u 6% shaffoflik
            beradi va orqadagi mahsulotlar ro'yxati filtr matni ostidan
            ko'rinib, panelni o'qib bo'lmas holga keltirardi. Ustiga
            blur ham qo'llanmasdi: minifikator standart
            `backdrop-filter` ni tashlab, faqat -webkit- variantini
            qoldirgan edi (endi tuzatilgan). Filtr paneli — ish
            quroli, uning ostidagi narsa ko'rinishi shart emas.
          */}
          <div className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-2xl border-t border-border bg-background p-5 pb-safe shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl text-foreground">
                {t('catalog.filter')}
              </h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label={t('common.close')}
                className="flex size-11 items-center justify-center rounded-lg text-muted-deep hover:text-foreground"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <FilterBody draft={draft} setDraft={setDraft} options={options} />

            <div className="sticky bottom-0 mt-5 flex gap-2 bg-background pb-2 pt-3">
              {activeCount > 0 ? (
                <button
                  type="button"
                  onClick={clearAll}
                  className="min-h-12 rounded-lg border border-border px-4 text-sm font-semibold text-foreground"
                >
                  {t('catalog.clear')}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => apply()}
                disabled={isPending}
                className="flex min-h-12 flex-1 items-center justify-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-70"
              >
                {draftTotal != null
                  ? t('catalog.showCount', { n: draftTotal })
                  : t('catalog.show')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

/** Saralash tanlovi — filtr panelidan tashqarida, ro'yxat tepasida. */
export function CatalogSort({ filters }) {
  const t = useT()
  const router = useRouter()

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{t('catalog.sort')}</span>
      <select
        value={filters.sort}
        onChange={(e) => {
          const query = buildCatalogQuery({
            ...filters,
            sort: e.target.value,
            page: 1,
          })
          router.push(query ? `/katalog?${query}` : '/katalog')
        }}
        // text-[16px] shart: kichikroq bo'lsa iOS fokusda sahifani zoom qiladi
        className="min-h-11 rounded-lg border border-input bg-card px-3 text-[16px] text-card-foreground focus:border-brand-mid focus:outline-none"
      >
        {[
          ['yangi', 'catalog.sortNew'],
          ['arzon', 'catalog.sortCheap'],
          ['qimmat', 'catalog.sortExpensive'],
          ['ommabop', 'catalog.sortPopular'],
        ].map(([value, key]) => (
          <option key={value} value={value}>
            {t(key)}
          </option>
        ))}
      </select>
    </label>
  )
}
