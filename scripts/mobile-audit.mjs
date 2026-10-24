/**
 * Mobil audit: har bir sahifani haqiqiy brauzerda, haqiqiy kengliklarda ochadi.
 *
 *   npm run audit            # 375px, uch til
 *   npm run audit -- --all   # barcha kengliklar
 *   npm run audit -- --shot  # ustiga ekran rasmlarini saqlaydi
 *
 * Nega kerak: MASTER.md "gorizontal scroll yo'q", "bosish maydoni >=44px",
 * "input shrifti >=16px" deb talab qiladi. Bularni ko'z bilan chamalab
 * bo'lmaydi \u2014 o'lchash kerak. Skript tizimdagi Chrome'ni ishlatadi
 * (puppeteer-core brauzer yuklab olmaydi).
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import puppeteer from 'puppeteer-core'

const require = createRequire(import.meta.url)
const axeSource = require('axe-core').source

// 127.0.0.1 ataylab: 'localhost' Chrome'da ::1 (IPv6) ga ketib qolishi mumkin,
// Next esa IPv4 da tinglaydi — natijada ERR_CONNECTION_REFUSED.
const BASE = process.env.AUDIT_BASE || 'http://127.0.0.1:3939'
const ARGS = process.argv.slice(2)
const ALL_WIDTHS = ARGS.includes('--all')
const SHOTS = ARGS.includes('--shot')
const A11Y_VERBOSE = ARGS.includes('--a11y')  // buzilgan elementlarni ham ko'rsatadi
const SHOT_DIR = 'audit-shots'

/** MASTER.md dagi sinov kengliklari. */
const WIDTHS = ALL_WIDTHS ? [375, 414, 768, 1024, 1440] : [375]
const LOCALES = ['uz', 'ru', 'en']

const PRODUCT_PATH = process.env.AUDIT_PRODUCT || ''

const PAGES = [
  ['bosh sahifa', '/'],
  ['katalog', '/katalog'],
  ['katalog+filtr', '/katalog?gender=WOMEN&chegirma=1'],
  // Mahsulot sahifasi: bazadagi birinchi atir. Demo ma'lumot o'chirilgach
  // qat'iy slug ishlamay qoldi va audit 404 sahifani sinab \"toza\" deb
  // yozardi — shuning uchun endi AUDIT_PRODUCT bilan beriladi.
  ['savat', '/savat'],
  ['kirish', '/kirish'],
  ["ro'yxatdan o'tish", '/royxatdan-otish'],
  ['404', '/yoq-sahifa'],
  ['buyurtma qabul', '/buyurtma/muvaffaqiyat?raqam=1001'],
  ...(PRODUCT_PATH ? [['mahsulot', PRODUCT_PATH]] : []),
]

const CHROME_PATHS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
]

function findChrome() {
  const found = CHROME_PATHS.find((p) => existsSync(p))
  if (!found) {
    console.error('Chrome yoki Edge topilmadi. CHROME_PATH bilan ko\'rsatish mumkin.')
    process.exit(1)
  }
  return process.env.CHROME_PATH || found
}

/**
 * Sahifa ichida bajariladigan o'lchovlar.
 * Bu funksiya brauzerda ishlaydi — tashqi o'zgaruvchilarga murojaat qilmaydi.
 */
