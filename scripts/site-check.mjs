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

  // Qidiruv maydoniga YOZISH: URL yangilanadi va natija o'zgaradi
  await visit(page, '/katalog', 'katalog-qidiruv-yozish')
  const before = await page.$$eval('a[href^="/atir/"]', (els) => new Set(els.map((e) => e.getAttribute('href'))).size)
  await page.type('#catalog-search', 'blue', { delay: 40 })
  await page
    .waitForFunction(() => location.search.includes('q=blue'), { timeout: 8000 })
    .catch(() => {})

  /*
   * Natija yuklanayotgan PAYTDA yozishni davom ettiramiz. Avval maydon
   * Suspense ichida edi va shu payt skeleton bilan almashtirilardi:
   * fokus yo'qolib, keyingi harflar hech qayerga tushmasdi.
   */
  await page.keyboard.type(' de', { delay: 40 })
  const typing = await page.evaluate(() => ({
    value: document.querySelector('#catalog-search')?.value,
    focused: document.activeElement?.id === 'catalog-search',
  }))
  note(
    typing.value === 'blue de' && typing.focused,
    'qidiruv: yuklanish paytida yozish davom etadi',
    `qiymat "${typing.value}", fokus ${typing.focused ? 'joyida' : "YO'QOLDI"}`
  )

  await page
    .waitForFunction(() => location.search.includes('q=blue+de') || location.search.includes('q=blue%20de'), { timeout: 8000 })
    .catch(() => {})
  // Skeleton yo'qolib, haqiqiy natija chiqguncha kutamiz
  await page
    .waitForFunction(() => !document.querySelector('main .skeleton'), { timeout: 15000 })
    .catch(() => {})
  const after = await page.$$eval('a[href^="/atir/"]', (els) => new Set(els.map((e) => e.getAttribute('href'))).size)
  const urlOk = /q=blue(\+|%20)de/.test(page.url())
  note(urlOk && after <= before && after > 0, "qidiruv: yozilganda natija filtrlanadi", `URL ${urlOk ? 'yangilandi' : 'YANGILANMADI'}, ${before} -> ${after} ta`)

  // Server javobi kelgandan keyin ham maydon odam yozganicha qoladi
  const settled = await page.$eval('#catalog-search', (el) => el.value)
  note(settled === 'blue de', "qidiruv: server javobi maydonni orqaga qaytarmaydi", `"${settled}"`)

  // Tozalash tugmasi
  await page.evaluate(() => {
    document.querySelector('form[role="search"] button[type="button"]')?.click()
  })
  await page
    .waitForFunction(() => !location.search.includes('q='), { timeout: 8000 })
    .catch(() => {})
  note(!page.url().includes('q='), "qidiruv: tozalash tugmasi ishlaydi", page.url().replace(BASE, ''))

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

  // Savat: miqdorni oshirish va kamaytirish haqiqatan ishlaydimi
  const readQty = () =>
    page.evaluate(() => {
      const el = [...document.querySelectorAll('main *')].find(
        (node) => node.children.length === 0 && /^\d+$/.test(node.textContent.trim())
          && node.closest('li')
      )
      return el ? Number(el.textContent.trim()) : null
    })
  const clickByLabel = (pattern) =>
    page.evaluate((source) => {
      const re = new RegExp(source, 'i')
      const button = [...document.querySelectorAll('main button')].find((b) =>
        re.test(b.getAttribute('aria-label') ?? '')
      )
      if (!button || button.disabled) return false
      button.click()
      return true
    }, pattern.source)

  const qty0 = await readQty()
  const plus = await clickByLabel(/^(ko.paytirish|increase|увеличить)$/)
  await new Promise((r) => setTimeout(r, 400))
  const qty1 = await readQty()
  note(plus && qty1 === qty0 + 1, 'savat: miqdorni oshirish', `${qty0} -> ${qty1}`)

  const minus = await clickByLabel(/^(kamaytirish|decrease|уменьшить)$/)
  await new Promise((r) => setTimeout(r, 400))
  const qty2 = await readQty()
  note(minus && qty2 === qty0, 'savat: miqdorni kamaytirish', `${qty1} -> ${qty2}`)

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

/* --------------------------- interaktiv qismlar --------------------------- */

