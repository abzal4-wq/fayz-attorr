'use client'

import { useCallback, useState } from 'react'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
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
