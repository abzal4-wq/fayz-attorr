/**
 * Saytni haqiqiy brauzerda, haqiqiy foydalanuvchi kabi aylanib chiqadi.
 *
 *   npm run check                  # ochiq sahifalar
 *   npm run check -- user          # ro'yxat -> profil -> parol -> chiqish -> o'chirish
 *   npm run check -- admin         # admin panelning hamma sahifasi
 *   npm run check -- all           # hammasi
 *   AUDIT_BASE=https://... npm run check   # jonli saytda
 *
 * Har sahifada yig'iladi:
 *  - JS xatolari (pageerror) va konsoldagi `error`
 *  - 400+ javob bergan so'rovlar (kutilganlaridan tashqari)
 *  - ekran rasmi: site-check/<nom>.png
 *
 * NEGA: birlik testlari kodni tekshiradi, lekin "sahifa ochiladimi,
 * tugma bosilganda nima bo'ladi" degan savolga javob bermaydi. Login
 * sahifasidagi xato aynan shunday — faqat brauzerda ko'rinadi.
 *
 * `user` bosqichi SINOV hisobini yaratadi va oxirida O'CHIRADI.
 * Buyurtma YUBORILMAYDI: u jonli bazaga yozadi va do'kon egasiga
 * Telegram xabari ketadi.
 */
import { existsSync, mkdirSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const BASE = (process.env.AUDIT_BASE || 'http://127.0.0.1:3939').replace(/\/$/, '')
const MODE = process.argv[2] || 'public'
const SHOT_DIR = 'site-check'

const ADMIN_USER = process.env.ADMIN_USERNAME
const ADMIN_PASS = process.env.ADMIN_PASSWORD

const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => p && existsSync(p))

if (!existsSync(SHOT_DIR)) mkdirSync(SHOT_DIR)

let failures = 0
const report = []

function note(ok, label, detail = '') {
  const line = `  ${ok ? 'ok  ' : 'XATO'}  ${label}${detail ? '  \u2014 ' + detail : ''}`
  console.log(line)
  if (!ok) {
    failures += 1
    report.push(line)
  }
}

/* ----------------------------- brauzer ----------------------------- */

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--hide-scrollbars'],
})

async function newPage({ width = 375 } = {}) {
  const page = await browser.newPage()
  await page.setViewport({
    width,
    height: 800,
    deviceScaleFactor: 2,
    isMobile: width < 768,
  })

  page.problems = []

  page.on('pageerror', (error) => {
    page.problems.push(`JS: ${error.message.split('\n')[0].slice(0, 200)}`)
  })

  page.on('console', (message) => {
    if (message.type() !== 'error') return
    const text = message.text()
    // Brauzer o'zi chiqaradigan "resurs yuklanmadi" xabari — u
    // pastdagi `response` tinglovchisida aniqroq ko'rinadi
    if (text.startsWith('Failed to load resource')) return
    page.problems.push(`konsol: ${text.slice(0, 200)}`)
  })

  page.on('response', (response) => {
    const status = response.status()
    if (status < 400) return

    const url = response.url()
    // Kutilgan javoblar: noto'g'ri parolga 401, mavjud bo'lmagan
    // sahifaga 404 va h.k. Ular sahifa o'zi ataylab tekshiradi.
    if (page.expected?.some((pattern) => url.includes(pattern))) return

    page.problems.push(`HTTP ${status}: ${url.replace(BASE, '').slice(0, 140)}`)
  })

  return page
}

/** Sahifani ochadi, kutadi va muammolarni xabar qiladi. */
async function visit(page, path, name, { expectStatus = 200 } = {}) {
  page.problems = []
  let status = 0

  try {
    const response = await page.goto(BASE + path, {
      waitUntil: 'networkidle2',
      timeout: 45000,
    })
    status = response?.status() ?? 0
  } catch (error) {
    note(false, `${name} (${path})`, `ochilmadi: ${error.message.slice(0, 120)}`)
    return false
  }

  await settle(page)
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: true })

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  )

  // Next'ning xato ekrani: global-error yoki error boundary
  const crashed = await page.evaluate(() => {
    const text = document.body?.innerText ?? ''
    return /Application error|Internal Server Error|Xatolik yuz berdi|Something went wrong/i.test(
      text
    )
  })

  const okStatus = status === expectStatus
  const problems = [...page.problems]

  if (!okStatus) problems.unshift(`status ${status}, kutilgan ${expectStatus}`)
  if (crashed) problems.unshift("xato ekrani ko'rindi")
  if (overflow > 1) problems.push(`gorizontal scroll: ${overflow}px`)

  note(problems.length === 0, `${name} (${path})`, problems.join(' | '))
  return problems.length === 0
}

