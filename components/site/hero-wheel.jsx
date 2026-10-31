'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCardPrice } from './product-card'
import { useMoney, useT } from '@/lib/i18n/client'
import { cn } from '@/lib/utils'
import {
  nearestSlot,
  wheelDistance,
  wheelPlacement,
  wheelSlots,
} from '@/lib/wheel'

const AUTOPLAY_MS = 3600
// Barmoq tekkach shuncha kutiladi: odam o'qiyotgan paytda atir almashib
// ketmasin
const TOUCH_PAUSE_MS = 6000
// Bundan kichik siljish — bosish yoki qo'l titrashi, surish emas
const SWIPE_MIN_PX = 40

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return reduced
}

function usePageHidden() {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    const update = () => setHidden(document.hidden)
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  return hidden
}

/**
 * Bosh sahifadagi 3D g'ildirak: o'rtadagi atir katta va to'g'ri turadi,
 * yonidagilari kichrayib, ichkariga qiyshayib orqaga ketadi.
 *
 * Hisob-kitob (masofa, joylashuv, halqa) — `lib/wheel.js`, testlari bor.
 *
 * Flakonlarning HAMMASI DOM'da turadi, faqat `transform` o'zgaradi:
 * olib tashlansa, har aylanishda rasm qaytadan yuklanardi.
 *
 * @param {{ products: Array<object> }} props — `pickWheelProducts` dan
 *   o'tgan atirlar (kamida 1 ta)
 */
