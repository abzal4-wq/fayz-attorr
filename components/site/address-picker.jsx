'use client'

import dynamic from 'next/dynamic'
import { Check, LoaderCircle, LocateFixed, Map as MapIcon, TriangleAlert, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { TASHKENT_CENTER, formatOsmAddress, isInUzbekistan, reverseGeocodeUrl } from '@/lib/geo'
import { useLocale, useT } from '@/lib/i18n/client'

/*
 * Leaflet faqat xarita OCHILGANDA yuklanadi. ssr:false — Leaflet
 * `window` ga tayanadi, serverda ishlamaydi.
 */
const AddressMapCanvas = dynamic(() => import('./address-map-canvas'), {
  ssr: false,
  loading: () => <div className="skeleton h-64 rounded-lg sm:h-72" />,
})

/**
 * Manzilni xaritada belgilash.
 *
 * Matnli manzil maydoni ASOSIY bo'lib qoladi (xonadon, qavat, mo'ljal
 * faqat matnda). Xarita qo'shimcha: kuryerga aniq nuqtani beradi va
 * manzilni avtomatik yozib, mijozning ishini yengillashtiradi.
 *
 * @param {{lat:number, lon:number}|null} props.point  tanlangan nuqta
 * @param {(point) => void} props.onPointChange
 * @param {(address:string) => void} props.onAddressDetected  topilgan manzil matni
 */
export function AddressPicker({ point, onPointChange, onAddressDetected }) {
  const t = useT()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [initialCenter, setInitialCenter] = useState(TASHKENT_CENTER)
  const [initialZoom, setInitialZoom] = useState(12)
  const [locating, setLocating] = useState(false)
  const [status, setStatus] = useState(null) // { kind: 'loading'|'found'|'error', text }
  const controller = useRef(null)
  const requestId = useRef(0)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  /**
   * Nuqtadan manzil matnini topadi.
   *
   * 700ms kutib so'raladi: xarita surilayotganda har to'xtashda emas,
   * odam to'xtatganda. Nominatim soniyasiga 1 so'rovdan ko'pga ruxsat
   * bermaydi. Eski javob kech kelsa e'tiborsiz qoldiriladi (requestId).
   */
  const lookupAddress = useCallback(
    (lat, lon) => {
      clearTimeout(timer.current)
      const id = ++requestId.current
      setStatus({ kind: 'loading', text: t('checkout.mapLocating') })

      timer.current = setTimeout(async () => {
        try {
          const res = await fetch(reverseGeocodeUrl(lat, lon, locale), {
            headers: { Accept: 'application/json' },
          })
          if (!res.ok) throw new Error(String(res.status))
          const data = await res.json()
          if (id !== requestId.current) return

          const text = formatOsmAddress(data?.address)
          if (text) {
            setStatus({ kind: 'found', text })
            onAddressDetected?.(text)
          } else {
            setStatus({ kind: 'error', text: t('checkout.mapNoAddress') })
          }
        } catch {
          if (id !== requestId.current) return
          // Manzil topilmasa ham nuqta saqlanadi — kuryerga shu yetarli
          setStatus({ kind: 'error', text: t('checkout.mapNoAddress') })
        }
      }, 700)
    },
    [locale, onAddressDetected, t]
  )

  const handleMove = useCallback(
    ({ lat, lon }) => {
      if (!isInUzbekistan(lat, lon)) {
        // O'zbekistondan tashqari — buyurtmaga yozilmaydi (server ham rad etadi)
        onPointChange?.(null)
        setStatus({ kind: 'error', text: t('checkout.mapOutside') })
        return
      }
      onPointChange?.({ lat, lon })
      lookupAddress(lat, lon)
    },
    [lookupAddress, onPointChange, t]
  )

  /** Telefon GPS'i orqali joylashuv. */
  function locate() {
    if (!('geolocation' in navigator)) {
      setStatus({ kind: 'error', text: t('checkout.mapGeoUnsupported') })
      setOpen(true)
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        const { latitude: lat, longitude: lon } = position.coords

        if (controller.current) {
          // Xarita ochiq — o'sha joyga uchadi, `moveend` qolganini qiladi
          controller.current.flyTo(lat, lon, 17)
        } else {
          setInitialCenter({ lat, lon })
          setInitialZoom(17)
          setOpen(true)
        }
      },
      (error) => {
        setLocating(false)
        // Rad etilgan bo'lsa ham xarita ochiladi — qo'lda belgilash mumkin
        setOpen(true)
        setStatus({
          kind: 'error',
          text:
            error.code === error.PERMISSION_DENIED
              ? t('checkout.mapGeoDenied')
              : t('checkout.mapGeoFailed'),
        })
      },
      // enableHighAccuracy: uy darajasidagi aniqlik kerak; 10s dan keyin voz kechiladi
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  function close() {
    setOpen(false)
    clearTimeout(timer.current)
    requestId.current += 1
    setStatus(null)
    // Xarita yopilsa nuqta ham bekor — mijoz uni ataylab yopdi
    onPointChange?.(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-card-foreground transition-colors duration-200 hover:border-brand-mid disabled:opacity-70"
        >
          {locating ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed className="size-4" aria-hidden="true" />
          )}
          {t('checkout.mapLocate')}
        </button>

        {open ? (
          <button
            type="button"
            onClick={close}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-muted-deep transition-colors hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
            {t('checkout.mapClose')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-card-foreground transition-colors duration-200 hover:border-brand-mid"
          >
            <MapIcon className="size-4" aria-hidden="true" />
            {t('checkout.mapOpen')}
          </button>
        )}
      </div>

      {open ? (
        <>
          <p className="text-sm text-muted-deep">{t('checkout.mapHint')}</p>
          <AddressMapCanvas
            center={point ?? initialCenter}
            zoom={point ? 17 : initialZoom}
            onMove={handleMove}
            controller={controller}
            label={t('checkout.mapLabel')}
            // Faqat haqiqiy joy (GPS yoki avvalgi tanlov) — standart
            // Toshkent markazi tanlov emas (address-map-canvas.jsx izohi)
            selectOnOpen={Boolean(point) || initialCenter !== TASHKENT_CENTER}
          />
        </>
      ) : null}

      {status ? (
        <p
          role="status"
          className={
            status.kind === 'error'
              ? 'flex items-start gap-2 text-sm text-danger-deep'
              : 'flex items-start gap-2 text-sm text-muted-deep'
          }
        >
          {status.kind === 'loading' ? (
            <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin" aria-hidden="true" />
          ) : status.kind === 'found' ? (
            <Check className="mt-0.5 size-4 shrink-0 text-success-deep" aria-hidden="true" />
          ) : (
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          )}
          <span>{status.text}</span>
        </p>
      ) : null}
    </div>
  )
}
