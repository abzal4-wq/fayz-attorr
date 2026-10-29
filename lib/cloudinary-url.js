/**
 * Cloudinary yetkazib berish URL'iga transformatsiya qo'shish.
 *
 * NEGA ALOHIDA FAYL: `lib/cloudinary.js` Cloudinary SDK'sini va
 * maxfiy kalitlarni import qiladi — uni brauzer komponentidan
 * chaqirib bo'lmaydi. Bu yerdagi funksiyalar esa sof satr amallari,
 * shuning uchun ham serverda, ham brauzerda ishlaydi.
 */

const UPLOAD_MARKER = '/image/upload/'

/**
 * URL ichiga transformatsiya qo'yadi.
 *
 * Cloudinary havolasi bo'lmasa (demo yoki lokal rasm) qiymat
 * O'ZGARTIRILMASDAN qaytariladi — aks holda seed ma'lumotidagi
 * rasmlar buzilardi.
 *
 * @example
 * // .../image/upload/v123/x.png -> .../image/upload/e_trim/v123/x.png
 */
export function cloudinaryTransform(url, transform) {
  if (typeof url !== 'string' || !transform) return url

  const at = url.indexOf(UPLOAD_MARKER)
  if (at === -1) return url

  const cut = at + UPLOAD_MARKER.length
  return url.slice(0, cut) + transform + '/' + url.slice(cut)
}

/*
 * Brend logotipi uchun transformatsiya.
 *
 * MUAMMO: logotiplar ixtiyoriy rasm sifatida yuklanadi. Jonli
 * saytdagi Chanel logosi 343x260 bo'lib, atrofida juda ko'p bo'sh
 * joy bor edi — kartochkadagi 32px li joyda belgi kichkina
 * ko'rinib, qora kvadratning o'tkir cheti ko'zga tashlanardi.
 *
 *  e_trim:0  bir xil rangdagi chetni avtomatik kesadi. Aniq
 *            `:0` bardoshliligi bilan: standart `:10` "CHANEL"
 *            yozuvining pastini ham qirqib yuborardi (sinab
 *            ko'rilgan: 138x92, harflar kesilgan).
 *
 *  c_pad     kesilgandan keyin KVADRATGA keltiradi. Busiz har
 *            logotip boshqa nisbatda bo'lib, kartochkalar qatori
 *            notekis ko'rinardi.
 *
 *  b_auto    bo'sh joy rangini chetdan oladi, ya'ni qora fonli
 *            logotip qora, oq fonli oq bo'lib to'ldiriladi.
 *
 * Natija: 343x260 (ko'p bo'sh joy) -> 256x256 (belgi to'ldirgan).
 */
const BRAND_LOGO_TRANSFORM = 'e_trim:0/c_pad,w_256,h_256,b_auto'

/** Brend logotipining ko'rsatish uchun tayyorlangan URL'i. */
export function brandLogoUrl(url) {
  return cloudinaryTransform(url, BRAND_LOGO_TRANSFORM)
}