const MEASURE = () => {
  const doc = document.documentElement
  const vw = doc.clientWidth

  // --- 1. Gorizontal scroll ---
  // 1px dumaloqlash xatosiga yo'l qo'yiladi.
  const overflow = doc.scrollWidth - vw
  const culprits = []
  if (overflow > 1) {
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue
      if (r.right > vw + 1 || r.left < -1) {
        // Eng tashqi aybdorni topamiz: ota-onasi ham chiqib ketgan bo'lsa,
        // bolasini sanab o'tirmaymiz.
        const parent = el.parentElement
        if (parent) {
          const pr = parent.getBoundingClientRect()
          if (pr.right > vw + 1 || pr.left < -1) continue
        }
        culprits.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 110),
          left: Math.round(r.left),
          right: Math.round(r.right),
        })
        if (culprits.length >= 6) break
      }
    }
  }

  // --- 2. Bosish maydonlari (>=44x44) ---
  const SEL =
    'a[href], button, input, select, textarea, [role="button"], [role="menuitemradio"], summary'
  const small = []
  for (const el of document.querySelectorAll(SEL)) {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue

    // Checkbox/radio 16x16 bo'lishi normal: bosiladigan maydon uning
    // o'zi emas, uni o'rab turgan <label>. Shuning uchun o'lchov
    // label bo'yicha olinadi — aks holda to'g'ri qilingan forma ham
    // "kichik" deb belgilanadi.
    const label = el.tagName === 'INPUT' ? el.closest('label') : null
    const r = (label || el).getBoundingClientRect()

    if (r.width === 0 || r.height === 0) continue       // yashirin
    if (el.type === 'hidden') continue
    if (el.closest('[aria-hidden="true"]')) continue

    // WCAG 2.5.8 "inline exception": GAP ICHIGA joylashgan havola o'lcham
    // talabidan ozod — uni kattalashtirish matn qatorini buzadi.
    //
    // Qoida aniq: ota-element ichida havolaning o'zidan tashqari ham matn
    // bo'lsa, demak havola gapning bir qismi. Avval buni `display: inline`
    // bo'yicha chamalagandim, lekin flex ichidagi havolaning display'i
    // blokka aylanadi — footerdagi telefon havolasi shu sababli
    // "inline" deb hisoblanmay, noto'g'ri o'tib ketayotgan edi.
    let inlineLink = false
    if (el.tagName === 'A' && el.parentElement) {
      const own = (el.innerText || '').trim()
      const parentText = (el.parentElement.innerText || '').trim()
      inlineLink = parentText.length > own.length + 1
    }

    if (r.width < 43.5 || r.height < 43.5) {
      small.push({
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || el.value || el.getAttribute('aria-label') || '')
          .trim().slice(0, 34),
        w: Math.round(r.width),
        h: Math.round(r.height),
        inlineLink: Boolean(inlineLink),
      })
    }
  }

  // --- 3. Input shrifti (iOS fokusda zoom qilmasligi uchun >=16px) ---
  const smallInputs = []
  for (const el of document.querySelectorAll('input, select, textarea')) {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || el.type === 'hidden' || el.type === 'checkbox') continue
    const size = parseFloat(cs.fontSize)
    if (size < 16) {
      smallInputs.push({ tag: el.tagName.toLowerCase(), id: el.id || '', size })
    }
  }

  // --- 4. Juda mayda matn ---
  const tiny = []
  for (const el of document.querySelectorAll('p, span, li, dd, dt, h1, h2, h3, a, label')) {
    if (!el.innerText || !el.innerText.trim()) continue
    if (el.children.length > 0) continue              // faqat bargi
    const size = parseFloat(getComputedStyle(el).fontSize)
    if (size < 11) tiny.push({ text: el.innerText.trim().slice(0, 30), size })
  }

  // --- 5. Kesilgan matn (overflow hidden ichida sig'maganlar) ---
  const clipped = []
  for (const el of document.querySelectorAll('h1, h2, h3, p, span, button, a, dd, dt')) {
    const cs = getComputedStyle(el)
    if (!['hidden', 'clip'].includes(cs.overflowX)) continue
    if (cs.textOverflow === 'ellipsis') continue        // ataylab qisqartirilgan
    if (el.classList.contains('sr-only')) continue
    if (cs.webkitLineClamp && cs.webkitLineClamp !== 'none') continue
    if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
      clipped.push({
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || '').trim().slice(0, 34),
        scroll: el.scrollWidth,
        client: el.clientWidth,
      })
    }
  }

  return {
    scrollWidth: doc.scrollWidth,
    clientWidth: vw,
    overflow: Math.max(0, overflow),
    culprits,
    small,
    smallInputs,
    tiny,
    clipped,
  }
}

async function runAxe(page) {
  await page.evaluate(axeSource)
  return page.evaluate(async () => {
    const res = await window.axe.run(document, {
      resultTypes: ['violations'],
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    })
    return res.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      count: v.nodes.length,
      nodes: v.nodes.slice(0, 5).map((n) => ({
        target: n.target.join(' '),
        html: n.html.slice(0, 150).replace(/\s+/g, ' '),
        msg: (n.any?.[0]?.message || n.all?.[0]?.message || '').slice(0, 200).replace(/\s+/g, ' '),
      })),
    }))
  })
}

