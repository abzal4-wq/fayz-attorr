/**
 * Yuklashdan oldin rasmni tayyorlash — SOF hisob qismi (DOM'siz).
 *
 * NEGA: avval 1000px dan kichik atir rasmi (logotip — 200px) rad
 * etilardi va admin rasmni boshqa joyda o'zi kesib, kattalashtirib
 * qayta yuklashi kerak edi. Endi brauzer buni o'zi qiladi
 * (lib/prepare-image.js): bir xil rangli chetni kesadi, kvadratga
 * keltiradi va o'lchamni talabga moslaydi.
 *
 * Bu fayl faqat raqamlar bilan ishlaydi — piksel massivi kiradi,
 * to'rtburchak koordinatalari chiqadi. Canvas qismi alohida, shuning
 * uchun bu yerdagi qoidalar brauzersiz test qilinadi.
 */

import { minSideForFolder } from './image-rules.js'

/** Yuklash uchun qabul qilinadigan eng katta ASL fayl (tayyorlanguncha). */
export const MAX_INPUT_BYTES = 25 * 1024 * 1024

/*
 * Papka bo'yicha tayyorlash qoidalari.
 *
 * atirlar — HAR DOIM tayyorlanadi: chet kesiladi, kvadrat qilinadi.
 *   Kvadrat shart: kartochka va g'ildirak rasmni kvadratda
 *   ko'rsatadi; uzunchoq rasm `object-cover` bilan qirqilib, flakon
 *   qopqog'i kesilardi. `padding` — atirning atrofida qoladigan joy
 *   (har tomondan, eng uzun tomonga nisbatan).
 *
 * brendlar — faqat KERAK bo'lsa (kichik yoki juda katta fayl).
 *   Shaffoflik saqlanadi (PNG) va kichik logotip KATTALASHTIRILMAYDI,
 *   balki shaffof chet bilan to'ldiriladi: logotip ko'rsatilganda
 *   Cloudinary `e_trim` shu chetni baribir kesadi (lib/cloudinary-url.js),
 *   chiziqlari esa tiniq qoladi.
 */
export const PREP_RULES = {
  atirlar: {
    always: true,
    trim: true,
    square: true,
    padding: 0.08,
    maxSide: 2000,
    type: 'image/jpeg',
    quality: 0.92,
  },
  brendlar: {
    always: false,
    trim: false,
    square: true,
    padding: 0,
    maxSide: 1200,
    type: 'image/png',
    keepAlpha: true,
    upscale: false,
  },
}

/** Papka uchun to'liq qoida (eng kichik tomon image-rules.js dan). */
export function prepRulesFor(subfolder) {
  const rules = PREP_RULES[subfolder] ?? PREP_RULES.brendlar
  return { upscale: true, keepAlpha: false, ...rules, minSide: minSideForFolder(subfolder) }
}

/*
 * Rang farqi chegarasi (0-255, har kanal bo'yicha). JPEG oq fonni ham
 * 248-255 oralig'ida "shovqinli" saqlaydi — 24 shuni yutadi, lekin
 * flakonning och kulrang soyasini fon deb olmaydi.
 */
export const DEFAULT_TOLERANCE = 24

function pixelAt(data, width, x, y) {
  const i = (y * width + x) * 4
  return [data[i], data[i + 1], data[i + 2]]
}

function close(a, b, tolerance) {
  return (
    Math.abs(a[0] - b[0]) <= tolerance &&
    Math.abs(a[1] - b[1]) <= tolerance &&
    Math.abs(a[2] - b[2]) <= tolerance
  )
}

/**
 * Fon rangini to'rt burchakdan aniqlaydi.
 *
 * Har burchakdan kichik kvadrat olinadi; to'rttasi ham bir xil rangda
 * bo'lsagina fon "bir xil" deb hisoblanadi. Aks holda (sahnadagi
 * surat, gradient) null — bunday rasm kesilmaydi, chunki qayer chet,
 * qayer atir ekanini ishonchli bilib bo'lmaydi.
 *
 * @param {Uint8ClampedArray|number[]} data RGBA (alfa avval oq fonga quyilgan)
 * @returns {[number, number, number] | null}
 */
export function detectBackground(data, width, height, tolerance = DEFAULT_TOLERANCE) {
  if (width < 4 || height < 4) return null

  const patch = Math.max(2, Math.round(Math.min(width, height) * 0.02))
  const corners = [
    [0, 0],
    [width - patch, 0],
    [0, height - patch],
    [width - patch, height - patch],
  ]

  const samples = []
  for (const [cx, cy] of corners) {
    for (let y = cy; y < cy + patch; y++) {
      for (let x = cx; x < cx + patch; x++) samples.push(pixelAt(data, width, x, y))
    }
  }

  const mean = [0, 1, 2].map(
    (c) => Math.round(samples.reduce((sum, p) => sum + p[c], 0) / samples.length)
  )
  return samples.every((p) => close(p, mean, tolerance)) ? mean : null
}

/**
 * Fondan farq qiladigan qismning chegarasi.
 *
 * Qator/ustun hisobga olinishi uchun undagi "atir" piksellari kamida
 * 0.4% bo'lishi kerak (kamida 2 ta): JPEG'dagi yolg'iz dog' yoki chang
 * chegarani butun rasm bo'ylab cho'zib yubormasin.
 *
 * @returns {{ x: number, y: number, width: number, height: number } | null}
 *   null — rasm butunlay fon rangida
 */
