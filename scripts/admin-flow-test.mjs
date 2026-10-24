/**
 * Do'kon egasining BIRINCHI kunini taqlid qiladi: bo'sh bazaga kirib,
 * brend va atir qo'shishga urinadi.
 *
 *   npm run flow
 *
 * Nega kerak: bo'sh katalog — ochilish kunidagi haqiqiy holat. Agar
 * "atir qo'shish" sahifasi brend yo'qligida boshi berk ko'chaga olib
 * kelsa, buni faqat shu yo'ldan yurib ko'rib bilish mumkin.
 */
import { existsSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const BASE = process.env.AUDIT_BASE || 'http://127.0.0.1:3939'
const USER = process.env.ADMIN_USERNAME
const PASS = process.env.ADMIN_PASSWORD

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p))

let fails = 0
function check(label, ok, extra = '') {
  console.log(`  ${ok ? 'ok ' : 'XATO'}  ${label}${extra ? '  \u2014 ' + extra : ''}`)
  if (!ok) fails++
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--hide-scrollbars'],
})

const page = await browser.newPage()
await page.setViewport({ width: 375, height: 780, deviceScaleFactor: 2, isMobile: true })

const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message.slice(0, 120)))
page.on('console', (m) => {
  if (m.type() === 'error') pageErrors.push('console: ' + m.text().slice(0, 120))
})

try {
  // --- Kirish ---
  await page.goto(`${BASE}/admin/kirish`, { waitUntil: 'networkidle2' })
  await page.type('#username', USER)
  await page.type('#password', PASS)
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
    page.click('button[type="submit"]'),
  ])
  await new Promise((r) => setTimeout(r, 1200))
  check('admin paneliga kirildi', !page.url().includes('/kirish'), page.url().replace(BASE, ''))

  // --- Bo'sh dashboard ---
  const dash = await page.evaluate(() => document.body.innerText.slice(0, 400))
  check('dashboard ochildi', dash.length > 50)

  // --- "Atir qo'shish" sahifasi brendsiz nima qiladi ---
  await page.goto(`${BASE}/admin/atirlar/yangi`, { waitUntil: 'networkidle2' })
  const form = await page.evaluate(() => {
    const brandSelect = document.querySelector('select[name="brandId"], #brandId')
    const sizeInputs = document.querySelectorAll('[name*="size"], [data-size]')
    const body = document.body.innerText
    return {
      brandOptions: brandSelect
        ? [...brandSelect.options].map((o) => o.textContent.trim()).filter(Boolean)
        : null,
      hasBrandSelect: Boolean(brandSelect),
      submitDisabled: document.querySelector('button[type="submit"]')?.disabled ?? null,
      // Egaga nima qilish kerakligi aytilganmi?
      mentionsBrand: /brend/i.test(body),
      bodyStart: body.slice(0, 260).replace(/\s+/g, ' '),
      sizeControls: sizeInputs.length,
      linkToBrands: Boolean(document.querySelector('a[href*="/admin/brendlar"]')),
    }
  })

  console.log('\n  --- "yangi atir" sahifasi (brendlar 0 ta) ---')
  console.log('  ', form.bodyStart)
  console.log()
  // Brend yo'q paytda forma KO'RSATILMASLIGI kerak: ishlamaydigan
  // formadan ko'ra "avval brend qo'shing" degan yo'l ko'rsatkich
  // foydaliroq. Dastlab buning teskarisini kutgan edim — test xato
  // edi, sahifa emas.
  if (form.hasBrandSelect) {
    check('brend tanlash ishlaydi', (form.brandOptions || []).length > 1)
  } else {
    check('brendsiz holda yo\'l ko\'rsatiladi (forma emas)', form.mentionsBrand)
    check('brendlar sahifasiga havola bor', form.linkToBrands)
  }

  // --- Brendlar sahifasi ---
  await page.goto(`${BASE}/admin/brendlar`, { waitUntil: 'networkidle2' })
  const brands = await page.evaluate(() => ({
    text: document.body.innerText.slice(0, 300).replace(/\s+/g, ' '),
    addButton: [...document.querySelectorAll('button, a')].some((e) =>
      /qo'shish|yangi|\+/i.test(e.textContent)
    ),
  }))
  console.log('\n  --- brendlar sahifasi (bo\'sh) ---')
  console.log('  ', brands.text)
  console.log()
  check('brend qo\'shish tugmasi bor', brands.addButton)

  check('sahifada JS xatosi yo\'q', pageErrors.length === 0, pageErrors.join(' | '))
} finally {
  await browser.close()
}

console.log()
if (fails) {
  console.log(`${fails} ta muammo.`)
  process.exit(1)
}
console.log('Egasining birinchi kuni: to\'siq yo\'q.')
