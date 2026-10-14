import { Cormorant_Garamond, Inter } from 'next/font/google'

// Sarlavhalar — logodagi "FAYZ" ruhi
export const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
})

// Matn va UI — logodagi "ATTOR" ruhi.
// Kirill subset'i majburiy: sayt ru tilida ham ishlaydi.
export const sans = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
})