export function findContentBox(data, width, height, bg, tolerance = DEFAULT_TOLERANCE) {
  const rows = new Array(height).fill(0)
  const cols = new Array(width).fill(0)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!close(pixelAt(data, width, x, y), bg, tolerance)) {
        rows[y]++
        cols[x]++
      }
    }
  }

  const rowMin = Math.max(2, Math.round(width * 0.004))
  const colMin = Math.max(2, Math.round(height * 0.004))
  const top = rows.findIndex((n) => n >= rowMin)
  if (top === -1) return null
  const bottom = rows.findLastIndex((n) => n >= rowMin)
  const left = cols.findIndex((n) => n >= colMin)
  const right = cols.findLastIndex((n) => n >= colMin)
  if (left === -1) return null

  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 }
}

/**
 * Kichraytirilgan nusxada topilgan chegarani asl o'lchamga o'tkazadi.
 *
 * Tahlil kichik nusxada qilinadi (24 megapikselli suratni to'liq
 * o'qish telefonni qotirardi). Har tomonga bir "kichik piksel" zaxira
 * qo'shiladi — yaxlitlash atirning chetini qirqib qo'ymasin.
 */
export function scaleBox(box, scale, srcWidth, srcHeight) {
  const x = Math.max(0, Math.floor((box.x - 1) * scale))
  const y = Math.max(0, Math.floor((box.y - 1) * scale))
  const right = Math.min(srcWidth, Math.ceil((box.x + box.width + 1) * scale))
  const bottom = Math.min(srcHeight, Math.ceil((box.y + box.height + 1) * scale))
  return { x, y, width: right - x, height: bottom - y }
}

/**
 * Natijaviy rasm o'lchami va manbadan qaysi qism qayerga chiziladi.
 *
 * @param {object} p
 * @param {{x,y,width,height}} p.box   manbadagi kerakli qism
 * @param {object} p.rules             prepRulesFor() natijasi
 * @returns {{ width, height, source: {x,y,width,height},
 *   target: {x,y,width,height}, scale: number }}
 */
export function planOutput({ box, rules }) {
  const { minSide, maxSide, padding = 0, square, upscale } = rules
  const cw = box.width
  const ch = box.height

  /*
   * Juda cho'ziq rasm (2:1 dan ortiq) baribir kvadratga keltiriladi:
   * aks holda qisqa tomonni minSide ga yetkazish 500×4000 lik suratni
   * 1000×8000 ga aylantirardi — telefon brauzeri bunday canvas'ni
   * chiza olmaydi, saytda esa u baribir kvadratda ko'rsatiladi.
   */
  const elongated = Math.max(cw, ch) > 2 * Math.min(cw, ch)

  if (square || elongated) {
    const longest = Math.max(cw, ch)
    const natural = Math.round(longest * (1 + 2 * padding))
    // Kattalashtirish mumkin bo'lmasa — o'lcham joyida, yetmagani chet bilan
    const side = Math.min(maxSide, Math.max(minSide, natural))
    const room = side / (1 + 2 * padding)
    let scale = room / longest
    if (!upscale) scale = Math.min(1, scale)

    const width = Math.round(cw * scale)
    const height = Math.round(ch * scale)
    return {
      width: side,
      height: side,
      source: box,
      target: {
        x: Math.round((side - width) / 2),
        y: Math.round((side - height) / 2),
        width,
        height,
      },
      scale,
    }
  }

  /*
   * Kvadrat emas (bir xil fonsiz surat): nisbat saqlanadi. Server IKKALA
   * tomonni ham tekshiradi, shuning uchun qisqa tomon minSide ga
   * yetkaziladi; uzun tomon maxSide dan oshmaydi, lekin juda cho'ziq
   * rasmda qisqa tomon talabi ustun.
   */
  const shortest = Math.min(cw, ch)
  const longest = Math.max(cw, ch)
  let scale = Math.min(1, maxSide / longest)
  if (shortest * scale < minSide) scale = minSide / shortest
  const width = Math.round(cw * scale)
  const height = Math.round(ch * scale)
  return {
    width,
    height,
    source: box,
    target: { x: 0, y: 0, width, height },
    scale,
  }
}

/**
 * Admin uchun ogohlantirish: rasm sezilarli kattalashtirilgan bo'lsa.
 * 1.5 baravargacha farq ko'zga deyarli tashlanmaydi.
 *
 * O'lcham sifatida ATIRNING o'zi (kesilgan qism) aytiladi, butun rasm
 * emas: 800×800 rasmning burchagida 200px lik flakon turgan bo'lsa,
 * "rasm 800px edi" degan gap adminni chalg'itardi.
 */
export function upscaleWarning(plan) {
  if (plan.scale <= 1.5) return null
  const { width, height } = plan.source
  return (
    `Rasmdagi atir kichik edi (${width}×${height}px) — avtomatik ` +
    `kattalashtirildi va biroz xira ko'rinishi mumkin. Sifatliroq rasm ` +
    `bo'lsa, keyinroq almashtiring.`
  )
}
