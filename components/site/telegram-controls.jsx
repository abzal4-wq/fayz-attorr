'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useTelegram } from './telegram-provider'

/**
 * Telegram'ning o'z BackButton'ini sayt navigatsiyasiga ulaydi.
 * Bosh sahifada tugma yashiriladi — qaytadigan joy yo'q.
 */
export function TelegramBackButton() {
  const { webApp } = useTelegram()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const backButton = webApp?.BackButton
    if (!backButton) return

    if (pathname === '/') {
      backButton.hide()
      return
    }

    const handler = () => router.back()
    backButton.onClick(handler)
    backButton.show()

    return () => {
      backButton.offClick(handler)
      backButton.hide()
    }
  }, [webApp, pathname, router])

  return null
}

/**
 * Telegram'ning pastdagi MainButton'i.
 *
 * Mini App'da asosiy amal shu tugmada bo'lgani tabiiyroq — sahifadagi
 * tugma esa Telegram chrome'i ostida qolib ketishi mumkin.
 *
 * @param label tugma matni
 * @param onClick bosilganda
 * @param disabled
 * @param loading
 */
export function TelegramMainButton({ label, onClick, disabled, loading }) {
  const { webApp } = useTelegram()

  useEffect(() => {
    const button = webApp?.MainButton
    if (!button) return

    button.setText(label)

    // Brend ranglari: gold fon, to'q teal matn (kontrast 6.66:1)
    try {
      button.setParams({ color: '#C9A961', text_color: '#072B32' })
    } catch {
      // Eski versiyalarda setParams bo'lmasligi mumkin
    }

    if (disabled) button.disable()
    else button.enable()

    if (loading) button.showProgress(false)
    else button.hideProgress()

    const handler = () => {
      if (!disabled && !loading) onClick?.()
    }

    button.onClick(handler)
    button.show()

    return () => {
      button.offClick(handler)
      button.hide()
      button.hideProgress()
    }
  }, [webApp, label, onClick, disabled, loading])

  return null
}
