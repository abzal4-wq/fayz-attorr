/**
 * Bosh sahifadagi 3D g'ildirak karuselining sof mantiqi.
 *
 * Komponentdan (components/site/hero-wheel.jsx) ajratilgan: brauzersiz
 * test qilinadi va hisob bir joyda turadi.
 */

/** G'ildirakka ko'pi bilan nechta atir chiqadi. */
export const WHEEL_MAX = 7

/**
 * G'ildirakka chiqadigan atirlar: tugaganlari va rasmsizlari chiqmaydi.
 *
 * Tugagan atirni ko'z-ko'z qilib, bosganda "Tugagan" ko'rsatish mijozni
 * aldangandek his qildiradi; rasmsiz atir esa g'ildirakda bo'sh oq plita
 * bo'lib turadi.
 */
export function pickWheelProducts(products, max = WHEEL_MAX) {
  return (products ?? [])
    .filter((p) => p && !p.outOfStock && p.imageUrl)
    .slice(0, max)
}

/*
 * Halqada kamida shuncha o'rin bo'ladi.
 *
 * NEGA: ko'rinadigan oyna 5 o'rin (-2..+2). Oxiridan boshiga o'tishda
 * bitta flakon halqaning bir chetidan ikkinchisiga o'tadi. O'rin 7 dan
 * kam bo'lsa (masalan 5 ta atir), bu KO'RINIB turgan flakon bo'ladi va
 * u boshqalarning ortidan chapdan o'ngga uchib o'tadi. 7 va undan ko'p
 * o'rinda bu o'tish faqat yashirin (|masofa| >= 3) flakonlar orasida.
 */
const MIN_RING = 7

/**
 * Halqadagi o'rinlar soni. Atir kam bo'lsa ro'yxat takrorlanadi:
 * 3 ta atir -> 9 o'rin (a b c a b c a b c). Bitta atir takrorlanmaydi —
 * o'rtada yolg'iz turadi (bir xil flakonlar halqasi g'alati ko'rinadi).
 */
export function wheelSlots(count) {
  if (count <= 1) return Math.max(count, 0)
  return count * Math.ceil(MIN_RING / count)
}

/**
 * `target`-atirning faol o'ringa ENG YAQIN nusxasi (nuqta bosilganda).
 * Uzoqdagi nusxa tanlansa, g'ildirak keraksiz aylanib ketardi.
 */
export function nearestSlot(target, activeSlot, count, slots) {
  let best = target
  for (let s = target; s < slots; s += count) {
    if (Math.abs(wheelDistance(s, activeSlot, slots)) < Math.abs(wheelDistance(best, activeSlot, slots))) {
      best = s
    }
  }
  return best
}

/**
 * Atirning faol atirdan doiraviy masofasi, ENG QISQA yo'nalish bo'yicha.
 *
 * 7 ta atirda faol 0 bo'lsa, 6-atir -1 (chapda), +6 emas. Oddiy
 * `index - active` olinsa, oxirgidan birinchiga o'tishda hamma flakon
 * g'ildirak bo'ylab orqaga "sakrab" ketardi.
 *
 * Teng masofada (juft sonli, masalan 2 tadan 1 yoki 4 tadan 2) — o'ngda.
 */
export function wheelDistance(index, active, count) {
  if (count <= 0) return 0
  let d = (((index - active) % count) + count) % count
  if (d > count / 2) d -= count
  return d
}

/*
 * Masofaga qarab joylashuv. ±1 va ±2 — talab qilingan qiymatlar.
 *
 * rotateY ishorasi translateX ga TESKARI: o'ngdagi flakon chap qirrasi
 * bilan bizga qaraydi (g'ildirak ichkariga egiladi).
 *
 * shade — flakon ustidagi to'q parda. Flakon O'ZI shaffof qilinmaydi:
 * atir rasmlarining foni oq, shaffof oq plita to'q fonda kulrang bo'lib,
 * atirga emas bo'sh plitaga o'xshab qolardi.
 */
const STEPS = [
  { x: 0, z: 0, rotate: 0, scale: 1, shade: 0 },
  { x: 62, z: -140, rotate: 38, scale: 0.78, shade: 0.4 },
  { x: 104, z: -280, rotate: 48, scale: 0.58, shade: 0.65 },
]

/*
 * 2 dan uzoqdagilar ko'rinmaydi, lekin DOM'da QOLADI (aks holda har
 * aylanishda rasm qaytadan yuklanardi). Ular ±2 dan ham orqaroqda
 * turadi — navbati kelganda g'ildirak ortidan chiqib keladi.
 */
const HIDDEN = { x: 130, z: -400, rotate: 55, scale: 0.4, shade: 0.65 }

/**
 * @returns {{ transform: string, opacity: number, zIndex: number,
 *   pointerEvents: 'none' | undefined, shade: number, visible: boolean }}
 */
export function wheelPlacement(distance) {
  const abs = Math.abs(distance)
  const step = STEPS[abs] ?? HIDDEN
  const sign = Math.sign(distance)
  const visible = abs <= 2

  // `|| 0`: -0 ni "0" ga aylantiradi (aks holda "rotateY(-0deg)")
  const x = sign * step.x || 0
  const rotate = -sign * step.rotate || 0

  return {
    transform: `translateX(${x}%) translateZ(${step.z}px) rotateY(${rotate}deg) scale(${step.scale})`,
    opacity: visible ? 1 : 0,
    zIndex: 10 - abs,
    pointerEvents: visible ? undefined : 'none',
    shade: step.shade,
    visible,
  }
}