async function checkInteractions() {
  console.log('\n== Interaktiv qismlar')
  const page = await newPage()
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))

  /* --- Til almashtirish --- */
  await visit(page, '/', 'i-til-oldin')
  // Sarlavha "Fayz Attor" har tilda bir xil — shuning uchun <html lang>
  // va pastki menyu matni tekshiriladi
  const navText = () =>
    page.evaluate(() => document.querySelector('nav.fixed, nav[class*="bottom"]')?.innerText ?? document.body.innerText.slice(0, 400))
  const before = await navText()
  await page.click('button[aria-haspopup="menu"]')
  await page.waitForSelector('button[lang="ru"]', { timeout: 5000 })
  await page.click('button[lang="ru"]')
  await page
    .waitForFunction(() => document.documentElement.lang === 'ru', { timeout: 15000 })
    .catch(() => {})
  await page.waitForNetworkIdle({ idleTime: 400, timeout: 10000 }).catch(() => {})
  const lang = await page.evaluate(() => document.documentElement.lang)
  const after = await navText()
  const cyrillic = /[Ѐ-ӿ]/.test(after)
  note(lang === 'ru' && cyrillic, "til: rus tiliga o‘tadi", `lang="${lang}", matn: "${after.replace(/\s+/g, ' ').slice(0, 50)}"`)
  void before
  await page.screenshot({ path: `${SHOT_DIR}/i-til-ru.png`, fullPage: false })

  // Keyingi tekshiruvlar o'zbekcha matnga tayanadi — qaytaramiz
  await page.click('button[aria-haspopup="menu"]')
  await page.waitForSelector('button[lang="uz"]', { timeout: 5000 })
  await page.click('button[lang="uz"]')
  await page
    .waitForFunction(() => document.documentElement.lang === 'uz', { timeout: 15000 })
    .catch(() => {})

  /* --- Mobil filtr paneli --- */
  await visit(page, '/katalog', 'i-filtr-oldin')
  const opened = await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find(
      (b) => getComputedStyle(b).position === 'fixed' && /filtr/i.test(b.textContent)
    )
    button?.click()
    return Boolean(button)
  })
  await wait(400)
  const dialog = await page.$('[role="dialog"]')
  note(opened && Boolean(dialog), 'filtr: panel ochiladi')

  if (dialog) {
    await page.screenshot({ path: `${SHOT_DIR}/i-filtr-panel.png`, fullPage: false })

    // Jins tanlanganda tugmadagi son QORALAMAGA moslashishi kerak
    const labelOf = () =>
      page.evaluate(() =>
        [...document.querySelectorAll('[role="dialog"] button')]
          .find((b) => b.classList.contains('flex-1'))?.textContent.trim() ?? null
      )
    const labelBefore = await labelOf()
    await page.evaluate(() => {
      const men = [...document.querySelectorAll('[role="dialog"] button[aria-pressed]')]
        .find((b) => /erkak/i.test(b.textContent))
      men?.click()
    })
    await page
      .waitForFunction(
        (old) => [...document.querySelectorAll('[role="dialog"] button')]
          .find((b) => b.classList.contains('flex-1'))?.textContent.trim() !== old,
        { timeout: 8000 },
        labelBefore
      )
      .catch(() => {})
    await wait(800)
    const labelDraft = await labelOf()
    const draftCount = Number(labelDraft?.match(/\d+/)?.[0] ?? NaN)
    const realMen = await page.evaluate(async () => {
      const res = await fetch('/api/katalog?gender=MEN')
      return (await res.json()).total
    })
    note(draftCount === realMen, "filtr: tugmadagi son qoralama tanlovga mos", `"${labelBefore}" -> "${labelDraft}", haqiqatda erkaklar uchun ${realMen} ta`)

    // Jinsni qaytarib olib tashlaymiz
    await page.evaluate(() => {
      const men = [...document.querySelectorAll('[role="dialog"] button[aria-pressed="true"]')]
        .find((b) => /erkak/i.test(b.textContent))
      men?.click()
    })
    await wait(600)

    // Birinchi brendni tanlab, qo'llaymiz
    const brand = await page.evaluate(() => {
      const box = document.querySelector('[role="dialog"] input[type="checkbox"]')
      box?.click()
      return box ? box.closest('label')?.textContent.trim() : null
    })
    await wait(200)
    const applyLabel = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('[role="dialog"] button')]
      const apply = buttons.find((b) => b.classList.contains('flex-1'))
      apply?.click()
      return apply?.textContent.trim() ?? null
    })
    await page.waitForFunction(() => location.search.includes('brend='), { timeout: 10000 }).catch(() => {})
    await page.waitForFunction(() => !document.querySelector('main .skeleton'), { timeout: 15000 }).catch(() => {})

    const applied = page.url().includes('brend=')
    const closed = !(await page.$('[role="dialog"]'))
    note(applied && closed, "filtr: tanlov qo'llanadi va panel yopiladi", `brend "${brand}", tugma "${applyLabel}", URL ${page.url().replace(BASE, '')}`)

    // Tugmadagi son haqiqiy natijaga mos kelishi kerak
    const promised = Number((applyLabel ?? '').match(/\d+/)?.[0] ?? NaN)
    const shown = await page.$$eval('a[href^="/atir/"]', (els) => new Set(els.map((e) => e.getAttribute('href'))).size)
    if (!Number.isNaN(promised)) {
      note(promised === shown, "filtr: tugmadagi son natijaga mos", `tugma ${promised} ta dedi, ko'rsatildi ${shown} ta`)
    }
  }

  /* --- Filtrni tozalash qidiruvni o'chirmasligi kerak --- */
  await visit(page, '/katalog?q=chanel&gender=WOMEN', 'i-filtr-qidiruv')
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find(
      (b) => getComputedStyle(b).position === 'fixed' && /filtr/i.test(b.textContent)
    )
    button?.click()
  })
  await wait(400)
  await page.evaluate(() => {
    const clear = [...document.querySelectorAll('[role="dialog"] button')].find((b) =>
      /tozalash/i.test(b.textContent)
    )
    clear?.click()
  })
  await page.waitForFunction(() => !location.search.includes('gender='), { timeout: 10000 }).catch(() => {})
  const keptQuery = page.url().includes('q=chanel')
  const droppedGender = !page.url().includes('gender=')
  note(keptQuery && droppedGender, "filtr: tozalash qidiruvni saqlaydi", page.url().replace(BASE, ''))

  /* --- Mahsulot sahifalari: HAR BIR atir, hajm tanlash va galereya --- */
  await page.goto(BASE + '/katalog', { waitUntil: 'networkidle2' })
  const productPaths = await page.evaluate(() => [
    ...new Set([...document.querySelectorAll('a[href^="/atir/"]')].map((a) => a.getAttribute('href'))),
  ])

  let galleryTested = false
  for (const [index, path] of productPaths.entries()) {
    await visit(page, path, `i-atir-${index + 1}`)

    const variants = await page.$$('button[aria-pressed]')
    if (variants.length > 1) {
      const prices = []
      for (const button of variants) {
        await button.click()
        await wait(200)
        prices.push(await page.evaluate(() => document.querySelector('main')?.innerText.match(/[\d\s]+so.m/)?.[0]?.trim()))
      }
      note(new Set(prices).size > 1, `${path}: hajm tanlanganda narx o‘zgaradi`, prices.join(' | '))
    }

    // Rasmi bor atirda galereya: kattalashtirish ochiladi, Escape yopadi
    const zoom = await page.evaluateHandle(() =>
      [...document.querySelectorAll('main button')].find(
        (b) => b.offsetParent !== null && b.querySelector('img') && /kattalashtir|zoom|увелич/i.test(b.getAttribute('aria-label') ?? '')
      ) ?? null
    )
    if (zoom && (await zoom.evaluate((el) => el !== null))) {
      await zoom.click()
      await wait(400)
      const opened = await page.evaluate(() => Boolean(document.querySelector('[role="dialog"] img')))
      await page.screenshot({ path: `${SHOT_DIR}/i-galereya-${index + 1}.png`, fullPage: false })
      await page.keyboard.press('Escape')
      await wait(400)
      const closed = !(await page.$('[role="dialog"]'))
      const scrollUnlocked = await page.evaluate(() => document.body.style.overflow !== 'hidden')
      note(opened && closed && scrollUnlocked, `${path}: rasm kattalashadi, Escape yopadi, scroll qaytadi`)
      galleryTested = true
    }
  }
  if (!galleryTested) console.log("  --    rasmli atir topilmadi, galereya sinalmadi")

  const problems = page.problems.filter(Boolean)
  note(problems.length === 0, 'interaktiv qismlar: konsol toza', problems.join(' | '))
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

  // Kenglik muhit orqali: do'kon egasi panelni ko'pincha telefondan
  // ochadi, shuning uchun 375 da ham alohida yuritiladi
  const page = await newPage({ width: Number(process.env.ADMIN_WIDTH) || 1280 })

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
    // GET qo'llaydigan admin endpoint kerak — /api/admin/atirlar faqat
    // POST qabul qiladi va 405 qaytarib, tekshiruvni chalg'itardi
    const after = await page.evaluate(async () => (await fetch('/api/admin/brendlar')).status)
    note(after === 404, 'admin: chiqishdan keyin eski token rad etiladi', `status ${after}`)
  }

  await page.close()
}

/* ------------------------------- ishga tushirish ------------------------------- */

try {
  if (MODE === 'public' || MODE === 'all') {
    await checkPublic()
    await checkInteractions()
    await checkLoginForm()
  }
  if (MODE === 'ui') await checkInteractions()
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
