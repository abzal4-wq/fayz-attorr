'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useT } from '@/lib/i18n/client'

/** Harakat kamaytirilganmi (tizim sozlamasi). */
export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * "To'xtatib turish" mantiqi — ikkala karusel ham shuni ishlatadi.
 *
 * Sichqoncha ustida, klaviatura fokusida va barmoq tekkanida aylanish
 * to'xtaydi. Teginishdan keyin darrov emas, 6 soniyadan so'ng davom
 * etadi: odam atirni ko'rayotgan bo'lsa, qo'lini olishi bilan slayd
 * o'zgarib ketishi jahlini chiqaradi.
 */
export function useHold() {
  const pausedRef = useRef(false)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const pause = useCallback(() => {
    clearTimeout(timerRef.current)
    pausedRef.current = true
  }, [])

  const resume = useCallback((delay = 0) => {
    clearTimeout(timerRef.current)
    if (delay === 0) {
      pausedRef.current = false
      return
    }
    timerRef.current = setTimeout(() => {
      pausedRef.current = false
    }, delay)
  }, [])

  const holdProps = {
    onPointerEnter: pause,
    onPointerLeave: () => resume(0),
    onFocusCapture: pause,
    onBlurCapture: () => resume(0),
    onTouchStart: pause,
    onTouchEnd: () => resume(6000),
  }

  return { pausedRef, pause, resume, holdProps }
}

/**
 * Avtomatik aylanish taymeri.
 *
 * `document.hidden` tekshiriladi: boshqa tabda turganda aylantirish
 * bekorga batareya yeydi va foydalanuvchi qaytganda slayd allaqachon
 * o'nlab marta almashgan bo'ladi.
 */
export function useAutoplay(step, { interval, enabled, pausedRef }) {
  useEffect(() => {
    if (!enabled || interval <= 0) return
    if (prefersReducedMotion()) return

    const id = setInterval(() => {
      if (pausedRef.current || document.hidden) return
      step()
    }, interval)

    return () => clearInterval(id)
  }, [step, interval, enabled, pausedRef])
}

/**
 * Doira bo'ylab aylanadigan karusel (3D g'ildirak) uchun holat.
 *
 * Scroll yo'q — faqat faol element raqami. Raqam chetga chiqqanda
 * aylanib boshiga qaytadi, shuning uchun g'ildirak hech qachon
 * "tugamaydi".
 */
export function useWheel({ count, interval = 3600 }) {
  const [index, setIndex] = useState(0)
  const { pausedRef, pause, resume, holdProps } = useHold()

  const goTo = useCallback(
    (target) => {
      if (count < 1) return
      // Manfiy son uchun ham ishlaydigan modul
      setIndex(((target % count) + count) % count)
    },
    [count]
  )

  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])

  // `index` o'zgarganda taymer qaytadan boshlanadi — qo'lda o'tkazgandan
  // keyin keyingi slaydgacha to'liq interval bo'ladi
  const step = useCallback(() => setIndex((i) => (i + 1) % count), [count])
  useAutoplay(step, { interval, enabled: count > 1, pausedRef })

  /**
   * Barmoq bilan surish. Pointer hodisalari — sichqoncha, barmoq va
   * qalam uchun bitta kod.
   */
  const dragRef = useRef(null)

  const dragProps = {
    onPointerDown: (event) => {
      // O'ng tugma yoki ko'p barmoq — e'tiborsiz
      if (event.button !== 0) return
      dragRef.current = { x: event.clientX, moved: false }
      pause()
    },
    onPointerMove: (event) => {
      const drag = dragRef.current
      if (!drag) return

      const delta = event.clientX - drag.x
      // 40px — tasodifiy titrashni surish deb hisoblamaslik uchun
      if (Math.abs(delta) < 40) return

      goTo(index + (delta < 0 ? 1 : -1))
      dragRef.current = { x: event.clientX, moved: true }
    },
    onPointerUp: () => {
      const moved = dragRef.current?.moved
      dragRef.current = null
      resume(moved ? 6000 : 0)
    },
    onPointerCancel: () => {
      dragRef.current = null
      resume(0)
    },
  }

  return { index, goTo, next, prev, holdProps, dragProps }
}

/**
 * Yon tomonga suriladigan qator uchun holat ("Tanlangan atirlar").
 *
 * NEGA transform emas, NATIVE SCROLL: mijozlarning 90%+ telefonda va
 * Telegram Mini App ichida. Brauzerning o'z scroll'i barmoq harakatini
 * piksel-ba-piksel kuzatadi, inertsiya va chetdagi "rezina" effekti
 * bepul keladi.
 *
 * MUHIM: barcha kartochkalar bir xil enda bo'lishi shart — faol element
 * raqami `scrollLeft / qadam` dan hisoblanadi.
 */
