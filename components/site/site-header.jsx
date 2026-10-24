'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import { CartButton } from './cart-drawer'
import { LanguageSwitcher } from './language-switcher'
import { useT } from '@/lib/i18n/client'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/katalog?gender=WOMEN', key: 'gender.WOMEN' },
  { href: '/katalog?gender=MEN', key: 'gender.MEN' },
  { href: '/katalog?gender=UNISEX', key: 'gender.UNISEX' },
  { href: '/katalog', key: 'header.all' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const t = useT()
  const [scrolled, setScrolled] = useState(false)

  // Shisha effekti faqat scroll qilinganda yoqiladi: sahifa tepasida
  // blur ham, uning narxi ham kerak emas.
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'dark sticky top-0 z-40 transition-colors duration-200',
        scrolled ? 'glass' : 'bg-brand-deep'
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex min-h-11 shrink-0 items-center gap-2.5">
          <Image
            src="/monogram.png"
            alt=""
            width={200}
            height={200}
            priority
            className="size-9 rounded-lg"
          />
          <span className="text-sm font-semibold tracking-[0.18em] text-ivory">
            FAYZ ATTOR
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-muted-on-dark transition-colors duration-200 hover:text-ivory"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <LanguageSwitcher />

          <Link
            href="/profil"
            aria-label={t('header.profile')}
            aria-current={pathname === '/profil' ? 'page' : undefined}
            className="flex size-11 items-center justify-center rounded-lg text-muted-on-dark transition-colors duration-200 hover:text-ivory"
          >
            <User className="size-5" aria-hidden="true" />
          </Link>

          <CartButton />
        </div>
      </div>
    </header>
  )
}
