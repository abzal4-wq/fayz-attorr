'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useT } from '@/lib/i18n/client'

/**
 * Karusel yadrosi — bitta joyda, ikkala karusel ham shuni ishlatadi
 * (bosh sahifadagi katta banner va "Tanlangan atirlar" qatori).
 *
 * NEGA transform emas, NATIVE SCROLL:
 * mijozlarning 90%+ telefonda va Telegram Mini App ichida. Brauzerning
 * o'z scroll'i barmoq harakatini piksel-ba-piksel kuzatadi, inertsiya va
 * chetdagi "rezina" effekti bepul keladi. `translateX` bilan yozilgan
 * karusel buni JS'da qayta yasashga majbur qiladi va Mini App ichida
 * sahifaning vertikal scroll'i bilan urishib qoladi. Shuning uchun bu
 * yerda scroll-snap: avtomatik aylanish ham, o'q tugmalari ham faqat
 * `scrollTo` chaqiradi — qo'lda surish bilan bitta mexanizm.
 *
 * MUHIM: barcha slaydlar bir xil enda bo'lishi shart. Faol slayd raqami
 * `scrollLeft / slaydEni` dan hisoblanadi; en har xil bo'lsa raqam
 * adashadi.
 */
export function useCarousel({ count, interval = 5000 }) {
  const trackRef = useRef(null)
  const [index, setIndex] = useState(0)
  // Progress chizig'i: `size` — ko'rinayotgan ulush, `start` — chapdan siljish
  const [progress, setProgress] = useState({ start: 0, size: 1 })
  const pausedRef = useRef(false)
  const resumeTimerRef = useRef(null)

  /** Scroll holatidan faol slayd va progress chizig'ini hisoblaydi. */
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

  // Birinchi render va ekran o'lchami o'zgarganda qayta hisoblash:
  // telefon gorizontalga burilganda slayd eni o'zgaradi.
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
      const reduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      el.scrollTo({ left: step * clamped, behavior: reduced ? 'auto' : 'smooth' })
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

  // Avtomatik aylanish
  useEffect(() => {
    if (count < 2 || interval <= 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const id = setInterval(() => {
      // document.hidden: boshqa tabda turganda aylantirish bekorga
      // batareya yeydi va foydalanuvchi qaytganda slayd allaqachon
      // o'nlab marta almashgan bo'ladi.
      if (pausedRef.current || document.hidden) return
      next()
    }, interval)

    return () => clearInterval(id)
  }, [count, interval, next])

  useEffect(() => () => clearTimeout(resumeTimerRef.current), [])

  const pause = useCallback(() => {
    clearTimeout(resumeTimerRef.current)
    pausedRef.current = true
  }, [])

  /** Teginishdan keyin darrov emas — o'qiyotgan odamni uzmaslik uchun. */
  const resumeLater = useCallback((delay = 0) => {
    clearTimeout(resumeTimerRef.current)
    if (delay === 0) {
      pausedRef.current = false
      return
    }
    resumeTimerRef.current = setTimeout(() => {
      pausedRef.current = false
    }, delay)
  }, [])

  /**
   * Karusel konteyneriga tarqatiladigan proplar: sichqoncha ustida,
   * klaviatura fokusida yoki barmoq tekkanida aylanish to'xtaydi.
   */
  const holdProps = {
    onPointerEnter: pause,
    onPointerLeave: () => resumeLater(0),
    onFocusCapture: pause,
    onBlurCapture: () => resumeLater(0),
    onTouchStart: pause,
    onTouchEnd: () => resumeLater(6000),
  }

  return { trackRef, index, progress, goTo, next, prev, sync, holdProps }
}

/** Klaviatura: chap/o'ng strelka bilan slayd almashtirish. */
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
 * `tone="dark"` — to'q teal fon ustida (banner), `tone="light"` — ochiq
 * ivory fon ustida (atirlar qatori). Ikkala holatda ham tugma 44px dan
 * kichik emas.
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

/** Slayd nuqtalari — banner uchun (slayd soni kam va aniq). */
export function CarouselDots({ count, index, goTo, label }) {
  const t = useT()

  return (
    <div className="flex items-center justify-center gap-2" role="tablist" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === index}
          aria-label={t('common.slideNumber', { number: i + 1 })}
          onClick={() => goTo(i)}
          /*
           * Ko'rinadigan nuqta 8px, lekin bosish maydoni 44px (p-2.5 +
           * h-11 konteyner). Avval nuqtaning o'zi tugma edi — telefonda
           * tegib bo'lmasdi.
           */
          className="flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
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
