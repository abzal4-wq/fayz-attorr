'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ImageOff, X, ZoomIn } from 'lucide-react'
import { useT } from '@/lib/i18n/client'
import { cn } from '@/lib/utils'

/**
 * Rasm galereyasi.
 * - Mobil: gorizontal swipe (scroll-snap), pastda nuqtalar
 * - Desktop: chapda thumbnail'lar, o'ngda katta rasm
 * - Zoom: rasmni bosish to'liq ekranda ochadi
 */
export function ProductGallery({ images, alt }) {
  const t = useT()
  const [active, setActive] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const scrollerRef = useRef(null)

  useEffect(() => {
    if (!zoomed) return
    function onKey(e) {
      if (e.key === 'Escape') setZoomed(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [zoomed])

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl border border-border bg-muted">
        <ImageOff className="size-10 text-muted-deep" aria-hidden="true" />
      </div>
    )
  }

  /** Mobil swipe paytida qaysi rasm ko'rinayotganini aniqlaydi. */
  function onScroll(event) {
    const el = event.currentTarget
    const index = Math.round(el.scrollLeft / el.clientWidth)
    if (index !== active) setActive(index)
  }

  return (
    <>
      {/* Mobil: swipe */}
      <div className="lg:hidden">
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-xl"
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => {
                setActive(index)
                setZoomed(true)
              }}
              aria-label={t('product.zoomNth', { n: index + 1 })}
              className="w-full shrink-0 snap-center"
            >
              <Image
                src={image.url}
                alt={index === 0 ? alt : ''}
                width={800}
                height={800}
                priority={index === 0}
                sizes="100vw"
                className="aspect-square w-full bg-muted object-cover"
              />
            </button>
          ))}
        </div>

        {images.length > 1 ? (
          <div className="mt-3 flex justify-center gap-1.5">
            {images.map((image, index) => (
              <span
                key={image.id}
                aria-hidden="true"
                className={cn(
                  'h-1.5 rounded-full transition-all duration-200',
                  index === active ? 'w-5 bg-brand-deep' : 'w-1.5 bg-muted-deep/40'
                )}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Desktop: thumbnail + katta rasm */}
      <div className="hidden gap-4 lg:flex">
        {images.length > 1 ? (
          <ul className="flex w-20 shrink-0 flex-col gap-2">
            {images.map((image, index) => (
              <li key={image.id}>
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={t('product.thumbNth', { n: index + 1 })}
                  aria-current={index === active ? 'true' : undefined}
                  className={cn(
                    'block overflow-hidden rounded-lg border-2 transition-colors duration-200',
                    index === active
                      ? 'border-brand-deep'
                      : 'border-transparent hover:border-border'
                  )}
                >
                  <Image
                    src={image.url}
                    alt=""
                    // Joyi 80px, lekin DPR 3 da 240px kerak. srcset
                    // `width` va `width*2` dan yasalgani uchun shu
                    // qiymat 2 baravar oshirildi — CSS o'lchami
                    // o'zgarmaydi (`w-full`).
                    width={160}
                    height={160}
                    className="aspect-square w-full bg-muted object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label={t('product.zoom')}
          className="group relative min-w-0 flex-1 overflow-hidden rounded-xl"
        >
          <Image
            src={images[active].url}
            alt={alt}
            width={800}
            height={800}
            priority
            sizes="(max-width: 1280px) 50vw, 600px"
            className="aspect-square w-full bg-muted object-cover"
          />
          <span className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full bg-brand-darker/70 text-ivory opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <ZoomIn className="size-5" aria-hidden="true" />
          </span>
        </button>
      </div>

      {/* Zoom */}
      {zoomed ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('product.galleryLabel')}
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-darker/95 p-4"
        >
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={() => setZoomed(false)}
            className="absolute inset-0"
          />
          <Image
            src={images[active].url}
            alt={alt}
            width={1200}
            height={1200}
            className="relative max-h-full w-auto max-w-full object-contain"
          />
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label={t('common.close')}
            className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-ivory/10 text-ivory transition-colors hover:bg-ivory/20"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </>
  )
}
