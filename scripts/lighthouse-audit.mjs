/**
 * Lighthouse (mobil) \u2014 MASTER.md maqsadi: Perf 85+, A11y 95+.
 *
 *   npm run lh
 *
 * Mobil preset sekin 4G va 4x sekinlashtirilgan protsessorni taqlid
 * qiladi \u2014 ya'ni o'lchov arzon telefonga yaqin bo'ladi, bu yerdagi
 * noutbukka emas.
 */
import { existsSync, writeFileSync } from 'node:fs'
import { launch } from 'puppeteer-core'
import lighthouse from 'lighthouse'

const BASE = process.env.AUDIT_BASE || 'http://127.0.0.1:3939'

const PAGES = [
  ['bosh sahifa', '/'],
  ['katalog', '/katalog'],
  ['mahsulot', '/atir/demo-dior-sauvage'],
]

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p))

const TARGET = { performance: 85, accessibility: 95, 'best-practices': 90, seo: 90 }

const browser = await launch({
  executablePath: CHROME,
  headless: true,
  // Port QAT'IY berilmaydi: oldingi ishdan qolgan Chrome 9222 ni band
  // qilib tursa, Lighthouse boshqa oynaga ulanib "Target closed" beradi.
  args: ['--no-sandbox'],
})

const port = Number(new URL(browser.wsEndpoint()).port)
const rows = []
let failures = 0

try {
  for (const [label, path] of PAGES) {
    const result = await lighthouse(
      BASE + path,
      {
        port,
        output: 'json',
        logLevel: 'error',
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true, width: 375, height: 780, deviceScaleFactor: 2, disabled: false,
        },
        // UA da "Chrome-Lighthouse" bo'lishi SHART. Next 15 metadata'ni
        // oqim bilan yuboradi va uni faqat "HTML-cheklangan bot" ro'yxatidagi
        // UA lar uchun <head> ichiga bloklab qo'yadi. Bu qatorsiz
        // Lighthouse oddiy Chrome sifatida kelib, title/description ni
        // <body> da ko'radi va SEO ballini bekordan past qo'yadi.
        emulatedUserAgent:
          'Mozilla/5.0 (Linux; Android 11; moto g power) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse',
      },
    )

    const c = result.lhr.categories
    const row = {
      label,
      performance: Math.round(c.performance.score * 100),
      accessibility: Math.round(c.accessibility.score * 100),
      bp: Math.round(c['best-practices'].score * 100),
      seo: Math.round(c.seo.score * 100),
      lcp: result.lhr.audits['largest-contentful-paint'].displayValue,
      cls: result.lhr.audits['cumulative-layout-shift'].displayValue,
      tbt: result.lhr.audits['total-blocking-time'].displayValue,
    }
    rows.push(row)

    // Maqsaddan past bo'lsa \u2014 nega pastligini ham ko'rsatamiz
    if (row.performance < TARGET.performance || row.accessibility < TARGET.accessibility) {
      failures++
      const weak = Object.values(result.lhr.audits)
        .filter((a) => a.score !== null && a.score < 0.9 && a.details)
        .slice(0, 6)
        .map((a) => `      - ${a.title}${a.displayValue ? ': ' + a.displayValue : ''}`)
      if (weak.length) row.weak = weak.join('\n')
    }
  }
} finally {
  await browser.close()
}

console.log('\n  sahifa            perf  a11y   bp   seo   LCP        CLS     TBT')
console.log('  ' + '-'.repeat(70))
for (const r of rows) {
  console.log(
    `  ${r.label.padEnd(16)} ${String(r.performance).padStart(4)} ${String(r.accessibility).padStart(5)} ` +
    `${String(r.bp).padStart(4)} ${String(r.seo).padStart(5)}   ${(r.lcp || '').padEnd(10)} ${(r.cls || '').padEnd(7)} ${r.tbt || ''}`
  )
  if (r.weak) console.log(r.weak)
}

writeFileSync('lighthouse-results.json', JSON.stringify(rows, null, 2))

console.log()
console.log(`  Maqsad: Perf >= ${TARGET.performance}, A11y >= ${TARGET.accessibility}`)
if (failures) {
  console.log(`  ${failures} ta sahifa maqsadga yetmadi.`)
  process.exit(1)
}
console.log('  Hamma sahifa maqsadga yetdi.')
