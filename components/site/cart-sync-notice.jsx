'use client'

import { Info } from 'lucide-react'
import { useT } from '@/lib/i18n/client'

/**
 * Savat serverdan yangilanganda nima o'zgargani haqida xabar.
 *
 * Jimgina o'zgartirish mumkin emas: mijoz narx oshganini yoki mahsulot
 * tugaganini bilmay qolsa, keyin aldangandek his qiladi.
 *
 * @param {null | { priceChanged: string[], unavailable: string[], quantityReduced: string[] }} props.changes
 * @param {'light'|'dark'} [props.tone]  savat paneli to'q fonda
 */
export function CartSyncNotice({ changes, tone = 'light' }) {
  const t = useT()
  if (!changes) return null

  const lines = [
    changes.priceChanged.length > 0 && t('cart.syncPriceChanged'),
    changes.quantityReduced.length > 0 && t('cart.syncQuantityReduced'),
    changes.unavailable.length > 0 && t('cart.syncUnavailable'),
  ].filter(Boolean)

  if (lines.length === 0) return null

  return (
    <div
      role="status"
      className={
        tone === 'dark'
          ? 'flex items-start gap-2 rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm text-ivory'
          : 'flex items-start gap-2 rounded-lg border border-gold/50 bg-gold/10 p-3 text-sm text-foreground'
      }
    >
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  )
}
