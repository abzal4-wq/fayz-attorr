import Image from 'next/image'
import Link from 'next/link'
import { Clock, MapPin, Phone } from 'lucide-react'
import { InstagramIcon, TelegramIcon } from './brand-icons'
import { getStoreSettings } from '@/lib/settings'

export async function SiteFooter() {
  const settings = await getStoreSettings()

  const contacts = [
    settings.phone && {
      icon: Phone,
      label: settings.phone,
      href: `tel:${settings.phone.replace(/\s/g, '')}`,
    },
    settings.address && { icon: MapPin, label: settings.address },
    settings.workingHours && { icon: Clock, label: settings.workingHours },
  ].filter(Boolean)

  const socials = [
    settings.telegramUrl && {
      icon: TelegramIcon,
      label: 'Telegram',
      href: settings.telegramUrl,
    },
    settings.instagramUrl && {
      icon: InstagramIcon,
      label: 'Instagram',
      href: settings.instagramUrl,
    },
  ].filter(Boolean)

  return (
    <footer className="dark bg-popover text-foreground">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Image
            src="/logo.png"
            alt="Fayz Attor"
            width={640}
            height={640}
            className="h-20 w-20 rounded-xl"
          />
          <p className="mt-4 max-w-xs text-sm text-muted-on-dark">
            Ko'p brendli atir do'koni. Ayollar, erkaklar va unisex atirlar.
          </p>
        </div>

        <nav aria-label="Katalog">
          <h2 className="font-serif text-lg text-ivory">Katalog</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              { href: '/katalog?gender=WOMEN', label: 'Ayollar uchun' },
              { href: '/katalog?gender=MEN', label: 'Erkaklar uchun' },
              { href: '/katalog?gender=UNISEX', label: 'Unisex' },
              { href: '/katalog?chegirma=1', label: 'Chegirmadagilar' },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-muted-on-dark underline-offset-4 transition-colors duration-200 hover:text-ivory hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-serif text-lg text-ivory">Aloqa</h2>

          {contacts.length > 0 ? (
            <ul className="mt-4 space-y-3 text-sm">
              {contacts.map(({ icon: Icon, label, href }) => (
                <li key={label} className="flex items-start gap-2.5">
                  <Icon
                    className="mt-0.5 size-4 shrink-0 text-gold"
                    aria-hidden="true"
                  />
                  {href ? (
                    <a
                      href={href}
                      className="text-muted-on-dark underline-offset-4 transition-colors duration-200 hover:text-ivory hover:underline"
                    >
                      {label}
                    </a>
                  ) : (
                    <span className="text-muted-on-dark">{label}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          {socials.length > 0 ? (
            <ul className="mt-5 flex gap-2">
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
      </div>

      {settings.deliveryInfo ? (
        <div className="border-t border-border">
          <p className="mx-auto max-w-[1280px] px-4 py-4 text-sm text-muted-on-dark sm:px-6">
            {settings.deliveryInfo}
          </p>
        </div>
      ) : null}

      <div className="border-t border-border">
        <p className="mx-auto max-w-[1280px] px-4 py-5 text-sm text-muted-on-dark sm:px-6">
          © {new Date().getFullYear()} Fayz Attor
        </p>
      </div>
    </footer>
  )
}