export function useCarousel({ count, interval = 4500 }) {
  const trackRef = useRef(null)
  const [index, setIndex] = useState(0)
  // Progress chizig'i: `size` — ko'rinayotgan ulush, `start` — chapdan siljish
  const [progress, setProgress] = useState({ start: 0, size: 1 })
  const { pausedRef, holdProps } = useHold()

  const sync = useCallback(() => {
    const el = trackRef.current
    if (!el || count < 1) return

    const step = el.scrollWidth / count
    const maxScroll = el.scrollWidth - el.clientWidth

    if (step > 0) {
      const i = Math.round(el.scrollLeft / step)
      setIndex(Math.max(0, Math.min(count - 1, i)))
    }

    const size = el.scrollWidth > 0 ? Math.min(1, el.clientWidth / el.scrollWidth) : 1
    const start = maxScroll > 0 ? (el.scrollLeft / maxScroll) * (1 - size) : 0
    setProgress({ start, size })
  }, [count])

  // Ekran o'lchami o'zgarganda qayta hisoblash (telefon gorizontalga burilishi)
  useEffect(() => {
    sync()
    const el = trackRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => observer.disconnect()
  }, [sync])

  const goTo = useCallback(
    (target) => {
      const el = trackRef.current
      if (!el || count < 1) return

      const step = el.scrollWidth / count
      const clamped = Math.max(0, Math.min(count - 1, target))
      el.scrollTo({
        left: step * clamped,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      })
    },
    [count]
  )

  /*
   * Oxiriga yetganini `index` bo'yicha emas, scroll bo'yicha tekshiramiz.
   * NEGA: qatorda bir vaqtda bir nechta kartochka ko'rinadi (telefonda
   * ~2 ta, desktopda 4 ta). Oxirgi kartochka ekranga kirganda scroll
   * allaqachon tugagan bo'ladi, lekin `index` hali oxirgisi emas —
   * index bo'yicha tekshirsak karusel bir necha soniya qotib turardi.
   */
  const next = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2
    goTo(atEnd ? 0 : index + 1)
  }, [goTo, index])

  const prev = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const atStart = el.scrollLeft <= 2
    goTo(atStart ? count - 1 : index - 1)
  }, [goTo, index, count])

  useAutoplay(next, { interval, enabled: count > 1, pausedRef })

  return { trackRef, index, progress, goTo, next, prev, sync, holdProps }
}

/** Klaviatura: chap/o'ng strelka bilan almashtirish. */
export function carouselKeyDown(prev, next) {
  return (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      prev()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      next()
    }
  }
}

/**
 * O'q tugmasi.
 *
 * DIQQAT: bu yerga `hidden` klassini bermang. Tugmaning asosiy klassi
 * `inline-flex` — ikkalasi ham bitta klass bo'lgani uchun qaysi biri
 * yutishi Tailwind CSS'dagi tartibga bog'liq bo'lib qoladi (sinovda
 * `hidden` yutmadi). Yashirish kerak bo'lsa o'ram div'ga bering.
 */
export function CarouselArrow({ direction, onClick, tone = 'light', className = '' }) {
  const t = useT()
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight

  const tones = {
    dark: 'border-ivory/25 bg-brand-darker/70 text-ivory hover:border-gold hover:bg-brand-darker',
    light: 'border-border bg-card text-foreground hover:border-gold hover:bg-accent',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'prev' ? t('common.prev') : t('common.next')}
      className={`inline-flex size-11 items-center justify-center rounded-full border transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${tones[tone]} ${className}`}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  )
}

/** Slayd nuqtalari — g'ildirak uchun (element soni kam va aniq). */
export function CarouselDots({ count, index, goTo, label }) {
  const t = useT()

  return (
    <div className="flex items-center justify-center" role="tablist" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === index}
          aria-label={t('common.slideNumber', { number: i + 1 })}
          onClick={() => goTo(i)}
          /*
           * Ko'rinadigan nuqta 8px, lekin bosish maydoni 44px. Avval
           * nuqtaning o'zi tugma edi — telefonda tegib bo'lmasdi.
           */
          className="flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
        >
          <span
            className={`block rounded-full transition-all duration-300 ${
              i === index ? 'h-2 w-6 bg-gold' : 'size-2 bg-ivory/40'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

/**
 * Progress chizig'i — atirlar qatori uchun.
 *
 * NEGA nuqta emas: qatorda bir vaqtda 2-4 kartochka ko'rinadi, ya'ni
 * "faol slayd" degan tushuncha yo'q. 10 ta nuqtadan bittasini yoqish
 * yolg'on ma'lumot berardi. Chiziq esa "ro'yxatning qaysi qismidasiz"
 * degan savolga to'g'ri javob beradi.
 */
export function CarouselProgress({ progress, className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`h-1 overflow-hidden rounded-full bg-border ${className}`}
    >
      <div
        className="h-full rounded-full bg-gold-deep transition-[width,margin] duration-200"
        style={{
          width: `${Math.max(8, progress.size * 100)}%`,
          marginInlineStart: `${progress.start * 100}%`,
        }}
      />
    </div>
  )
}
