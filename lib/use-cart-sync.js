'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/lib/cart-store'

/**
 * Savatni serverdagi joriy holat bilan yangilaydi (rasm, narx, mavjudlik).
 *
 * Savat sahifasi, savat paneli va checkout ochilganda chaqiriladi. Nega
 * kerak — lib/cart-store.js dagi applySnapshot izohida.
 *
 * Faqat savatdagi MAHSULOTLAR TO'PLAMI o'zgarganda qayta so'raladi, miqdor
 * o'zgarganda emas: aks holda har "+" bosishda tarmoqqa so'rov ketardi.
 *
 * Xato bo'lsa jim qoladi: savat eski ma'lumot bilan ishlashda davom etadi,
 * buyurtmani esa server baribir o'zi tekshiradi.
 *
 * @param {boolean} enabled  masalan savat paneli faqat ochiq bo'lganda
 * @returns {null | { priceChanged: string[], unavailable: string[], quantityReduced: string[] }}
 */
export function useCartSync(enabled = true) {
  const sync = useCart((state) => state.sync)
  const ids = useCart((state) => state.items.map((item) => item.variantId).join(','))
  const [changes, setChanges] = useState(null)

  useEffect(() => {
    if (!enabled || !ids) return

    const controller = new AbortController()

    fetch('/api/savat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantIds: ids.split(',') }),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.ok) setChanges(sync(data.items))
      })
      .catch(() => {
        // Bekor qilindi yoki tarmoq xatosi — eski ma'lumot qoladi
      })

    return () => controller.abort()
  }, [enabled, ids, sync])

  return changes
}
