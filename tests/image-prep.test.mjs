import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  detectBackground,
  findContentBox,
  planOutput,
  prepRulesFor,
  scaleBox,
  upscaleWarning,
} from '@/lib/image-prep'
import { checkImageSize } from '@/lib/image-rules'

/** width×height RGBA rasm; paint(x, y) -> [r, g, b] yoki undefined (fon). */
function image(width, height, bg, paint = () => undefined) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = paint(x, y) ?? bg
      const i = (y * width + x) * 4
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = 255
    }
  }
  return data
}

const WHITE = [255, 255, 255]
const BOTTLE = [20, 24, 60]
// 200×200 oq fonda (60..139, 30..169) oralig'ida "flakon"
const bottle = (x, y) => (x >= 60 && x < 140 && y >= 30 && y < 170 ? BOTTLE : undefined)

test("fon: oq burchakli rasmda oq, JPEG shovqini ham oq deb olinadi", () => {
  assert.deepEqual(detectBackground(image(200, 200, WHITE, bottle), 200, 200), WHITE)
  // 248-255 — JPEG oq fonni shunday "shovqinli" saqlaydi
  const noisy = image(200, 200, WHITE, (x, y) => {
    const v = 248 + ((x * 7 + y * 13) % 8)
    return bottle(x, y) ?? [v, v, v]
  })
  const bg = detectBackground(noisy, 200, 200)
  assert.ok(bg && bg.every((c) => c >= 248), String(bg))
})

test("fon: burchaklar har xil (sahnadagi surat) -> null, kesilmaydi", () => {
  const scene = image(200, 200, WHITE, (x, y) => (x > 100 && y > 100 ? [90, 60, 30] : undefined))
  assert.equal(detectBackground(scene, 200, 200), null)
})

test('chegara: atirning aniq joyi topiladi', () => {
  assert.deepEqual(findContentBox(image(200, 200, WHITE, bottle), 200, 200, WHITE), {
    x: 60,
    y: 30,
    width: 80,
    height: 140,
  })
})

test("chegara: yolg'iz dog' chegarani cho'zmaydi", () => {
  const speck = image(200, 200, WHITE, (x, y) => bottle(x, y) ?? (x === 5 && y === 190 ? [0, 0, 0] : undefined))
  assert.deepEqual(findContentBox(speck, 200, 200, WHITE), { x: 60, y: 30, width: 80, height: 140 })
})

test("chegara: butunlay bir xil rasm -> null", () => {
  assert.equal(findContentBox(image(50, 50, WHITE), 50, 50, WHITE), null)
})

test("kichik nusxadagi chegara asl o'lchamga zaxira bilan o'tadi", () => {
  // 600px nusxa, asl 3000px (5 baravar)
  assert.deepEqual(scaleBox({ x: 100, y: 50, width: 200, height: 400 }, 5, 3000, 3000), {
    x: 495,
    y: 245,
    width: 1010,
    height: 2010,
  })
  // Chetga tegib turgan chegara rasm tashqarisiga chiqmaydi
  assert.deepEqual(scaleBox({ x: 0, y: 0, width: 600, height: 600 }, 5, 3000, 3000), {
    x: 0,
    y: 0,
    width: 3000,
    height: 3000,
  })
})

test('atir: kichik rasm 1000px kvadratga kattalashtiriladi, markazda', () => {
  const plan = planOutput({ box: { x: 10, y: 20, width: 300, height: 500 }, rules: prepRulesFor('atirlar') })
  assert.equal(plan.width, 1000)
  assert.equal(plan.height, 1000)
  // 8% chet: atir eng uzun tomoni bo'yicha 1000/1.16 ≈ 862px
  assert.equal(plan.target.height, 862)
  assert.equal(plan.target.width, 517)
  assert.equal(plan.target.x, Math.round((1000 - 517) / 2))
  assert.equal(plan.target.y, Math.round((1000 - 862) / 2))
  // Ogohlantirish atirning o'zi haqida, butun rasm haqida emas
  assert.match(upscaleWarning(plan), /atir kichik edi \(300×500px\)/)
})

test("atir: katta surat 2000px gacha kichraytiriladi, ogohlantirishsiz", () => {
  const plan = planOutput({ box: { x: 0, y: 0, width: 3000, height: 4000 }, rules: prepRulesFor('atirlar') })
  assert.equal(plan.width, 2000)
  assert.equal(plan.height, 2000)
  assert.ok(plan.scale < 1)
  assert.equal(upscaleWarning(plan), null)
})

test("atir: bir xil fonsiz surat kvadrat qilinmaydi, qisqa tomon 1000px", () => {
  const rules = { ...prepRulesFor('atirlar'), square: false }
  const plan = planOutput({ box: { x: 0, y: 0, width: 800, height: 600 }, rules })
  assert.deepEqual([plan.width, plan.height], [1333, 1000])
})

test("atir: juda cho'ziq fonsiz surat ham kvadrat — ulkan canvas bo'lmaydi", () => {
  const rules = { ...prepRulesFor('atirlar'), square: false }
  const plan = planOutput({ box: { x: 0, y: 0, width: 500, height: 4000 }, rules })
  assert.deepEqual([plan.width, plan.height], [2000, 2000])
  for (const [w, h] of [[1, 9000], [700, 1500], [3000, 1000]]) {
    const p = planOutput({ box: { x: 0, y: 0, width: w, height: h }, rules })
    assert.ok(p.width * p.height <= 2000 * 2000 * 1.5, `${w}x${h} -> ${p.width}x${p.height}`)
  }
})

test('logotip: kattalashtirilmaydi, kichigi shaffof chet bilan 200px ga', () => {
  const rules = prepRulesFor('brendlar')
  const small = planOutput({ box: { x: 0, y: 0, width: 150, height: 150 }, rules })
  assert.deepEqual([small.width, small.height, small.scale], [200, 200, 1])
  assert.deepEqual(small.target, { x: 25, y: 25, width: 150, height: 150 })

  // Cho'ziq yozuvli logotip: balandligi chet bilan to'ldiriladi
  const wide = planOutput({ box: { x: 0, y: 0, width: 600, height: 80 }, rules })
  assert.deepEqual([wide.width, wide.height], [600, 600])
  assert.deepEqual(wide.target, { x: 0, y: 260, width: 600, height: 80 })
})

test("har qanday rasm tayyorlangach server talabidan o'tadi", () => {
  // Server rad etsa, rasm formada "osilib" qolardi — bu hech qachon bo'lmasin
  const sizes = [1, 7, 50, 199, 200, 333, 640, 999, 1000, 1500, 4000, 9000]
  for (const folder of ['atirlar', 'brendlar']) {
    const rules = prepRulesFor(folder)
    for (const square of [true, false]) {
      for (const w of sizes) {
        for (const h of sizes) {
          const plan = planOutput({ box: { x: 0, y: 0, width: w, height: h }, rules: { ...rules, square: square || !rules.trim } })
          assert.equal(
            checkImageSize(plan.width, plan.height, rules.minSide),
            null,
            `${folder} square=${square} ${w}x${h} -> ${plan.width}x${plan.height}`
          )
        }
      }
    }
  }
})

test("qoidalar: eng kichik tomon image-rules.js dan (bitta manba)", () => {
  assert.equal(prepRulesFor('atirlar').minSide, 1000)
  assert.equal(prepRulesFor('brendlar').minSide, 200)
  assert.equal(prepRulesFor('atirlar').upscale, true)
  assert.equal(prepRulesFor('brendlar').upscale, false)
})
