'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Menu,
  Package,
  Ruler,
  Settings,
  ShoppingBag,
  Tags,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin', label: 'Boshqaruv', icon: LayoutDashboard, exact: true },
  { href: '/admin/buyurtmalar', label: 'Buyurtmalar', icon: ShoppingBag },
  { href: '/admin/atirlar', label: 'Atirlar', icon: Package },
  { href: '/admin/brendlar', label: 'Brendlar', icon: Tags },
  { href: '/admin/hajmlar', label: 'Hajmlar', icon: Ruler },
  { href: '/admin/sozlamalar', label: 'Sozlamalar', icon: Settings },
]

function isActive(pathname, link) {
  return link.exact ? pathname === link.href : pathname.startsWith(link.href)
}

function NavLinks({ pathname, onNavigate }) {
  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const Icon = link.icon
        const active = isActive(pathname, link)
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-200',
              active
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-sidebar px-3 py-4 lg:block">
      <NavLinks pathname={pathname} />
    </aside>
  )
}

export function AdminMobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Menyuni ochish"
        className="flex size-11 items-center justify-center rounded-lg border border-border"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Menyuni yopish"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/40"
          />
          <div className="relative flex h-full w-64 flex-col bg-sidebar p-3 shadow-lg">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Menyuni yopish"
              className="mb-3 flex size-11 items-center justify-center self-end rounded-lg border border-border"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
