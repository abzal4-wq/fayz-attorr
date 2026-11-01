/**
 * Yuklashdan oldin rasmni BRAUZERDA tayyorlash (canvas).
 *
 * Hisob qoidalari — lib/image-prep.js (test qilingan). Bu yerda faqat
 * rasmni ochish, tahlil uchun kichik nusxa olish va natijani chizish.
 *
 * Faqat brauzerda ishlaydi (document, canvas).
 */

import {
  detectBackground,
  findContentBox,
  planOutput,
  prepRulesFor,
  scaleBox,
  upscaleWarning,
} from './image-prep.js'
import { MAX_IMAGE_BYTES } from './image-rules.js'

// Tahlil nusxasining eng uzun tomoni: aniqlik yetarli, lekin 24 MP
// suratda ham bir zumda o'qiladi
const ANALYSIS_SIDE = 600

/**
 * <img> orqali ochiladi, createImageBitmap emas: <img> telefon
 * suratidagi EXIF burilishini HAR DOIM hisobga oladi. createImageBitmap
 * esa brauzerga qarab rasmni yonboshlab qo'yishi mumkin.
 */
async function loadImage(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return img
  } catch {
    throw new Error("Rasmni o'qib bo'lmadi — boshqa fayl tanlang")
  } finally {
    // decode() tugagach rasm xotirada — havola endi kerak emas
    URL.revokeObjectURL(url)
  }
}

function canvasOf(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function toBlob(canvas, type, quality) {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Rasmni tayyorlab bo'lmadi"))),
      type,
      quality
    )
  )
}

/** Tahlil uchun kichik nusxa piksellari. */
function sample(img, flattenWhite) {
  const scale = Math.max(img.naturalWidth, img.naturalHeight) / ANALYSIS_SIDE
  const factor = Math.max(1, scale)
  const width = Math.max(1, Math.round(img.naturalWidth / factor))
  const height = Math.max(1, Math.round(img.naturalHeight / factor))
  const canvas = canvasOf(width, height)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (flattenWhite) {
    // Shaffof PNG: shaffof joy oq deb olinadi (sayt fonida ham oq)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)
  }
  ctx.drawImage(img, 0, 0, width, height)
  return { data: ctx.getImageData(0, 0, width, height).data, width, height, factor }
}

function isOpaqueCorners(data, width, height) {
  const alphaAt = (x, y) => data[(y * width + x) * 4 + 3]
  return [
    alphaAt(0, 0),
    alphaAt(width - 1, 0),
    alphaAt(0, height - 1),
    alphaAt(width - 1, height - 1),
  ].every((a) => a === 255)
}

function renamed(name, type) {
  const ext = type === 'image/png' ? 'png' : 'jpg'
  return `${String(name || 'rasm').replace(/\.[^.]+$/, '')}.${ext}`
}

/**
 * Rasmni papka qoidasiga moslaydi.
 *
 * @param {File} file
 * @param {string} subfolder 'atirlar' | 'brendlar'
 * @returns {Promise<{ file: File, changed: boolean, warning: string|null,
 *   width: number, height: number }>}
 */
export async function prepareImage(file, subfolder) {
  const rules = prepRulesFor(subfolder)
  const img = await loadImage(file)
  const original = { width: img.naturalWidth, height: img.naturalHeight }

  const needed =
    rules.always ||
    original.width < rules.minSide ||
    original.height < rules.minSide ||
    file.size > MAX_IMAGE_BYTES
  if (!needed) return { file, changed: false, warning: null, ...original }

  const flatten = !rules.keepAlpha
  const small = sample(img, flatten)

  // Chetni kesish (atirlar): bir xil fonli rasmda — atirning o'zi qoladi
  let box = { x: 0, y: 0, ...original }
  let fill = flatten ? '#ffffff' : null
  const bg = detectBackground(small.data, small.width, small.height)
  if (bg && (flatten || isOpaqueCorners(small.data, small.width, small.height))) {
    fill = `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`
    if (rules.trim) {
      const found = findContentBox(small.data, small.width, small.height, bg)
      if (found) box = scaleBox(found, small.factor, original.width, original.height)
    }
  }

  // Bir xil fon topilmagan atir surati kvadrat qilinmaydi — oq chiziqlar
  // bilan to'ldirilgan "manzara" surat g'alati ko'rinardi
  const plan = planOutput({
    box,
    rules: { ...rules, square: rules.square && (Boolean(bg) || !rules.trim) },
  })

  const canvas = canvasOf(plan.width, plan.height)
  const ctx = canvas.getContext('2d')
  if (fill) {
    ctx.fillStyle = fill
    ctx.fillRect(0, 0, plan.width, plan.height)
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  const { source: s, target: t } = plan
  ctx.drawImage(img, s.x, s.y, s.width, s.height, t.x, t.y, t.width, t.height)

  const blob = await toBlob(canvas, rules.type, rules.quality)
  if (blob.size > MAX_IMAGE_BYTES) {
    throw new Error("Rasm tayyorlangandan keyin ham 5MB dan katta — boshqa rasm tanlang")
  }

  return {
    file: new File([blob], renamed(file.name, rules.type), { type: rules.type }),
    changed: true,
    warning: upscaleWarning(plan),
    width: plan.width,
    height: plan.height,
  }
}
