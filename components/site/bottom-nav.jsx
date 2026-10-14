'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, ShoppingBag, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/', label: 'Bosh sahifa', icon: Home, exact: true },
  { href: '/katalog', label: 'Katalog', icon: Search },
  { href: '/savat', label: 'Savat', icon: ShoppingBag },
  { href: '/profil', label: 'Profil', icon: User },
]

/** Mobil pastki navigatsiya. Desktopda ko'rinmaydi. */
export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Asosiy navigatsiya"
      className="dark glass fixed inset-x-0 bottom-0 z-40 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="mx-auto flex h-16 max-w-md items-stretch">
        {items.map((item) => {
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
                <Icon className="size-5" aria-hidden="true" />
                <span className="text-[11px]">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
