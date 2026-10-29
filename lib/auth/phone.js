/**
 * O'zbekiston telefon raqamlari bilan ishlash.
 *
 * Bazada HAR DOIM E.164 formatida saqlanadi: +998XXXXXXXXX
 * Foydalanuvchiga HAR DOIM maskalangan ko'rinishda ko'rsatiladi: +998 (90) 123-45-67
 */

const UZ_PREFIX = '998'
const NATIONAL_LENGTH = 9 // 998 dan keyingi raqamlar soni

/**
 * Har qanday kiritilgan ko'rinishdan E.164 ga keltiradi.
 * Qabul qiladi: "+998901234567", "998901234567", "901234567",
 *               "+998 (90) 123-45-67", "90 123 45 67"
 *
 * @returns {string|null} "+998901234567" yoki noto'g'ri bo'lsa null
 */
export function normalizePhone(input) {
  if (typeof input !== 'string') return null

  // Faqat raqamlarni qoldiramiz
  let digits = input.replace(/\D/g, '')

  // Foydalanuvchi mamlakat kodisiz kiritgan bo'lishi mumkin
  if (digits.length === NATIONAL_LENGTH) {
    digits = UZ_PREFIX + digits
  }

  // "00998..." ko'rinishi
  if (digits.startsWith('00' + UZ_PREFIX)) {
    digits = digits.slice(2)
  }

  if (digits.length !== UZ_PREFIX.length + NATIONAL_LENGTH) return null
  if (!digits.startsWith(UZ_PREFIX)) return null

  // Operator kodi 0 bilan boshlanmaydi
  if (digits[UZ_PREFIX.length] === '0') return null

  return '+' + digits
}

/**
 * E.164 raqamni ko'rsatish uchun formatlaydi.
 * "+998901234567" -> "+998 (90) 123-45-67"
 */
export function formatPhone(e164) {
  const normalized = normalizePhone(e164)
  if (!normalized) return typeof e164 === 'string' ? e164 : ''

  const n = normalized.slice(4) // 998 dan keyingi 9 raqam
  return `+998 (${n.slice(0, 2)}) ${n.slice(2, 5)}-${n.slice(5, 7)}-${n.slice(7, 9)}`
}

/* ===================== Kiritish maydoni (maska) =====================
 *
 * MAYDONDA FAQAT MILLIY 9 RAQAM TURADI: "(90) 123-45-67".
 * "+998" maydon TASHQARISIDA, o'zgarmas belgi bo'lib ko'rsatiladi
 * (components/phone-input.jsx).
 *
 * NEGA: avval "+998" maydon qiymatining o'zida edi. Maska har tugmada
 * butun qiymatni qayta o'qiganda o'zi qo'ygan prefiksdagi "998" ni
 * mijozning raqami deb qabul qilardi. Jonli saytda brauzerda qayta
 * hosil qilingan:
 *
 *   "9" -> "+998 (9"   "0" -> "+998 (99) 890"   "1" -> "+998 (99) 899-89-01"
 *
 * ya'ni yozish paytida maydonda "89898989" kabi begona raqamlar paydo
 * bo'lardi. Backspace esa raqamni butunlay boshqasiga aylantirardi:
 * "+998 (90) 123-45" dan bitta belgi o'chirilsa "+998 (99) 890-12-34".
 * Mijoz xatosini tuzatib, shu holda yuborsa — buyurtma yoki kirish
 * NOTO'G'RI raqam bilan ketardi.
 *
 * Prefiks qiymatdan chiqarilgach chalkashlikning o'zi yo'qoldi: maska
 * faqat mijoz yozgan raqamlarni ko'radi.
 */

/**
 * Kiritilgan matndan milliy 9 raqamni ajratadi.
 *
 * To'liq raqam joylashtirilsa yoki brauzer avtomatik to'ldirsa
 * ("+998 90 123 45 67", "998901234567", "00998...") mamlakat kodi
 * olib tashlanadi — lekin FAQAT raqamlar 9 tadan oshganda: "99"
 * haqiqiy operator kodi, ya'ni "998123456" o'zi to'liq milliy raqam.
 */
