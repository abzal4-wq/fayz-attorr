'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Check, Globe } from 'lucide-react'
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n/config'
import { setLocaleCookie, useLocale, useT } from '@/lib/i18n/client'
import { cn } from '@/lib/utils'

/**
 * Header'dagi til almashtirgich.
 *
 * Mobilda joy tor, shuning uchun tugmada faqat "UZ" ko'rinadi; to'liq
 * nom menyuda. Tanlangach cookie yoziladi va `router.refresh()` sahifani
 * yangi tilda SERVERDAN qayta oladi — shuning uchun matn bir zumga
 * o'zbekchada "miltillab" ketmaydi.
 */
export function LanguageSwitcher() {
  const router = useRouter()
  const locale = useLocale()
  const t = useT()

  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const containerRef = useRef(null)
  const buttonRef = useRef(null)

  // Tashqariga bosish va Escape menyuni yopadi
  useEffect(() => {
    if (!open) return

    function onPointerDown(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    function onKey(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function choose(next) {
    setOpen(false)
    if (next === locale) return

    setLocaleCookie(next)
    startTransition(() => router.refresh())
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        aria-haspopup="menu"
        aria-expanded={open}
        // aria-label ichida ko'rinadigan "UZ" ham bor: aks holda ovozli
        // boshqaruvda odam "UZ" deydi, nom esa "Tilni tanlash" bo'lib
        // qolardi (WCAG 2.5.3 — auditda topildi)
        aria-label={`${t('header.language')}: ${LOCALE_LABELS[locale].short}`}
        className="flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted-on-dark transition-colors duration-200 hover:text-ivory disabled:opacity-60"
      >
        {/*
          375px da header tor: logo + til + profil + savat. Globus
          belgisi faqat sm'dan boshlab ko'rinadi, mobilda esa "UZ"
          ning o'zi kifoya — tugma baribir 44px balandlikda va
          aria-label bilan.
        */}
        <Globe className="hidden size-5 sm:block" aria-hidden="true" />
        <span>{LOCALE_LABELS[locale].short}</span>
      </button>

      {open ? (
        <ul
          role="menu"
          aria-label={t('header.chooseLanguage')}
          className="absolute right-0 top-full z-50 mt-1 min-w-44 overflow-hidden rounded-lg border border-border bg-brand-deep py-1 shadow-lg"
        >
          {LOCALES.map((code) => {
            const active = code === locale
            return (
              <li key={code} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  lang={code}
                  onClick={() => choose(code)}
                  className={cn(
                    'flex min-h-11 w-full items-center gap-2.5 px-3 text-left text-sm transition-colors duration-200',
                    active
                      ? 'text-gold'
                      : 'text-muted-on-dark hover:bg-brand-mid/30 hover:text-ivory'
                  )}
                >
                  {active ? (
                    <Check className="size-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <span className="size-4 shrink-0" aria-hidden="true" />
                  )}
                  {LOCALE_LABELS[code].native}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
