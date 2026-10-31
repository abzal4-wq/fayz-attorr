import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  WHEEL_MAX,
  nearestSlot,
  pickWheelProducts,
  wheelDistance,
  wheelPlacement,
  wheelSlots,
} from '../lib/wheel.js'

test("masofa eng qisqa yo'l bo'yicha: 7 tadan 6 -> 0 bu -1, +6 emas", () => {
  assert.equal(wheelDistance(6, 0, 7), -1)
  assert.equal(wheelDistance(0, 6, 7), 1)
  assert.equal(wheelDistance(5, 0, 7), -2)
  assert.equal(wheelDistance(3, 0, 7), 3)
  assert.equal(wheelDistance(4, 0, 7), -3)
})

test("masofa: juft sonda teng masofa o'ngda, bitta atirda 0", () => {
  assert.equal(wheelDistance(4, 0, 8), 4)
  assert.equal(wheelDistance(0, 4, 8), 4)
  assert.equal(wheelDistance(0, 0, 1), 0)
  assert.equal(wheelDistance(0, 0, 0), 0)
})

test("halqa: ko'rinib turgan flakon hech qachon chetdan chetga uchmaydi", () => {
  // Har qadamda ko'rinadigan (|d| <= 2) flakon aynan 1 o'rin siljiydi.
  // Halqa 7 dan kichik bo'lsa, 5 ta atirda -2 dagi flakon +2 ga uchardi.
  for (const count of [2, 3, 4, 5, 6, 7]) {
    const slots = wheelSlots(count)
    assert.ok(slots >= 7 && slots % count === 0, `count=${count} slots=${slots}`)
    for (let active = 0; active < slots; active++) {
      const next = (active + 1) % slots
      for (let i = 0; i < slots; i++) {
        const before = wheelDistance(i, active, slots)
        const after = wheelDistance(i, next, slots)
        if (Math.abs(before) <= 2 || Math.abs(after) <= 2) {
          assert.equal(before - after, 1, `count=${count} i=${i} active=${active}`)
        }
      }
    }
  }
})

test("halqa: bitta atir takrorlanmaydi, bo'sh ro'yxat 0", () => {
  assert.equal(wheelSlots(1), 1)
  assert.equal(wheelSlots(0), 0)
  assert.equal(wheelSlots(7), 7)
  assert.equal(wheelSlots(3), 9)
  assert.equal(wheelSlots(2), 8)
})

test("nuqta: atirning eng yaqin nusxasiga o'tadi", () => {
  // 3 ta atir, 9 o'rin; faol 7-o'rin (atir 1). Atir 2 ning nusxalari
  // 2, 5, 8 — eng yaqini 8 (+1), 2 emas (-4)
  assert.equal(nearestSlot(2, 7, 3, 9), 8)
  assert.equal(nearestSlot(0, 7, 3, 9), 6)
  assert.equal(nearestSlot(1, 7, 3, 9), 7)
})

test('joylashuv: talab qilingan aniq qiymatlar', () => {
  assert.equal(
    wheelPlacement(0).transform,
    'translateX(0%) translateZ(0px) rotateY(0deg) scale(1)'
  )
  assert.equal(
    wheelPlacement(1).transform,
    'translateX(62%) translateZ(-140px) rotateY(-38deg) scale(0.78)'
  )
  assert.equal(
    wheelPlacement(-1).transform,
    'translateX(-62%) translateZ(-140px) rotateY(38deg) scale(0.78)'
  )
  assert.equal(
    wheelPlacement(2).transform,
    'translateX(104%) translateZ(-280px) rotateY(-48deg) scale(0.58)'
  )
  assert.equal(
    wheelPlacement(-2).transform,
    'translateX(-104%) translateZ(-280px) rotateY(48deg) scale(0.58)'
  )
})

test("joylashuv: z-index va to'q parda masofaga qarab", () => {
  assert.deepEqual(
    [0, 1, -1, 2, -2].map((d) => [wheelPlacement(d).zIndex, wheelPlacement(d).shade]),
    [[10, 0], [9, 0.4], [9, 0.4], [8, 0.65], [8, 0.65]]
  )
})

test("joylashuv: flakon o'zi shaffof qilinmaydi, uzoqdagisi yashirinadi", () => {
  for (const d of [0, 1, -1, 2, -2]) {
    assert.equal(wheelPlacement(d).opacity, 1)
    assert.equal(wheelPlacement(d).pointerEvents, undefined)
  }
  for (const d of [3, -3]) {
    assert.equal(wheelPlacement(d).opacity, 0)
    assert.equal(wheelPlacement(d).pointerEvents, 'none')
    assert.equal(wheelPlacement(d).visible, false)
  }
})

test("tanlash: tugagan va rasmsiz atirlar chiqmaydi, ko'pi bilan 7 ta", () => {
  const make = (i, extra = {}) => ({ id: String(i), imageUrl: `/i${i}.png`, outOfStock: false, ...extra })
  const list = [
    make(1),
    make(2, { outOfStock: true }),
    make(3, { imageUrl: null }),
    ...Array.from({ length: 10 }, (_, i) => make(10 + i)),
  ]
  const picked = pickWheelProducts(list)
  assert.equal(picked.length, WHEEL_MAX)
  assert.equal(picked[0].id, '1')
  assert.ok(picked.every((p) => !p.outOfStock && p.imageUrl))
  assert.deepEqual(pickWheelProducts(null), [])
})