export function HeroWheel({ products }) {
  const t = useT()
  const money = useMoney()

  const count = products.length
  // Atir kam bo'lsa halqada takrorlanadi (sababi lib/wheel.js da)
  const slots = wheelSlots(count)

  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [touchHold, setTouchHold] = useState(false)
  const reducedMotion = useReducedMotion()
  const pageHidden = usePageHidden()

  const touchTimer = useRef(null)
  const swipe = useRef(null)
  const suppressClick = useRef(false)

  const current = products[active % count]
  const rotating =
    count > 1 &&
    !reducedMotion &&
    !hovered &&
    !focused &&
    !touchHold &&
    !pageHidden

  const goTo = useCallback(
    (slot) => setActive(((slot % slots) + slots) % slots),
    [slots]
  )
  const step = useCallback(
    (delta) => setActive((a) => (((a + delta) % slots) + slots) % slots),
    [slots]
  )

  // setInterval emas, setTimeout: qo'lda almashtirilgandan keyin ham
  // keyingi aylanish to'liq 3.6 soniya kutadi (bosilgan zahoti sakramaydi)
  useEffect(() => {
    if (!rotating) return
    const id = setTimeout(() => step(1), AUTOPLAY_MS)
    return () => clearTimeout(id)
  }, [rotating, active, step])

  useEffect(() => () => clearTimeout(touchTimer.current), [])

  function holdAfterTouch() {
    setTouchHold(true)
    clearTimeout(touchTimer.current)
    touchTimer.current = setTimeout(() => setTouchHold(false), TOUCH_PAUSE_MS)
  }

  function onPointerDown(e) {
    suppressClick.current = false
    if (e.pointerType !== 'mouse') holdAfterTouch()
    else if (e.button !== 0) return
    swipe.current = { id: e.pointerId, x: e.clientX }
  }

  function onPointerUp(e) {
    const start = swipe.current
    swipe.current = null
    if (!start || start.id !== e.pointerId || count < 2) return

    const dx = e.clientX - start.x
    if (Math.abs(dx) < SWIPE_MIN_PX) return

    // Surishdan keyingi "click" flakonni bosish deb olinmasin (sichqoncha
    // bilan o'rtadagisini sursa, atir sahifasiga o'tib ketardi)
    suppressClick.current = true
    step(dx < 0 ? 1 : -1)
    if (e.pointerType !== 'mouse') holdAfterTouch()
  }

  function onClickCapture(e) {
    if (!suppressClick.current) return
    suppressClick.current = false
    e.preventDefault()
    e.stopPropagation()
  }

  function onKeyDown(e) {
    if (count < 2) return
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      step(-1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      step(1)
    }
  }

  // Faqat KLAVIATURA fokusi to'xtatadi. Sichqoncha/barmoq bilan bosilgan
  // flakon ham fokus oladi — bu hisobga olinsa, bir marta bosilgan
  // g'ildirak boshqa joy bosilmaguncha umuman aylanmay qolardi.
  function onFocus(e) {
    let keyboard = true
    try {
      keyboard = e.target.matches(':focus-visible')
    } catch {
      // :focus-visible ni bilmaydigan eski brauzer — xavfsiz tomon
    }
    if (keyboard) setFocused(true)
  }

  function onBlur(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
  }

  const price = formatCardPrice(current, money, t)
  const position = (active % count) + 1

  return (
    <div
      role="group"
      aria-roledescription={t('home.wheelRole')}
      aria-label={t('home.featured')}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHovered(false)}
      className="mt-4 w-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold md:mt-6"
    >
      {/*
        touchAction 'pan-y' SHART: gorizontal surishni o'zimiz boshqaramiz,
        vertikal scroll esa brauzerda qoladi. Busiz Telegram Mini App
        ichida g'ildirakka tekkan barmoq sahifani aylantira olmasdi.
      */}
      <div
        className="relative h-40 select-none sm:h-52 md:h-72"
        style={{ perspective: '1100px', touchAction: 'pan-y' }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipe.current = null)}
        onClickCapture={onClickCapture}
      >
        {Array.from({ length: slots }, (_, slot) => {
          const product = products[slot % count]
          const place = wheelPlacement(wheelDistance(slot, active, slots))
          const isActive = slot === active

          return (
            <Link
              key={slot}
              href={`/atir/${product.slug}`}
              // Sichqoncha bilan surishda brauzer havolani "sudrab"
              // ketmasin — aks holda pointercancel kelib, surish uzilardi
              draggable={false}
              aria-hidden={isActive ? undefined : true}
              tabIndex={isActive ? 0 : -1}
              onClick={
                isActive
                  ? undefined
                  : (e) => {
                      // Yon flakon bosilsa — o'sha o'rtaga keladi
                      e.preventDefault()
                      goTo(slot)
                    }
              }
              className="absolute left-1/2 top-1/2 -ml-[72px] -mt-[72px] size-36 overflow-hidden rounded-2xl border border-ivory/15 bg-white shadow-xl shadow-black/30 transition-[transform,opacity] duration-500 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold motion-reduce:transition-none sm:-ml-[88px] sm:-mt-[88px] sm:size-44 md:-ml-[136px] md:-mt-[136px] md:size-[272px]"
              style={{
                transform: place.transform,
                opacity: place.opacity,
                zIndex: place.zIndex,
                pointerEvents: place.pointerEvents,
              }}
            >
              <Image
                src={product.imageUrl}
                alt={isActive ? `${product.brandName} ${product.name}` : ''}
                fill
                sizes="(min-width: 768px) 272px, (min-width: 640px) 176px, 144px"
                priority={slot === 0}
                draggable={false}
                className="object-contain"
              />

              {product.maxDiscount > 0 ? (
                <span className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-white md:left-3 md:top-3 md:px-2.5 md:py-1 md:text-sm">
                  −{product.maxDiscount}%
                </span>
              ) : null}

              {/*
                Uzoqdagi flakon to'q parda bilan xiralashadi — flakonning
                o'zi shaffof QILINMAYDI: oq fonli rasm to'q fonda kulrang
                bo'sh plitaga o'xshab qolardi.
              */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-brand-darker transition-opacity duration-500 ease-out motion-reduce:transition-none"
                style={{ opacity: place.shade }}
              />
            </Link>
          )
        })}
      </div>

      {/*
        Aylanib turganda e'lon qilinmaydi (aria-live off): aks holda ekran
        o'quvchi har 3.6 soniyada gapni bo'lib, yangi atirni o'qib turardi.
        Fokus kirgach yoki aylanish to'xtagach — polite.
      */}
      <p className="sr-only" aria-live={rotating ? 'off' : 'polite'}>
        {t('home.wheelStatus', {
          n: position,
          total: count,
          name: `${current.brandName} ${current.name}`,
        })}
      </p>

      {/*
        Qat'iy minimal balandlik: nom bir yoki ikki qatorli bo'ladi —
        busiz har aylanishda pastdagi hamma narsa sakrab turardi.
      */}
      <div className="mt-4 flex min-h-[140px] flex-col items-center justify-center md:mt-6 md:min-h-[164px]">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-on-dark">
          {current.brandName}
          {current.gender ? <> · {t(`genderFor.${current.gender}`)}</> : null}
        </p>
        <h2 className="mt-2 line-clamp-2 font-serif text-2xl font-semibold leading-tight text-ivory md:text-4xl">
          {current.name}
        </h2>
        {price ? (
          <p className="mt-2 flex flex-wrap items-baseline justify-center gap-x-2">
            <span className="text-lg font-bold text-gold md:text-2xl">{price}</span>
            {current.oldMinPrice ? (
              <span className="text-sm text-muted-on-dark line-through">
                {money(current.oldMinPrice, { withSuffix: false })}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 md:flex md:justify-center md:gap-3">
        <Link
          href={`/atir/${current.slug}`}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-primary px-2 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-gold-light md:px-5"
        >
          {t('home.viewProduct')}
          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </Link>
        <Link
          href="/katalog"
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-ivory/30 px-2 text-sm font-semibold text-ivory transition-colors duration-200 hover:border-gold hover:text-gold md:px-5"
        >
          {t('home.viewCatalog')}
          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </Link>
      </div>

      {count > 1 ? (
        <div className="mt-2 flex items-center justify-center md:mt-4 md:gap-2">
          {/*
            O'qlar faqat kompyuterda. Yashirish O'ROVCHI div'da: tugmaning
            o'zida `hidden md:inline-flex` bo'lsa, u asosiy `inline-flex`
            bilan to'qnashadi va qaysi biri yutishi CSS tartibiga bog'liq
            bo'lib qoladi — telefonda o'q chiqib qolardi.
          */}
          <div className="hidden md:block">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={t('home.wheelPrev')}
              className="inline-flex size-11 items-center justify-center rounded-full border border-ivory/30 text-ivory transition-colors duration-200 hover:border-gold hover:text-gold"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
          </div>

          <ul className="flex items-center">
            {products.map((product, index) => {
              const on = index === active % count
              return (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => goTo(nearestSlot(index, active, count, slots))}
                    aria-label={t('home.wheelGoTo', { n: index + 1 })}
                    aria-current={on ? 'true' : undefined}
                    className="flex size-11 items-center justify-center"
                  >
                    <span
                      className={cn(
                        'rounded-full transition-all duration-300 motion-reduce:transition-none',
                        on ? 'h-2 w-6 bg-gold' : 'size-2 bg-ivory/40'
                      )}
                    />
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="hidden md:block">
            <button
              type="button"
              onClick={() => step(1)}
              aria-label={t('home.wheelNext')}
              className="inline-flex size-11 items-center justify-center rounded-full border border-ivory/30 text-ivory transition-colors duration-200 hover:border-gold hover:text-gold"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
