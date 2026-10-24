/**
 * Telegram Mini App rejimini SOXTA Telegram obyekti bilan sinaydi.
 *
 *   npm run miniapp
 *
 * Nega kerak: haqiqiy Mini App'ni ochish uchun bot, HTTPS domen va
 * telefon kerak. Lekin bizning kodimiz Telegram SDK bilan qanday
 * gaplashishini shu yerda tekshirib olsa bo'ladi \u2014 `ready`/`expand`
 * chaqirildimi, ranglar brendnikimi, BackButton to'g'ri sahifalarda
 * ko'rinadimi, viewport balandligi CSS'ga yozildimi.
 */
import { existsSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const BASE = process.env.AUDIT_BASE || 'http://127.0.0.1:3939'

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p))

/**
 * Telegram SDK o'rniga qo'yiladigan soxta obyekt. Haqiqiy script
 * yuklanmaydi (`window.Telegram` allaqachon mavjud bo'lsa, provider
 * uni shundayligicha oladi) \u2014 shuning uchun internet ham kerak emas.
 */
const FAKE_TELEGRAM = () => {
  const calls = []
  const handlers = {}

  const button = (name) => ({
    _shown: false,
    _text: '',
    _params: null,
    _progress: false,
    _enabled: true,
    setText(t) { this._text = t; calls.push(`${name}.setText:${t}`) },
    setParams(p) { this._params = p; calls.push(`${name}.setParams:${JSON.stringify(p)}`) },
    show() { this._shown = true; calls.push(`${name}.show`) },
    hide() { this._shown = false; calls.push(`${name}.hide`) },
    enable() { this._enabled = true },
    disable() { this._enabled = false; calls.push(`${name}.disable`) },
    showProgress() { this._progress = true; calls.push(`${name}.showProgress`) },
    hideProgress() { this._progress = false },
    onClick(fn) { this._fn = fn; calls.push(`${name}.onClick`) },
    offClick() { this._fn = null },
  })

  window.__tgCalls = calls
  window.Telegram = {
    WebApp: {
      initData: 'query_id=TEST',
      version: '7.0',
      platform: 'android',
      viewportStableHeight: 620,
      MainButton: button('MainButton'),
      BackButton: button('BackButton'),
      ready() { calls.push('ready') },
      expand() { calls.push('expand') },
      setHeaderColor(c) { calls.push(`setHeaderColor:${c}`) },
      setBackgroundColor(c) { calls.push(`setBackgroundColor:${c}`) },
      onEvent(name, fn) { handlers[name] = fn; calls.push(`onEvent:${name}`) },
      offEvent() {},
    },
  }
  window.__tgButtons = () => ({
    main: {
      shown: window.Telegram.WebApp.MainButton._shown,
      text: window.Telegram.WebApp.MainButton._text,
      params: window.Telegram.WebApp.MainButton._params,
    },
    back: { shown: window.Telegram.WebApp.BackButton._shown },
  })
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--hide-scrollbars'],
})

let failures = 0
function check(label, ok, extra = '') {
  console.log(`  ${ok ? 'ok ' : 'XATO'}  ${label}${extra ? '  \u2014 ' + extra : ''}`)
  if (!ok) failures++
}

async function open(path, { miniApp = true } = {}) {
  const page = await browser.newPage()
  await page.setViewport({ width: 375, height: 780, deviceScaleFactor: 2, isMobile: true })
  if (miniApp) await page.evaluateOnNewDocument(FAKE_TELEGRAM)
  await page.goto(BASE + path, { waitUntil: 'networkidle2' })
  return page
}

try {
  console.log('\n--- Mini App rejimi (bosh sahifa) ---')
  let page = await open('/')
  let calls = await page.evaluate(() => window.__tgCalls || [])
  let buttons = await page.evaluate(() => window.__tgButtons())

  check('ready() chaqirildi', calls.includes('ready'))
  check('expand() chaqirildi', calls.includes('expand'))
  check('header brend rangida', calls.includes('setHeaderColor:#0D454E'))
  check('fon brend rangida', calls.includes('setBackgroundColor:#F5F2EA'))
  check('viewportChanged kuzatilmoqda', calls.includes('onEvent:viewportChanged'))

  const htmlFlag = await page.evaluate(() => document.documentElement.dataset.telegram)
  check('html[data-telegram] belgilandi', htmlFlag === 'true', String(htmlFlag))

  const vp = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--tg-viewport').trim()
  )
  check('--tg-viewport yozildi', vp === '620px', vp || '(bo\'sh)')

  // DIQQAT: bu yerda element BALANDLIGI emas, hisoblangan `min-height`
  // o'lchanadi. Balandlik kontentga qarab o'sadi (sahifa 3000px bo'lishi
  // mumkin), min-height esa pol — aynan shuni tekshirmoqchimiz.
  const usesVp = await page.evaluate(() => {
    const el = document.querySelector('.min-h-app')
    return el ? getComputedStyle(el).minHeight : null
  })
  check('min-h-app Telegram balandligini oldi', usesVp === '620px', String(usesVp))

  check('bosh sahifada BackButton yashirin', buttons.back.shown === false)
  await page.close()

  console.log('\n--- Mini App rejimi (ichki sahifa) ---')
  page = await open('/katalog')
  buttons = await page.evaluate(() => window.__tgButtons())
  check('ichki sahifada BackButton ko\'rinadi', buttons.back.shown === true)
  await page.close()

  console.log('\n--- Oddiy brauzer (Telegram yo\'q) ---')
  page = await open('/', { miniApp: false })
  const scriptLoaded = await page.evaluate(
    () => Boolean(document.querySelector('script[src*="telegram-web-app"]'))
  )
  check('Telegram scripti YUKLANMADI', scriptLoaded === false)
  const flag = await page.evaluate(() => document.documentElement.dataset.telegram)
  check('data-telegram qo\'yilmadi', flag === undefined, String(flag))
  const h = await page.evaluate(() => {
    const el = document.querySelector('.min-h-app')
    return el ? getComputedStyle(el).minHeight : null
  })
  check('min-h-app oddiy brauzerda viewport balandligi', h === '780px', String(h))
  await page.close()
} finally {
  await browser.close()
}

console.log()
if (failures) {
  console.log(`${failures} ta tekshiruv muvaffaqiyatsiz.`)
  process.exit(1)
}
console.log('Mini App integratsiyasi tekshiruvdan o\'tdi.')
