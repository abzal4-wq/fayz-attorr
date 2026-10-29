import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  TASHKENT_CENTER,
  cleanCoordinates,
  formatOsmAddress,
  isInUzbekistan,
  mapLinks,
  reverseGeocodeUrl,
} from '@/lib/geo'
import { formatOrderMessage } from '@/lib/telegram'
import { makeOrderSchema } from '@/lib/validation/order'

const CHILONZOR = { lat: 41.2756, lon: 69.2034 }

describe('koordinata chegarasi', () => {
  test('Toshkent ichida', () => {
    assert.equal(isInUzbekistan(TASHKENT_CENTER.lat, TASHKENT_CENTER.lon), true)
    assert.equal(isInUzbekistan(CHILONZOR.lat, CHILONZOR.lon), true)
  })

  test("bema'ni qiymatlar rad etiladi", () => {
    // 0,0 — okean o'rtasi; Moskva; almashib ketgan lat/lon
    for (const [lat, lon] of [[0, 0], [55.75, 37.62], [69.28, 41.31], [NaN, 69], [41, Infinity]]) {
      assert.equal(isInUzbekistan(lat, lon), false, `${lat},${lon}`)
    }
  })
})

describe('cleanCoordinates', () => {
  test("to'g'ri juftlik saqlanadi", () => {
    assert.deepEqual(cleanCoordinates(CHILONZOR.lat, CHILONZOR.lon), {
      latitude: CHILONZOR.lat,
      longitude: CHILONZOR.lon,
    })
  })

  test('satr ko‘rinishidagi son ham qabul qilinadi', () => {
    assert.deepEqual(cleanCoordinates('41.2756', '69.2034'), { latitude: 41.2756, longitude: 69.2034 })
  })

  test('yarim juftlik yoki noto‘g‘ri qiymat — IKKALASI null', () => {
    // Buyurtma to'xtamaydi, lekin yarim nuqta ham saqlanmaydi
    for (const [lat, lon] of [[41.3, undefined], [undefined, 69.2], [0, 0], ['abc', 69], [null, null]]) {
      assert.deepEqual(cleanCoordinates(lat, lon), { latitude: null, longitude: null }, `${lat},${lon}`)
    }
  })
})

describe('kuryer uchun havolalar', () => {
  test('Yandex lon,lat tartibida, Google lat,lon tartibida', () => {
    /*
     * Ikki xizmat tartibni teskari kutadi. Aralashsa nuqta boshqa
     * qit'aga tushadi — kuryer hech qachon topa olmaydi.
     */
    const links = mapLinks(CHILONZOR.lat, CHILONZOR.lon)
    assert.match(links.yandex, /pt=69\.203400,41\.275600/)
    assert.match(links.google, /query=41\.275600,69\.203400/)
  })

  test('koordinata bo‘lmasa havola ham yo‘q', () => {
    assert.equal(mapLinks(null, null), null)
    assert.equal(mapLinks(0, 0), null)
  })
})

describe('manzil matni (OpenStreetMap)', () => {
  test('kuryerga kerakli qisqa ko‘rinish', () => {
    const text = formatOsmAddress({
      road: "Bunyodkor ko'chasi",
      house_number: '12',
      neighbourhood: 'Qatortol',
      city_district: 'Chilonzor tumani',
      city: 'Toshkent',
      postcode: '100115',
      country: "O'zbekiston",
    })
    assert.equal(text, "Bunyodkor ko'chasi 12, Qatortol, Chilonzor tumani, Toshkent")
    // Pochta indeksi va mamlakat kerak emas
    assert.ok(!text.includes('100115'))
    assert.ok(!text.includes("O'zbekiston"))
  })

  test('takrorlangan nom bir marta chiqadi', () => {
    const text = formatOsmAddress({ suburb: 'Chilonzor', city_district: 'chilonzor', city: 'Toshkent' })
    assert.equal(text, 'Chilonzor, Toshkent')
  })

  test("bo'sh yoki buzuq javob", () => {
    assert.equal(formatOsmAddress(null), '')
    assert.equal(formatOsmAddress({}), '')
  })

  test('so‘rov manzili tilni hisobga oladi', () => {
    assert.match(reverseGeocodeUrl(41.3, 69.2, 'ru'), /accept-language=ru/)
    assert.match(reverseGeocodeUrl(41.3, 69.2, 'uz'), /accept-language=uz%2Cru/)
  })
})

describe('buyurtma sxemasi: koordinata', () => {
  const t = (k) => k
  const base = {
    customerName: 'Aziz',
    customerPhone: '(90) 123-45-67',
    address: 'Toshkent sh., Chilonzor 5-kvartal',
    items: [{ variantId: 'v1', quantity: 1 }],
  }

  test('koordinatasiz buyurtma o‘tadi', () => {
    assert.ok(makeOrderSchema(t).safeParse(base).success)
  })

  test("noto'g'ri koordinata buyurtmani TO'XTATMAYDI", () => {
    // Matnli manzil asosiy — GPS xatosi tufayli savdo yo'qolmasin
    for (const bad of ['abc', null, {}, NaN]) {
      const parsed = makeOrderSchema(t).safeParse({ ...base, latitude: bad, longitude: bad })
      assert.ok(parsed.success, JSON.stringify(bad))
    }
  })
})

describe('Telegram xabari', () => {
  const order = {
    orderNumber: 42,
    customerName: 'Aziz',
    customerPhone: '+998901234567',
    address: 'Chilonzor 5-kv, 12-uy',
    comment: null,
    totalAmount: 450000,
    createdAt: new Date('2026-10-30T10:00:00Z'),
    items: [{ productName: 'Blue de Chanel', brandName: 'Chanel', sizeLabel: '100 ml', quantity: 1, unitPrice: 450000 }],
  }

  test('koordinata bo‘lsa xarita havolasi bor, "&" ekranlangan', () => {
    const text = formatOrderMessage({ ...order, latitude: CHILONZOR.lat, longitude: CHILONZOR.lon })
    assert.match(text, /Yandex xarita/)
    // Telegram HTML rejimida atribut ichidagi xom "&" butun xabarni rad ettiradi
    const hrefs = [...text.matchAll(/href="([^"]+)"/g)].map((m) => m[1])
    assert.ok(hrefs.length === 2)
    for (const href of hrefs) {
      assert.ok(!/&(?!amp;)/.test(href), `ekranlanmagan &: ${href}`)
    }
  })

  test('koordinata bo‘lmasa havola yo‘q', () => {
    assert.ok(!formatOrderMessage(order).includes('xarita'))
  })

  test('tasdiqlangandan keyingi xabarda ham havola SAQLANADI', () => {
    /*
     * Avval tahrirlangan xabar alohida funksiyada yasalardi — biriga
     * qo'shilgan narsa ikkinchisida bo'lmay qolardi.
     */
    const text = formatOrderMessage(
      { ...order, latitude: CHILONZOR.lat, longitude: CHILONZOR.lon },
      { title: 'BUYURTMA', statusLabel: 'Tasdiqlandi', actorName: 'Abzal' }
    )
    assert.match(text, /Yandex xarita/)
    assert.match(text, /Holat: Tasdiqlandi/)
  })
})
