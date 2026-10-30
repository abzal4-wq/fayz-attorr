'use client'

import Image from 'next/image'
import { ImageOff } from 'lucide-react'
import { useState } from 'react'

/**
 * Savatdagi mahsulot rasmi — yuklanmasa belgiga almashadi.
 *
 * NEGA: rasm o'chirilgan bo'lsa yoki tarmoq uzilsa, oddiy <Image> bo'sh
 * quti bo'lib "abadiy yuklanayotgandek" turardi (o'lik havola ~2s da 404
 * qaytaradi, keyin hech narsa). Savat endi serverdan yangilanadi
 * (lib/use-cart-sync.js), lekin u ham ishlamay qolishi mumkin — bu
 * ikkinchi himoya.
 *
 * Xato qaysi manbada bo'lgani eslab qolinadi: savat yangilanib boshqa
 * rasm kelsa, u qaytadan sinab ko'riladi.
 */
export function CartThumb({ src, size, className, iconClassName }) {
  const [failedSrc, setFailedSrc] = useState(null)

  if (!src || failedSrc === src) {
    return <ImageOff className={iconClassName} aria-hidden="true" />
  }

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      onError={() => setFailedSrc(src)}
      className={className}
    />
  )
}