/** Rasm va shriftlar joyiga tushishini kutadi. */
async function settle(page) {
  await page
    .evaluate(async () => {
      await document.fonts?.ready
      const images = [...document.images].filter((img) => !img.complete)
      await Promise.race([
        Promise.all(
          images.map(
            (img) =>
              new Promise((resolve) => {
                img.onload = img.onerror = resolve
              })
          )
        ),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ])
    })
    .catch(() => {})
}

async function typeInto(page, selector, value) {
  await page.waitForSelector(selector, { timeout: 15000 })
  await page.click(selector, { clickCount: 3 })
  await page.keyboard.press('Backspace')
  await page.type(selector, value, { delay: 15 })
}

/** Formani yuboradi va javobni kutadi. */
async function submitAndWait(page, apiPath, { button = 'button[type="submit"]' } = {}) {
  const responsePromise = page.waitForResponse(
    (r) => r.url().includes(apiPath) && r.request().method() === 'POST',
    { timeout: 30000 }
  )
  await page.click(button)
  const response = await responsePromise
  const body = await response.json().catch(() => null)
  return { status: response.status(), body }
}

/* --------------------------- ochiq sahifalar --------------------------- */

async function checkPublic() {
  console.log(`\n== Ochiq sahifalar (${BASE})`)
  const page = await newPage()

  await visit(page, '/', 'bosh-sahifa')
  await visit(page, '/katalog', 'katalog')
  await visit(page, '/katalog?q=chanel', 'katalog-qidiruv')
  await visit(page, '/katalog?gender=WOMEN', 'katalog-ayollar')
  await visit(page, '/katalog?q=%25', 'katalog-joker')

  // Birinchi atirning sahifasi — slug'ni katalogdan olamiz
  await page.goto(BASE + '/katalog', { waitUntil: 'networkidle2' })
  const productPath = await page.evaluate(
    () => document.querySelector('a[href^="/atir/"]')?.getAttribute('href') ?? null
  )

  if (productPath) {
    await visit(page, productPath, 'atir')

    // Savatga qo'shish
    const added = await page.evaluate(() => {
      const button = [...document.querySelectorAll('button')].find((b) =>
        /savatga/i.test(b.textContent ?? '')
      )
      if (!button || button.disabled) return false
      button.click()
      return true
    })
    note(added, 'atir: "Savatga" tugmasi bosiladi')
    await new Promise((r) => setTimeout(r, 800))
  } else {
    note(false, 'katalogda atir havolasi topilmadi')
  }

  await visit(page, '/savat', 'savat')
  await visit(page, '/buyurtma', 'buyurtma-mehmon')

  const guestNotice = await page.evaluate(() =>
    /mehmon sifatida/i.test(document.body.innerText)
  )
  note(guestNotice, "buyurtma: mehmon xabari ko'rinadi")

  await visit(page, '/kirish', 'kirish')
  await visit(page, '/royxatdan-otish', 'royxatdan-otish')
  await visit(page, '/parolni-tiklash', 'parolni-tiklash')

  page.expected = ['/bunday-sahifa-yoq']
  await visit(page, '/bunday-sahifa-yoq', '404', { expectStatus: 404 })
  page.expected = []

  await page.close()
}

/* -------------------------- login formasi -------------------------- */

async function checkLoginForm() {
  console.log('\n== Kirish formasi')
  const page = await newPage()
  page.expected = ['/api/auth/login']

  await visit(page, '/kirish', 'kirish-forma')

  // 1. Bo'sh forma — mijoz tomonida to'xtashi kerak
  await page.click('button[type="submit"]')
  await new Promise((r) => setTimeout(r, 500))
  const emptyErrors = await page.$$eval('[role="alert"]', (els) =>
    els.map((el) => el.textContent.trim()).filter(Boolean)
  )
  note(emptyErrors.length > 0, "bo'sh forma: xato ko'rsatiladi", emptyErrors.join(' / '))

  // 2. Noto'g'ri parol
  await typeInto(page, '#phone', '901112233')
  await typeInto(page, '#password', 'notogriparol1')
  const { status, body } = await submitAndWait(page, '/api/auth/login')
  await new Promise((r) => setTimeout(r, 500))

  note(status === 401, "noto'g'ri parol: 401", `status ${status}, ${JSON.stringify(body)?.slice(0, 120)}`)

  const shown = await page.$$eval('[role="alert"]', (els) =>
    els.map((el) => el.textContent.trim()).filter(Boolean)
  )
  note(shown.length > 0, "noto'g'ri parol: xabar ko'rsatiladi", shown.join(' / '))

  // Ichki xato matni foydalanuvchiga ko'rinmasligi kerak
  const leaked = shown.some((text) =>
    /prisma|column|does not exist|stack|TypeError|undefined/i.test(text)
  )
  note(!leaked, "xato matnida ichki ma'lumot yo'q", shown.join(' / '))

  await page.screenshot({ path: `${SHOT_DIR}/kirish-xato.png`, fullPage: true })

  const problems = page.problems.filter(Boolean)
  note(problems.length === 0, 'kirish formasi: konsol toza', problems.join(' | '))

  await page.close()
}

