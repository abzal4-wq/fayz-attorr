'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, ShoppingBag, User } from 'lucide-react'
import { cartCount, useCart } from '@/lib/cart-store'
import { useHydrated } from '@/lib/use-hydrated'
import { useT } from '@/lib/i18n/client'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', key: 'bottomNav.home', icon: Home, exact: true },
  { href: '/katalog', key: 'bottomNav.catalog', icon: Search },
  { href: '/savat', key: 'bottomNav.cart', icon: ShoppingBag },
  { href: '/profil', key: 'bottomNav.profile', icon: User },
]

/**
 * Mobil pastki navigatsiya. Desktopda ko'rinmaydi.
 *
 * Fon ATAYLAB qattiq, shisha emas. Ikki sabab:
 *  1. Kontrast: shisha ustida faol holatdagi gold yorliq 3.92:1 beradi,
 *     qattiq brand-deep ustida 4.72:1 — 11px matn uchun 4.5 kerak.
 *  2. Tezlik: bu element ekranda doim turadi va orqasidan kontent
 *     scroll bo'ladi — blur har kadrda qayta hisoblanardi. MASTER.md
 *     scroll qilinadigan joyda blur ishlatishni taqiqlaydi.
 */
export function BottomNav() {
  const pathname = usePathname()
  const t = useT()
  const cartItems = useCart((state) => state.items)
  const hydrated = useHydrated()
  const count = hydrated ? cartCount(cartItems) : 0

  return (
    <nav
      aria-label={t('bottomNav.label')}
      className="dark fixed inset-x-0 bottom-0 z-40 border-t border-border bg-brand-deep lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* 56px (avval 64) — balandlik globals.css dagi pb-bottom-nav bilan bir xil bo'lishi shart */}
      <ul className="mx-auto flex h-14 max-w-md items-stretch">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-1 transition-colors duration-200',
                  active ? 'text-gold' : 'text-muted-on-dark'
                )}
              >
                <span className="relative">
                  <Icon className="size-5" aria-hidden="true" />
                  {item.href === '/savat' && count > 0 ? (
                    <span className="absolute -right-2 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-brand-darker">
                      {count}
                    </span>
                  ) : null}
                </span>
                {/* 12px (avval 11px): o'qilishi qiyin edi */}
                <span className="text-xs leading-tight">{t(item.key)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
