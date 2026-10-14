'use client'

import { useEffect, useState } from 'react'

/**
 * Savat localStorage'da saqlanadi, serverda esa u yo'q. Agar birinchi
 * renderda savat tarkibini chizsak, server va brauzer HTML'i mos kelmaydi
 * (hydration mismatch). Shuning uchun savatga bog'liq hamma narsa
 * faqat brauzerda ulangandan keyin chiziladi.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return hydrated
}
