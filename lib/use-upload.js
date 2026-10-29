'use client'

import { useCallback, useState } from 'react'
import { MAX_IMAGE_BYTES, checkImageSize, minSideForFolder } from '@/lib/image-rules'

// Server bilan umumiy qoida — lib/image-rules.js
export { MAX_IMAGE_BYTES }
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const ACCEPT_ATTR = 'image/jpeg,image/png,image/webp'

/** Faylni yuborishdan oldin brauzerda tekshiradi — tez javob uchun. */
export function validateImageFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Faqat JPG, PNG yoki WEBP rasm yuklash mumkin'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1)
    return `Rasm hajmi 5MB dan oshmasligi kerak (hozir ${mb}MB)`
  }
  return null
}

/**
 * Fayldan rasmning haqiqiy o'lchamini o'qiydi (yuklamasdan).
 * @returns {Promise<{width: number, height: number}>}
 */
export async function readImageSize(file) {
  // createImageBitmap tez va DOM'ga tegmaydi; eski brauzerlar uchun <img>
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file)
    const size = { width: bitmap.width, height: bitmap.height }
    bitmap.close?.()
    return size
  }

  const url = URL.createObjectURL(file)
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi"))
      img.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Rasm o'lchamini YUKLASHDAN OLDIN tekshiradi.
 *
 * Busiz kichik rasm Cloudinary'ga yuklanib, formada ko'rinib turardi;
 * server esa uni faqat "Saqlash" paytida rad etib, faylni o'chirardi.
 * Rasm formada qolib ketgani uchun keyingi "Saqlash" tushunarsiz
 * "Rasm topilmadi" bilan yiqilardi.
 *
 * @returns {Promise<string|null>} xato matni yoki null
 */
export async function validateImageDimensions(file, subfolder) {
  let size
  try {
    size = await readImageSize(file)
  } catch {
    // O'qib bo'lmasa to'smaymiz — server baribir tekshiradi
    return null
  }
  return checkImageSize(size.width, size.height, minSideForFolder(subfolder))
}

/**
 * Rasmni Cloudinary'ga TO'G'RIDAN-TO'G'RI yuklaydi.
 * Server faqat imzo beradi — fayl Vercel'ning so'rov limitidan o'tmaydi.
 *
 * upload() Cloudinary publicId qaytaradi.
 */
export function useCloudinaryUpload(subfolder) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const upload = useCallback(
    async (file) => {
      const invalid = validateImageFile(file)
      if (invalid) throw new Error(invalid)

      // Atir rasmlari ham, brend logotipi ham shu yerdan o'tadi
      const tooSmall = await validateImageDimensions(file, subfolder)
      if (tooSmall) throw new Error(tooSmall)

      setUploading(true)
      setProgress(0)

      try {
        const sigRes = await fetch('/api/admin/upload/signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subfolder }),
        })
        const sig = await sigRes.json().catch(() => null)
        if (!sigRes.ok || !sig?.ok) {
          throw new Error(sig?.message || 'Yuklashga ruxsat olinmadi')
        }

        const form = new FormData()
        form.append('file', file)
        form.append('api_key', sig.apiKey)
        form.append('timestamp', String(sig.timestamp))
        form.append('signature', sig.signature)
        form.append('folder', sig.folder)

        // Jarayonni ko'rsatish uchun XHR (fetch yuklash progressini bermaydi)
        const publicId = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open(
            'POST',
            `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`
          )

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              setProgress(Math.round((event.loaded / event.total) * 100))
            }
          }

          xhr.onload = () => {
            try {
              const res = JSON.parse(xhr.responseText)
              if (xhr.status >= 200 && xhr.status < 300 && res.public_id) {
                resolve(res.public_id)
              } else {
                reject(new Error(res?.error?.message || 'Rasm yuklanmadi'))
              }
            } catch {
              reject(new Error("Cloudinary javobini o'qib bo'lmadi"))
            }
          }

          xhr.onerror = () =>
            reject(new Error('Tarmoq xatosi. Internetni tekshiring.'))
          xhr.send(form)
        })

        return publicId
      } finally {
        setUploading(false)
        setProgress(0)
      }
    },
    [subfolder]
  )

  return { upload, uploading, progress }
}
