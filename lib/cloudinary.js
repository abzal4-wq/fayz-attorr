import { v2 as cloudinary } from 'cloudinary'

/**
 * Rasm saqlash — Cloudinary.
 *
 * Yuklash sxemasi: brauzer faylni TO'G'RIDAN-TO'G'RI Cloudinary'ga yuboradi,
 * server esa faqat imzo beradi va natijani tasdiqlaydi.
 *
 * Nega shunday: Vercel'da serverless so'rov tanasi ~4.5MB bilan cheklangan,
 * bizning limit esa 5MB. Fayl server orqali o'tsa, 5MB lik rasm yuklanmaydi.
 *
 * Xavfsizlik: brauzer yuklagandan keyin faqat `publicId` ni qaytaradi.
 * Server o'sha publicId ni Cloudinary'dan qayta so'raydi va URL'ni O'ZI
 * aniqlaydi — shuning uchun mijoz ixtiyoriy URL kiritib qo'ya olmaydi.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB
export const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp']
export const UPLOAD_FOLDER = 'fayz-attor'

let configured = false

function getCloudinary() {
  if (!configured) {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
      process.env

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw new Error("Cloudinary sozlamalari .env da to'ldirilmagan")
    }

    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    })
    configured = true
  }
  return cloudinary
}

/**
 * Brauzerdagi yuklash uchun imzo yaratadi.
 * `folder` imzoga kiradi — mijoz uni o'zgartira olmaydi.
 */
export function createUploadSignature(subfolder) {
  const cld = getCloudinary()
  const timestamp = Math.round(Date.now() / 1000)
  const folder = subfolder ? `${UPLOAD_FOLDER}/${subfolder}` : UPLOAD_FOLDER

  const paramsToSign = { folder, timestamp }
  const signature = cld.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  )

  return {
    signature,
    timestamp,
    folder,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  }
}

/**
 * Yuklangan rasmni tasdiqlaydi: mavjudmi, bizning papkadami,
 * formati va hajmi joizmi.
 *
 * @returns {Promise<{url: string, publicId: string}>}
 * @throws tasdiqdan o'tmasa
 */
export async function confirmUpload(publicId) {
  if (typeof publicId !== 'string' || publicId.length === 0) {
    throw new Error('Rasm identifikatori yuborilmadi')
  }

  // Faqat o'z papkamizdagi rasmlar
  if (!publicId.startsWith(UPLOAD_FOLDER + '/')) {
    throw new Error("Rasm noto'g'ri papkada")
  }

  const cld = getCloudinary()

  let resource
  try {
    resource = await cld.api.resource(publicId, { resource_type: 'image' })
  } catch {
    throw new Error('Rasm topilmadi')
  }

  if (!ALLOWED_FORMATS.includes(String(resource.format).toLowerCase())) {
    await deleteImage(publicId)
    throw new Error('Faqat JPG, PNG yoki WEBP formatdagi rasm yuklash mumkin')
  }

  if (resource.bytes > MAX_IMAGE_BYTES) {
    await deleteImage(publicId)
    throw new Error("Rasm hajmi 5MB dan oshmasligi kerak")
  }

  // URL serverda aniqlanadi — mijozdan kelgan qiymatga ishonmaymiz
  return { url: resource.secure_url, publicId: resource.public_id }
}

/**
 * Rasmni o'chiradi. Demo/lokal rasmlar ("local:" bilan boshlanadi)
 * Cloudinary'da yo'q — ular uchun chaqirilmaydi.
 */
export async function deleteImage(publicId) {
  if (typeof publicId !== 'string' || publicId.startsWith('local:')) return

  try {
    await getCloudinary().uploader.destroy(publicId, { resource_type: 'image' })
  } catch (error) {
    // Rasm o'chmasa ham ma'lumotlar bazasidagi amal to'xtamasligi kerak.
    console.error('Cloudinary rasmni o\'chira olmadi:', publicId, error?.message)
  }
}