export function nationalDigits(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '')

  if (digits.startsWith('00' + UZ_PREFIX)) digits = digits.slice(2)

  while (digits.length > NATIONAL_LENGTH && digits.startsWith(UZ_PREFIX)) {
    digits = digits.slice(UZ_PREFIX.length)
  }

  return digits.slice(0, NATIONAL_LENGTH)
}

/**
 * Milliy raqamlarni "(90) 123-45-67" ko'rinishiga keltiradi.
 *
 * Ajratuvchilar faqat KEYINGI raqam bilan birga qo'yiladi — qiymat
 * har doim RAQAM bilan tugaydi. Avval 2 ta raqamda "(90)" bo'lardi:
 * backspace ")" ni o'chirar, maska esa uni qaytarib qo'yardi va
 * tugma "qotib" qolardi.
 */
export function formatNational(digits) {
  const d = String(digits ?? '')
  if (d.length === 0) return ''

  let out = '(' + d.slice(0, 2)
  if (d.length > 2) out += ') ' + d.slice(2, 5)
  if (d.length > 5) out += '-' + d.slice(5, 7)
  if (d.length > 7) out += '-' + d.slice(7, 9)
  return out
}

/** Har qanday kiritishni maydon ko'rinishiga keltiradi: "(90) 123-45-67". */
export function maskPhoneInput(raw) {
  return formatNational(nationalDigits(raw))
}

/**
 * Bitta tahrirni qo'llaydi: qiymatni maskalaydi va kursorni joyida
 * saqlaydi.
 *
 * Sof funksiya — PhoneInput uni chaqiradi, testlar esa brauzersiz
 * tekshiradi.
 *
 * @param {object} edit
 * @param {string} edit.value     brauzer o'zgartirgandan keyingi qiymat
 * @param {number} [edit.caret]   kursor o'rni (selectionStart)
 * @param {string} [edit.previous] tahrirdan oldingi (maskalangan) qiymat
 * @param {string} [edit.inputType] InputEvent.inputType
 * @returns {{ value: string, caret: number }}
 */
export function applyPhoneEdit({ value, caret, previous = '', inputType }) {
  const raw = String(value ?? '')
  const pos = Math.max(0, Math.min(caret ?? raw.length, raw.length))
  const caretAtEnd = pos === raw.length

  let before = raw.slice(0, pos).replace(/\D/g, '')
  let after = raw.slice(pos).replace(/\D/g, '')
  const previousDigits = String(previous ?? '').replace(/\D/g, '')

  /*
   * Ajratuvchi belgi o'chirildi, raqamlar o'zgarmadi — masalan kursor
   * "-" dan keyin turib backspace bosildi. Maska "-" ni qaytarib
   * qo'yadi va tugma ishlamagandek tuyuladi. Odam kutgani — undan
   * oldingi raqam o'chishi.
   */
  if (before + after === previousDigits) {
    if (inputType === 'deleteContentBackward' && before.length > 0) {
      before = before.slice(0, -1)
    } else if (inputType === 'deleteContentForward' && after.length > 0) {
      after = after.slice(1)
    }
  }

  const all = before + after
  const digits = nationalDigits(all)
  const masked = formatNational(digits)

  // Mamlakat kodi olib tashlangan (joylashtirish/avto-to'ldirish) yoki
  // kursor oxirida edi — kursor oxiriga
  const stripped = digits !== all.slice(0, NATIONAL_LENGTH)
  if (caretAtEnd || stripped) return { value: masked, caret: masked.length }

  // Aks holda: kursordan oldin nechta raqam bo'lsa, shuncha raqamdan keyin
  const wanted = Math.min(before.length, digits.length)
  if (wanted === 0) return { value: masked, caret: 0 }

  let seen = 0
  for (let i = 0; i < masked.length; i += 1) {
    if (/\d/.test(masked[i])) seen += 1
    if (seen === wanted) return { value: masked, caret: i + 1 }
  }
  return { value: masked, caret: masked.length }
}

export function isValidUzPhone(input) {
  return normalizePhone(input) !== null
}
