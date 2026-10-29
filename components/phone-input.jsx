'use client'

import { forwardRef, useCallback } from 'react'
import { maskPhoneInput } from '@/lib/auth/phone'
import { cn } from '@/lib/utils'

/**
 * Telefon raqami uchun maskalangan input: +998 (90) 123-45-67
 *
 * Mobilda raqamli klaviatura chiqishi uchun inputMode="tel".
 * Shrift 16px — aks holda iOS fokusda sahifani zoom qiladi.
 *
 * Standart `autoComplete="tel"` — buyurtma formasi uchun to'g'ri
 * (aloqa raqami). Kirish/ro'yxat/tiklash formalari uni `username`
 * bilan almashtiradi: u yerda telefon hisob identifikatori.
 */
export const PhoneInput = forwardRef(function PhoneInput(
  { className, onChange, value, ...props },
  ref
) {
  const handleChange = useCallback(
    (event) => {
      const masked = maskPhoneInput(event.target.value)
      event.target.value = masked
      onChange?.(event)
    },
    [onChange]
  )

  return (
    <input
      ref={ref}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder="+998 (__) ___-__-__"
      value={value}
      onChange={handleChange}
      className={cn(
        'w-full min-h-12 rounded-lg border border-input bg-card px-4 text-[16px] text-card-foreground',
        'transition-colors duration-200 placeholder:text-muted-foreground',
        'focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
        'aria-[invalid=true]:border-destructive',
        className
      )}
      {...props}
    />
  )
})
