/**
 * Yuklanadigan rasmlar uchun qoidalar — brauzer ham, server ham shu
 * fayldan oladi.
 *
 * NEGA BITTA JOYDA: avval hajm chegarasi ikki faylda alohida yozilgan
 * edi (lib/cloudinary.js va lib/use-upload.js), o'lcham chegarasi esa
 * faqat serverda edi. Natijada brauzer kichik rasmni bemalol yuklardi,
 * server esa saqlash paytida uni rad etib, Cloudinary'dan o'chirardi —
 * rasm formada qolib, keyingi "Saqlash" tushunarsiz "Rasm topilmadi"
 * bilan yiqilardi.
 *
 * Hech narsa import qilmaydi: lib/cloudinary.js SDK va maxfiy kalitlarni
 * oladi, uni brauzerga olib bo'lmaydi.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB

/**
 * Eng kichik joiz tomoni (piksel), papkaga qarab.
 *
 * Brauzer rasmni ekran zichligiga ko'paytirib so'raydi — 375px
 * telefonda atir rasmi butun kenglikni egallaydi va DPR 2 da ~750px
 * talab qiladi. Next.js kichik manbani KATTALASHTIRMAYDI, shuning
 * uchun 400px lik fayl yuklansa, rasm telefonda abadiy xira qoladi.
 */
export const MIN_IMAGE_SIDE = {
  atirlar: 1000,
  // Logotip 32-80px joyda ko'rsatiladi, shuning uchun talab kichik
  brendlar: 200,
}

export const DEFAULT_MIN_IMAGE_SIDE = 200

/** Papka nomidan eng kichik joiz tomon. */
export function minSideForFolder(subfolder) {
  return MIN_IMAGE_SIDE[subfolder] ?? DEFAULT_MIN_IMAGE_SIDE
}

/**
 * O'lchamni tekshiradi.
 *
 * Xabar brauzerda ham, serverda ham AYNAN bir xil — admin qayerda rad
 * etilganidan qat'i nazar bitta tushunarli matn ko'radi.
 *
 * @returns {string|null} xato matni yoki null
 */
export function checkImageSize(width, height, minSide) {
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return "Rasm o'lchamini aniqlab bo'lmadi"
  }
  if (width < minSide || height < minSide) {
    return (
      `Rasm juda kichik: ${width}×${height}px. ` +
      `Kamida ${minSide}×${minSide}px kerak — aks holda telefonda xira ko'rinadi.`
    )
  }
  return null
}
