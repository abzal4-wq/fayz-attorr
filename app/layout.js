import { sans, serif } from './fonts'
import { I18nProvider } from '@/lib/i18n/client'
import { getI18n } from '@/lib/i18n/server'
import { OG_LOCALES } from '@/lib/i18n/config'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export async function generateMetadata() {
  const { locale, t } = await getI18n()

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t('meta.homeTitle'),
      template: '%s | Fayz Attor',
    },
    description: t('meta.siteDescription'),
    openGraph: {
      type: 'website',
      siteName: 'Fayz Attor',
      locale: OG_LOCALES[locale],
    },
  }
}

export const viewport = {
  themeColor: '#0D454E',
  width: 'device-width',
  initialScale: 1,
  // maximumScale cheklanmaydi — foydalanuvchi zoom qila olishi kerak (a11y)
}

export default async function RootLayout({ children }) {
  const { locale, messages } = await getI18n()

  return (
    <html lang={locale} className={`${sans.variable} ${serif.variable}`}>
      <body className="antialiased">
        {/*
          Lug'at serverda tanlanadi va client komponentlariga shu provider
          orqali o'tadi. Brauzerga faqat bitta til yuboriladi.
        */}
        <I18nProvider locale={locale} messages={messages}>
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}