const findings = []
function note(kind, where, detail) {
  findings.push({ kind, where, detail })
}

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars'],
})

if (SHOTS) mkdirSync(SHOT_DIR, { recursive: true })

try {
  for (const width of WIDTHS) {
    const locales = width === 375 ? LOCALES : ['ru'] // eng uzun matn \u2014 ruscha
    console.log(`\n${'='.repeat(62)}\n  ${width}px  (${locales.join(', ')})\n${'='.repeat(62)}`)

    for (const [label, path] of PAGES) {
      for (const locale of locales) {
        const page = await browser.newPage()
        await page.setViewport({
          width,
          height: 780,
          deviceScaleFactor: 2,
          isMobile: width <= 414,
          hasTouch: width <= 414,
        })
        await page.setCookie({
          name: 'til', value: locale, domain: '127.0.0.1', path: '/',
        })

        const where = `${label} [${locale}] @${width}`
        try {
          await page.goto(BASE + path, { waitUntil: 'networkidle2', timeout: 30000 })
        } catch (e) {
          note('yuklanmadi', where, e.message.slice(0, 80))
          await page.close()
          continue
        }

        const m = await page.evaluate(MEASURE)

        if (m.overflow > 1) {
          note('gorizontal scroll', where,
            `${m.scrollWidth} > ${m.clientWidth} (+${m.overflow}px) ` +
            m.culprits.map((c) => `${c.tag}.${c.cls.split(' ')[0]}(${c.left}..${c.right})`).join(' '))
        }

        const realSmall = m.small.filter((s) => !s.inlineLink)
        if (realSmall.length) {
          note('44px dan kichik', where,
            realSmall.map((s) => `${s.tag}"${s.text}" ${s.w}x${s.h}`).join(' | '))
        }
        if (m.smallInputs.length) {
          note('input shrifti <16px', where,
            m.smallInputs.map((s) => `${s.tag}#${s.id} ${s.size}px`).join(' | '))
        }
        if (m.tiny.length) {
          note('matn <11px', where,
            m.tiny.slice(0, 4).map((t) => `"${t.text}" ${t.size}px`).join(' | '))
        }
        if (m.clipped.length) {
          note('matn kesilgan', where,
            m.clipped.map((c) => `${c.tag}"${c.text}" ${c.scroll}>${c.client}`).join(' | '))
        }

        // a11y faqat 375px/uz da \u2014 qoida buzilishi tildan qat'i nazar bir xil
        if (width === 375 && locale === 'uz') {
          const violations = await runAxe(page)
          for (const v of violations) {
            const detail = A11Y_VERBOSE
              ? `${v.id} (${v.count} ta)\n` +
                v.nodes
                  .map((n) => `        ${n.target}\n          ${n.html}\n          ${n.msg}`)
                  .join('\n')
              : `${v.id} \u2014 ${v.help} (${v.count} ta)`
            note(`a11y:${v.impact}`, where, detail)
          }
        }

        if (SHOTS && locale === 'uz') {
          const name = `${width}-${label.replace(/[^a-z0-9]+/gi, '-')}.png`
          await page.screenshot({ path: `${SHOT_DIR}/${name}`, fullPage: true })
        }

        const flags = [
          m.overflow > 1 ? 'SCROLL' : '',
          realSmall.length ? `${realSmall.length} kichik` : '',
          m.clipped.length ? 'KESILGAN' : '',
        ].filter(Boolean).join(' ')
        console.log(`  ${flags ? 'x' : 'ok'}  ${label.padEnd(18)} ${locale}  ${flags}`)

        await page.close()
      }
    }
  }
} finally {
  await browser.close()
}

console.log(`\n${'='.repeat(62)}`)
if (!findings.length) {
  console.log('Muammo topilmadi.')
} else {
  const byKind = {}
  for (const f of findings) (byKind[f.kind] ||= []).push(f)

  for (const [kind, list] of Object.entries(byKind)) {
    console.log(`\n### ${kind} \u2014 ${list.length} ta`)
    for (const f of list) console.log(`  ${f.where}\n      ${f.detail}`)
  }
  writeFileSync('audit-findings.json', JSON.stringify(findings, null, 2))
  console.log(`\n${findings.length} ta yozuv \u2014 audit-findings.json`)
}