/* ------------------------- foydalanuvchi yo'li ------------------------- */

async function checkUserJourney() {
  console.log("\n== Foydalanuvchi yo'li (sinov hisobi yaratiladi va o'chiriladi)")
  const page = await newPage()

  // Har yugurishda yangi raqam — avvalgi yugurish yarim yo'lda
  // to'xtagan bo'lsa ham to'qnashuv bo'lmasin
  const suffix = String(Date.now()).slice(-7)
  const phone = `99${suffix}`
  const password1 = 'SinovParol1'
  const password2 = 'SinovParol2'

  // 1. Ro'yxatdan o'tish
  await visit(page, '/royxatdan-otish', 'u1-royxat')
  await typeInto(page, '#fullName', 'Sinov Foydalanuvchi')
  await typeInto(page, '#phone', phone)
  await typeInto(page, '#password', password1)
  const reg = await submitAndWait(page, '/api/auth/register')
  note(reg.status === 201 || reg.status === 200, "ro'yxatdan o'tish", `status ${reg.status} ${JSON.stringify(reg.body)?.slice(0, 160)}`)
  if (reg.status >= 400) {
    await page.screenshot({ path: `${SHOT_DIR}/u1-royxat-xato.png`, fullPage: true })
    await page.close()
    return
  }
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})

  // 2. Profil
  await visit(page, '/profil', 'u2-profil')

  // 3. Parolni o'zgartirish
  await page.evaluate(() => {
    const summary = [...document.querySelectorAll('summary')].find((s) =>
      /parolni o.zgartirish/i.test(s.textContent ?? '')
    )
    summary?.click()
  })
  await typeInto(page, '#currentPassword', password1)
  await typeInto(page, '#newPassword', password2)
  const change = await submitAndWait(page, '/api/auth/parolni-ozgartirish', {
    button: 'form:has(#newPassword) button[type="submit"]',
  })
  note(change.status === 200, "parolni o'zgartirish", `status ${change.status} ${JSON.stringify(change.body)?.slice(0, 160)}`)
  await new Promise((r) => setTimeout(r, 800))

  // Parol almashgandan keyin ham shu qurilmada kirgan holda qolish kerak
  await visit(page, '/profil', 'u3-profil-parol-keyin')
  const stillIn = page.url().includes('/profil')
  note(stillIn, "parol almashgach joriy sessiya saqlanadi", page.url())

  // 4. Chiqish
  const cookieBefore = (await page.cookies()).find((c) => c.name === 'fa_session')
  const logout = await page.evaluate(async () => {
    const res = await fetch('/api/auth/logout', { method: 'POST' })
    return res.status
  })
  note(logout === 200, 'chiqish', `status ${logout}`)

  // Eski token chiqishdan keyin ishlamasligi kerak (AUDIT-002)
  if (cookieBefore) {
    await page.setCookie(cookieBefore)
    const me = await page.evaluate(async () => (await fetch('/api/auth/me')).status)
    note(me === 401, 'chiqishdan keyin eski token rad etiladi', `status ${me}`)
    await page.deleteCookie({ name: 'fa_session' })
  }

  // 5. Yangi parol bilan kirish
  await visit(page, '/kirish', 'u4-kirish')
  await typeInto(page, '#phone', phone)
  await typeInto(page, '#password', password2)
  const login = await submitAndWait(page, '/api/auth/login')
  note(login.status === 200, 'yangi parol bilan kirish', `status ${login.status} ${JSON.stringify(login.body)?.slice(0, 160)}`)
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})

  // 6. Mehmon emas — buyurtma formasida ism va telefon to'ldirilgan
  await visit(page, '/buyurtma', 'u5-buyurtma-kirgan')

  // 7. Hisobni o'chirish (tozalash)
  await visit(page, '/profil', 'u6-profil-ochirish')
  await page.evaluate(() => {
    const summary = [...document.querySelectorAll('summary')].find((s) =>
      /hisobni o.chirish/i.test(s.textContent ?? '')
    )
    summary?.click()
  })
  await typeInto(page, '#delete-password', password2)
  await page.click('#delete-confirm')
  const del = await submitAndWait(page, '/api/auth/hisobni-ochirish', {
    button: 'form:has(#delete-password) button[type="submit"]',
  })
  note(del.status === 200, "hisobni o'chirish (sinov hisobi tozalandi)", `status ${del.status} ${JSON.stringify(del.body)?.slice(0, 160)}`)

  const problems = page.problems.filter(Boolean)
  note(problems.length === 0, "foydalanuvchi yo'li: konsol toza", problems.join(' | '))

  await page.close()
}

