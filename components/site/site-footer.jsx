import Image from 'next/image'
import Link from 'next/link'
import { Clock, MapPin, Phone } from 'lucide-react'
import { InstagramIcon, TelegramIcon } from './brand-icons'
import { getStoreSettings } from '@/lib/settings'
import { currentShopYear } from '@/lib/format'
import { getT } from '@/lib/i18n/server'

/**
 * Sayt footer'i — IXCHAM.
 *
 * NEGA QAYTA YOZILDI: telefonda (375px) footer 954px edi — bo'sh savat
 * sahifasining o'zidan (478px) ikki baravar baland. Har bo'lim (logo,
 * katalog, aloqa) ustma-ust turar, har havola alohida qatorda edi.
 * Foydalanuvchi uni 3 baravar kichraytirishni so'radi.
 *
 * Endi telefonda: logo + nom + ijtimoiy tarmoqlar bitta qatorda,
 * katalog havolalari bitta qatorda, aloqa ikki qatorda, pastda bitta
 * kichik yozuv. Bosiladigan hamma narsa baribir >= 44px (talab).
 *
 * Logotip: avval /logo.png (640x640) 80px qutiga chiqarilardi va kech
 * yuklanib bo'sh joy bo'lib turardi. Sarlavhadagi yengil monogramma.
 */
export async function SiteFooter() {
  const [settings, t] = await Promise.all([getStoreSettings(), getT()])

  const socials = [
    settings.telegramUrl && { icon: TelegramIcon, label: 'Telegram', href: settings.telegramUrl },
    settings.instagramUrl && { icon: InstagramIcon, label: 'Instagram', href: settings.instagramUrl },
  ].filter(Boolean)

  const links = [
    { href: '/katalog?gender=WOMEN', label: t('gender.WOMEN') },
    { href: '/katalog?gender=MEN', label: t('gender.MEN') },
    { href: '/katalog?gender=UNISEX', label: t('gender.UNISEX') },
    { href: '/katalog?chegirma=1', label: t('footer.discounted') },
  ]

  // Manzil va ish vaqti bosilmaydi — bitta qatorga sig'adi
  const details = [
    settings.address && { icon: MapPin, label: settings.address },
    settings.workingHours && { icon: Clock, label: settings.workingHours },
  ].filter(Boolean)

  return (
    <footer className="dark bg-popover text-foreground">
      <div className="mx-auto max-w-[1280px] px-4 py-4 sm:px-6 md:py-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-h-11 items-center gap-2.5">
            <Image
              src="/monogram.png"
              alt=""
              width={72}
              height={72}
              className="size-8 rounded-lg"
            />
            <span className="text-sm font-semibold tracking-[0.18em] text-ivory">
              FAYZ ATTOR
            </span>
          </Link>

          {socials.length > 0 ? (
            <ul className="flex gap-1.5">
              {socials.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex size-11 items-center justify-center rounded-lg border border-border text-muted-on-dark transition-colors duration-200 hover:border-gold hover:text-gold"
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <p className="mt-1 text-xs text-muted-on-dark">{t('footer.tagline')}</p>

        <nav aria-label={t('footer.catalog')} className="mt-2">
          <ul className="flex flex-wrap gap-x-4 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  // min-w-11: qisqa so'z ("Men") bosish maydonini 29px ga
                  // toraytirib qo'yardi (mobil audit) — talab >= 44px
                  className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted-on-dark underline-offset-4 transition-colors duration-200 hover:text-ivory hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="text-sm">
          {settings.phone ? (
            <a
              href={`tel:${settings.phone.replace(/\s/g, '')}`}
              className="inline-flex min-h-11 items-center gap-2 text-ivory underline-offset-4 transition-colors duration-200 hover:underline"
            >
              <Phone className="size-4 shrink-0 text-gold" aria-hidden="true" />
              {settings.phone}
            </a>
          ) : null}

          {details.length > 0 ? (
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-on-dark">
              {details.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-1.5">
                  <Icon className="size-3.5 shrink-0 text-gold" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border">
        <p className="mx-auto max-w-[1280px] px-4 py-2.5 text-xs text-muted-on-dark sm:px-6">
          © {currentShopYear()} Fayz Attor
          {settings.deliveryInfo ? <> · {settings.deliveryInfo}</> : null}
        </p>
      </div>
    </footer>
  )
}
