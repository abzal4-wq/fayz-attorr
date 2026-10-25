/**
 * Node uchun import yechuvchi.
 *
 * Loyiha kodi Next qoidalariga ko'ra yozilgan:
 *   import { x } from '@/lib/format'   — alias
 *   import { y } from './config'       — kengaytmasiz
 *
 * Next bularni o'zi yechadi, Node esa yecholmaydi. Testlar manba
 * kodini O'ZGARTIRMASDAN ishlashi uchun shu ikki holat shu yerda
 * hal qilinadi. Faqat testlar uchun; ilovaga hech qanday aloqasi yo'q.
 */
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = new URL('../', import.meta.url)

function withExtension(url) {
  const path = fileURLToPath(url)
  if (existsSync(path)) return url

  for (const ext of ['.js', '.mjs', '.jsx', '.json']) {
    if (existsSync(path + ext)) return new URL(url.href + ext)
  }
  for (const index of ['/index.js', '/index.mjs']) {
    if (existsSync(path + index)) return new URL(url.href + index)
  }
  return url
}

export function resolve(specifier, context, next) {
  // '@/lib/format' -> <loyiha ildizi>/lib/format.js
  if (specifier.startsWith('@/')) {
    const target = withExtension(new URL(specifier.slice(2), ROOT))
    return next(target.href, context)
  }

  // './config' -> ./config.js
  if (specifier.startsWith('.') && context.parentURL) {
    const target = withExtension(new URL(specifier, context.parentURL))
    if (target.href !== new URL(specifier, context.parentURL).href) {
      return next(target.href, context)
    }
  }

  return next(specifier, context)
}
