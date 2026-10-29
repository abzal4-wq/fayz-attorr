'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapPin } from 'lucide-react'
import { useEffect, useRef } from 'react'

/**
 * Leaflet xaritasi (OpenStreetMap).
 *
 * ALOHIDA FAYL VA FAQAT OCHILGANDA YUKLANADI (address-picker.jsx dagi
 * next/dynamic): Leaflet ~40KB va o'z CSS'i bor. Checkout sahifasini
 * har ochganda yuklansa, xaritadan foydalanmaydigan mijoz ham kutardi
 * va Lighthouse ko'rsatkichi tushardi.
 *
 * MARKAZDA QOTIRILGAN NUQTA, sudraladigan marker emas: telefonda kichik
 * markerni barmoq bilan ushlab sudrash qiyin, xaritani surish esa odatiy
 * harakat. Nuqta har doim markazda — xarita to'xtaganda markaz tanlangan
 * joy bo'ladi. (Leaflet'ning marker rasmlari bundler bilan buziladigan
 * ma'lum muammosi ham shu bilan chetlab o'tiladi.)
 *
 * @param {{lat:number, lon:number}} props.center   boshlang'ich markaz
 * @param {number} props.zoom
 * @param {(point:{lat:number, lon:number}) => void} props.onMove  xarita to'xtaganda
 * @param {object} props.controller  tashqaridan boshqarish: controller.current.flyTo(lat, lon)
 * @param {string} props.label  ekran o'quvchi uchun
 * @param {boolean} [props.selectOnOpen]  boshlang'ich markaz tanlov hisoblansinmi
 */
export default function AddressMapCanvas({
  center,
  zoom,
  onMove,
  controller,
  label,
  selectOnOpen = false,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  // onMove har renderda yangi funksiya bo'lishi mumkin — xarita qayta
  // yaratilmasligi uchun ref orqali
  const onMoveRef = useRef(onMove)
  onMoveRef.current = onMove

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lon],
      zoom,
      zoomControl: true,
      /*
       * Sichqoncha g'ildiragi bilan zoom o'chirilgan: sahifani pastga
       * aylantirayotgan odam xaritaga yetganda sahifa o'rniga xarita
       * zoom bo'lib ketardi. Zoom — tugmalar va ikki marta bosish.
       */
      scrollWheelZoom: false,
    })

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      // OSM litsenziyasi atributsiyani TALAB qiladi
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(map)

    // Leaflet o'z reklamasini (bayroq + havola) qo'shadi — kerak emas
    map.attributionControl.setPrefix(false)

    map.on('moveend', () => {
      const c = map.getCenter()
      onMoveRef.current?.({ lat: c.lat, lon: c.lng })
    })

    mapRef.current = map
    if (controller) {
      controller.current = {
        flyTo: (lat, lon, z = 17) => map.setView([lat, lon], z),
      }
    }

    /*
     * Boshlang'ich markaz FAQAT u haqiqiy joy bo'lsa (GPS yoki avval
     * tanlangan nuqta) tanlov hisoblanadi. Standart Toshkent markazi
     * tanlov EMAS: aks holda xaritani ochgan zahoti manzil maydoniga
     * shahar markazining ko'chasi yozilib, mijoz xaritani surmasdan
     * buyurtma bersa kuryer noto'g'ri joyga borardi.
     */
    if (selectOnOpen) onMoveRef.current?.({ lat: center.lat, lon: center.lon })

    return () => {
      map.remove()
      mapRef.current = null
      if (controller) controller.current = null
    }
    // Faqat bir marta yaratiladi; keyingi o'zgarishlar flyTo orqali
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative overflow-hidden rounded-lg border border-border">
      <div
        ref={containerRef}
        role="application"
        aria-label={label}
        // z-0: Leaflet ichki qatlamlari z-index 400 gacha — busiz xarita
        // sahifaning yopishqoq sarlavhasi va pastki menyu USTIGA chiqardi
        className="relative z-0 h-64 w-full sm:h-72"
      />
      {/*
        Markazdagi nuqta. Pastki uchi aynan markazga tushishi uchun
        -translate-y-full: aks holda tanlangan joy belgining o'rtasi
        bo'lib, ~12px ga siljigan bo'lardi.
      */}
      <MapPin
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 size-9 -translate-x-1/2 -translate-y-full fill-gold text-brand-deep drop-shadow"
      />
    </div>
  )
}
