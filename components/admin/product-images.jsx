'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ImagePlus, LoaderCircle, Trash2 } from 'lucide-react'
import {
  ACCEPT_ATTR,
  useCloudinaryUpload,
  validateImageDimensions,
  validateImageFile,
} from '@/lib/use-upload'
import { MAX_PRODUCT_IMAGES } from '@/lib/validation/admin'
import { MIN_IMAGE_SIDE } from '@/lib/image-rules'
import { cn } from '@/lib/utils'

/**
 * Atir rasmlari: ko'pi bilan MAX_PRODUCT_IMAGES ta, tartibi
 * o'zgartiriladi, birinchisi asosiy.
 *
 * Tartibni o'zgartirish ikki yo'l bilan: desktopda sudrab (drag),
 * mobil va klaviatura uchun o'q tugmalari. Faqat drag qoldirish mobilda
 * va skrinriderda ishlamaydi.
 *
 * images: [{ publicId, url }]
 */
export function ProductImages({ images, onChange, error }) {
  const inputRef = useRef(null)
  const { upload, uploading, progress } = useCloudinaryUpload('atirlar')
  const [uploadError, setUploadError] = useState(null)
  const [dragIndex, setDragIndex] = useState(null)
  const [queue, setQueue] = useState({ done: 0, total: 0 })

  const remaining = MAX_PRODUCT_IMAGES - images.length

  async function handleFiles(event) {
    let files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    setUploadError(null)

    /*
     * Chegaradan oshganlari YUKLANMAYDI. Avval chegara yo'q edi; endi
     * server ham uni tekshiradi — oshgan rasmlar yuklansa, saqlashda rad
     * etilib, Cloudinary'ga yuklangani bekorga ketardi.
     */
    let notice = null
    if (files.length > remaining) {
      notice =
        `Ko'pi bilan ${MAX_PRODUCT_IMAGES} ta rasm. ` +
        `Tanlangan ${files.length} tadan faqat ${Math.max(remaining, 0)} tasi qo'shildi.`
      files = files.slice(0, Math.max(remaining, 0))
      if (files.length === 0) {
        setUploadError(notice)
        return
      }
    }

    const invalid = files.map(validateImageFile).find(Boolean)
    if (invalid) {
      setUploadError(invalid)
      return
    }

    /*
     * O'lcham HAMMA fayl uchun OLDINDAN tekshiriladi. Ketma-ket
     * yuklashda bitta kichik rasm qolganlarini ham to'xtatib qo'yardi;
     * fayl nomi esa qaysi biri kichik ekanini aniq ko'rsatadi.
     */
    for (const file of files) {
      const tooSmall = await validateImageDimensions(file, 'atirlar')
      if (tooSmall) {
        setUploadError(`${file.name}: ${tooSmall}`)
        return
      }
    }

    setQueue({ done: 0, total: files.length })
    const uploaded = []

    try {
      for (const [index, file] of files.entries()) {
        const publicId = await upload(file)
        uploaded.push({ publicId, url: URL.createObjectURL(file), isLocal: true })
        setQueue({ done: index + 1, total: files.length })
      }
      onChange([...images, ...uploaded])
      if (notice) setUploadError(notice)
    } catch (err) {
      // Muvaffaqiyatli yuklanganlarni saqlab qolamiz
      if (uploaded.length > 0) onChange([...images, ...uploaded])
      setUploadError(err.message)
    } finally {
      setQueue({ done: 0, total: 0 })
    }
  }

  function move(from, to) {
    if (to < 0 || to >= images.length) return
    const next = [...images]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  function remove(index) {
    onChange(images.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground">Rasmlar</span>
        <span className="text-sm text-muted-foreground">
          Birinchi rasm asosiy bo'ladi
        </span>
      </div>

      {/*
        Telefonda 2 ustun: 3 ustunda har kafel ~100px bo'lib, 44px li
        boshqaruv tugmalari rasmni butunlay yopib qo'yardi.
      */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {images.map((image, index) => (
          <div
            key={image.publicId}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragEnd={() => setDragIndex(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (dragIndex !== null && dragIndex !== index) move(dragIndex, index)
              setDragIndex(null)
            }}
            className={cn(
              'group relative aspect-square overflow-hidden rounded-lg border bg-muted',
              index === 0 ? 'border-primary' : 'border-border',
              dragIndex === index && 'opacity-50'
            )}
          >
            <Image
              src={image.url}
              alt=""
              width={200}
              height={200}
              unoptimized={image.url.startsWith('blob:')}
              className="size-full object-cover"
            />

            {index === 0 ? (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                Asosiy
              </span>
            ) : null}

            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={`${index + 1}-rasmni o'chirish`}
              // size-11 (44px): avval 28px edi — telefonda "o'chirish" va
              // "surish" tugmalari yonma-yon, noto'g'ri bosish oson edi
              className="absolute right-1 top-1 flex size-11 items-center justify-center rounded-md bg-foreground/70 text-white transition-colors hover:bg-destructive"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>

            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-foreground/60">
              <button
                type="button"
                onClick={() => move(index, index - 1)}
                disabled={index === 0}
                aria-label={`${index + 1}-rasmni oldinga surish`}
                className="flex size-11 items-center justify-center rounded text-white disabled:opacity-30"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => move(index, index + 1)}
                disabled={index === images.length - 1}
                aria-label={`${index + 1}-rasmni orqaga surish`}
                className="flex size-11 items-center justify-center rounded text-white disabled:opacity-30"
              >
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}

        {remaining > 0 || uploading ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <>
              <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
              <span className="text-xs">
                {queue.total > 1
                  ? `${queue.done}/${queue.total}`
                  : `${progress}%`}
              </span>
            </>
          ) : (
            <>
              <ImagePlus className="size-5" aria-hidden="true" />
              <span className="text-xs">Qo'shish</span>
            </>
          )}
        </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        onChange={handleFiles}
        className="hidden"
      />

      <p className="mt-2 text-sm text-muted-foreground">
        JPG, PNG yoki WEBP. Har biri eng ko'pi 5MB, kamida{' '}
        {MIN_IMAGE_SIDE.atirlar}×{MIN_IMAGE_SIDE.atirlar}px.
        Ko'pi bilan {MAX_PRODUCT_IMAGES} ta, bir vaqtda bir nechtasini
        tanlashingiz mumkin.
      </p>

      {uploadError || error ? (
        <p role="alert" className="mt-2 text-sm text-danger-deep">
          {uploadError || error}
        </p>
      ) : null}
    </div>
  )
}
