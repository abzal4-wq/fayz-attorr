import { sans, serif } from './fonts'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Fayz Attor — original atirlar',
    template: '%s | Fayz Attor',
  },
  description:
    "Fayz Attor — ko'p brendli atir do'koni. Ayollar, erkaklar va unisex atirlar, " +
    'original mahsulot, Toshkent shahri va viloyati bo\'ylab bepul yetkazib berish.',
  openGraph: {
    type: 'website',
    siteName: 'Fayz Attor',
    locale: 'uz_UZ',
  },
}

export const viewport = {
  themeColor: '#0D454E',
  width: 'device-width',
  initialScale: 1,
  // maximumScale cheklanmaydi — foydalanuvchi zoom qila olishi kerak (a11y)
}

export default function RootLayout({ children }) {
  return (
    <html lang="uz" className={`${sans.variable} ${serif.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
