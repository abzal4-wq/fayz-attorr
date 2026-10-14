'use client'

import { createContext, useContext, useEffect, useState } from 'react'

/**
 * Telegram Mini App integratsiyasi.
 *
 * Script SHARTLI yuklanadi: oddiy brauzerda u umuman kerak emas va
 * bekorga 30KB qo'shadi. Telegram Mini App'ni ochganda manzilga
 * `tgWebAppPlatform` yoki `#tgWebAppData=...` qo'shib yuboradi — shuni
 * tekshiramiz.
 */

const TelegramContext = createContext({ isMiniApp: false, webApp: null })

export function useTelegram() {
  return useContext(TelegramContext)
}

const SCRIPT_SRC = 'https://telegram.org/js/telegram-web-app.js'

/** Sahifa Telegram ichida ochilganmi. */
function looksLikeMiniApp() {
  if (typeof window === 'undefined') return false
  if (window.Telegram?.WebApp?.initData) return true

  const { hash, search } = window.location
  return hash.includes('tgWebApp') || search.includes('tgWebApp')
}

function loadScript() {
  return new Promise((resolve, reject) => {
    if (window.Telegram?.WebApp) {
      resolve(window.Telegram.WebApp)
      return
    }

    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Telegram?.WebApp))
      existing.addEventListener('error', reject)
      return
    }

    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve(window.Telegram?.WebApp)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export function TelegramProvider({ children }) {
  const [state, setState] = useState({ isMiniApp: false, webApp: null })

  useEffect(() => {
    if (!looksLikeMiniApp()) return

    let cancelled = false

    loadScript()
      .then((webApp) => {
        if (cancelled || !webApp) return

        webApp.ready()
        webApp.expand()

        // Telegram chrome'ini BREND ranglariga moslaymiz. Teskarisi emas:
        // logo ranglari majburiy, ularni Telegram mavzusiga moslab
        // o'zgartirib bo'lmaydi (design-system/MASTER.md).
        try {
          webApp.setHeaderColor('#0D454E')
          webApp.setBackgroundColor('#F5F2EA')
        } catch {
          // Eski Telegram versiyalarida bu metodlar yo'q
        }

        applyViewport(webApp)
        webApp.onEvent?.('viewportChanged', () => applyViewport(webApp))

        document.documentElement.dataset.telegram = 'true'
        setState({ isMiniApp: true, webApp })
      })
      .catch(() => {
        // Script yuklanmasa sayt oddiy rejimda ishlayveradi
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <TelegramContext.Provider value={state}>{children}</TelegramContext.Provider>
  )
}

/**
 * Telegram header'i kontentni yopib qolmasligi uchun haqiqiy balandlikni
 * CSS o'zgaruvchisiga yozamiz. `viewportStableHeight` — klaviatura ochilib
 * yopilganda sakramaydigan barqaror balandlik.
 */
function applyViewport(webApp) {
  const stable = webApp.viewportStableHeight
  if (typeof stable === 'number' && stable > 0) {
    document.documentElement.style.setProperty('--tg-viewport', `${stable}px`)
  }
}
