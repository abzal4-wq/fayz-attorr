'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { ImagePlus, LoaderCircle, Trash2 } from 'lucide-react'
import { ACCEPT_ATTR, useCloudinaryUpload } from '@/lib/use-upload'

/**
 * Bitta rasm maydoni (brend logosi uchun).
 *
 * Fayl tanlangan zahoti Cloudinary'ga yuklanadi va publicId qaytariladi.
 * Forma saqlanganda server o'sha publicId'ni tasdiqlaydi.
 */
export function ImageField({
  subfolder,
  currentUrl,
  onUploaded,
  onRemoved,
  label = 'Logo',
}) {
  const inputRef = useRef(null)
  const { upload, uploading, progress } = useCloudinaryUpload(subfolder)
  const [preview, setPreview] = useState(currentUrl ?? null)
  const [error, setError] = useState(null)

  async function handleFile(event) {
    const file = event.target.files?.[0]
    event.target.value = '' // bir xil faylni qayta tanlash mumkin bo'lsin
    if (!file) return

    setError(null)
    const localPreview = URL.createObjectURL(file)

    try {
      const publicId = await upload(file)
      setPreview(localPreview)
      onUploaded(publicId)
    } catch (err) {
      URL.revokeObjectURL(localPreview)
      setError(err.message)
    }
  }

  function handleRemove() {
    setPreview(null)
    setError(null)
    onRemoved()
  }

  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-foreground">{label}</span>

      <div className="flex items-center gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          {preview ? (
            <Image
              src={preview}
              alt=""
              width={80}
              height={80}
              unoptimized={preview.startsWith('blob:')}
              className="size-20 object-contain"
            />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTR}
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                {progress}%
              </>
            ) : preview ? (
              "Rasmni almashtirish"
            ) : (
              'Rasm yuklash'
            )}
          </button>

          {preview ? (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-danger-deep transition-colors hover:bg-destructive/10 disabled:opacity-60"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              O'chirish
            </button>
          ) : null}
        </div>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        JPG, PNG yoki WEBP. Eng ko'pi 5MB.
      </p>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger-deep">
          {error}
        </p>
      ) : null}
    </div>
  )
}