/* ----------------------------- admin panel ----------------------------- */

async function checkAdmin() {
  console.log('\n== Admin panel')

  if (!ADMIN_USER || !ADMIN_PASS) {
    note(false, 'ADMIN_USERNAME / ADMIN_PASSWORD berilmagan')
    return
  }

  const page = await newPage({ width: 1280 })

  // Kirmagan holda admin sahifasi 404 bo'lishi kerak (401 emas)
  page.expected = ['/admin']
  await visit(page, '/admin', 'a0-kirmasdan', { expectStatus: 404 })
  page.expected = []

  await visit(page, '/admin/kirish', 'a1-kirish')
  await typeInto(page, '#username', ADMIN_USER)
  await typeInto(page, '#password', ADMIN_PASS)
  const login = await submitAndWait(page, '/api/admin/auth/login')
  note(login.status === 200, 'admin kirishi', `status ${login.status} ${JSON.stringify(login.body)?.slice(0, 160)}`)
  if (login.status !== 200) {
    await page.screenshot({ path: `${SHOT_DIR}/a1-kirish-xato.png`, fullPage: true })
    await page.close()
    return
  }
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})

  // Paneldagi barcha havolalarni o'zi topadi — yangi sahifa qo'shilsa
  // ham tekshiruvdan chetda qolmaydi
  const links = await page.evaluate(() =>
    [...new Set(
      [...document.querySelectorAll('a[href^="/admin"]')]
        .map((a) => a.getAttribute('href'))
        .filter((href) => href && !href.includes('kirish'))
    )]
  )

  for (const [index, href] of links.entries()) {
    const name = `a${index + 2}-${href.replace(/^\/admin\/?/, '').replace(/[^a-z0-9]+/gi, '-') || 'bosh'}`
    await visit(page, href, name)
  }

  // Tahrirlash formalari: ro'yxatdagi birinchi elementni ochadi
  for (const list of ['/admin/atirlar', '/admin/buyurtmalar']) {
    await page.goto(BASE + list, { waitUntil: 'networkidle2' })
    const first = await page.evaluate((prefix) => {
      const link = [...document.querySelectorAll(`a[href^="${prefix}/"]`)].find(
        (a) => !/yangi|eksport/.test(a.getAttribute('href'))
      )
      return link?.getAttribute('href') ?? null
    }, list)
    if (first) {
      await visit(page, first, `a-tahrir-${list.split('/').pop()}`)
    } else {
      console.log(`  --    ${list}: ochiladigan element yo'q`)
    }
  }

  // Yangi atir formasi
  await visit(page, '/admin/atirlar/yangi', 'a-yangi-atir')

  // Admin chiqishi va eski token
  const cookieBefore = (await page.cookies()).find((c) => c.name === 'fa_admin')
  const logout = await page.evaluate(async () => {
    const res = await fetch('/api/admin/auth/logout', { method: 'POST' })
    return res.status
  })
  note(logout === 200, 'admin chiqishi', `status ${logout}`)

  if (cookieBefore) {
    await page.setCookie(cookieBefore)
    page.expected = ['/api/admin']
    const after = await page.evaluate(async () => (await fetch('/api/admin/atirlar')).status)
    note(after === 404, 'admin: chiqishdan keyin eski token rad etiladi', `status ${after}`)
  }

  await page.close()
}

/* ------------------------------- ishga tushirish ------------------------------- */

try {
  if (MODE === 'public' || MODE === 'all') {
    await checkPublic()
    await checkLoginForm()
  }
  if (MODE === 'login') await checkLoginForm()
  if (MODE === 'user' || MODE === 'all') await checkUserJourney()
  if (MODE === 'admin' || MODE === 'all') await checkAdmin()
} finally {
  await browser.close()
}

console.log(
  failures === 0
    ? '\nHammasi toza.'
    : `\n${failures} ta muammo:\n${report.join('\n')}`
)
console.log(`Ekran rasmlari: ${SHOT_DIR}/`)
process.exit(failures === 0 ? 0 : 1)
