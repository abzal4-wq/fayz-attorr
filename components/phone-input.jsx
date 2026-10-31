'use client'

import { forwardRef, useCallback, useEffect, useRef } from 'react'
import { applyPhoneEdit } from '@/lib/auth/phone'
import { cn } from '@/lib/utils'

/**
 * Telefon raqami maydoni:  +998 | (90) 123-45-67
 *
 * "+998" maydon TASHQARISIDA, o'zgarmas belgi. Maydonning qiymatida faqat
 * mijozning 9 raqami turadi — nega aynan shunday, lib/auth/phone.js dagi
 * izohda (qisqasi: prefiks qiymatda bo'lganida maska uni mijozning raqami
 * deb o'qib, yozish paytida "89898989" kabi begona raqamlar chiqarardi).
 *
 * Server istalgan ko'rinishni qabul qiladi (normalizePhone): "(90) 123-45-67"
 * ham, "+998901234567" ham bir xil +998901234567 ga aylanadi.
 *
 * Mobilda raqamli klaviatura uchun inputMode="tel". Shrift 16px — aks
 * holda iOS fokusda sahifani zoom qiladi.
 *
 * Standart `autoComplete="tel"` — buyurtma formasi uchun (aloqa raqami).
 * Kirish/ro'yxat/tiklash formalari uni `username` bilan almashtiradi.
 */
export const PhoneInput = forwardRef(function PhoneInput(
  { className, onChange, value, ...props },
  ref
) {
  // Tahrirdan oldingi qiymat: ajratuvchi o'chirilganini aniqlash uchun
  const previous = useRef(typeof value === 'string' ? value : '')

  // Boshqariladigan rejimda qiymat tashqaridan kelishi mumkin (checkout'da
  // oldindan to'ldirish)
  useEffect(() => {
    if (typeof value === 'string') previous.current = value
  }, [value])

  const handleChange = useCallback(
    (event) => {
      const input = event.target
      const edit = applyPhoneEdit({
        value: input.value,
        caret: input.selectionStart,
        previous: previous.current,
        inputType: event.nativeEvent?.inputType,
      })

      input.value = edit.value
      previous.current = edit.value

      /*
       * Kursor joyida qoladi. Busiz har qayta formatlashda kursor oxiriga
       * sakrardi: o'rtadagi xatoni tuzatmoqchi bo'lgan odam bitta raqam
       * yozgach, keyingisi oxiriga tushardi.
       */
      if (document.activeElement === input) {
        try {
          input.setSelectionRange(edit.caret, edit.caret)
        } catch {
          // Ba'zi eski brauzerlarda tel uchun selection qo'llanmaydi
        }
      }

      onChange?.(event)
    },
    [onChange]
  )

  return (
    <div className="relative">
      {/*
        Ekran o'quvchi uchun yashirin: maydon yorlig'i ("Telefon raqami")
        va qiymat yetarli, "+998" har safar o'qilishi ortiqcha.
      */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 select-none text-[16px] text-card-foreground"
      >
        +998
      </span>
      <input
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="(__) ___-__-__"
        value={value}
        onChange={handleChange}
        className={cn(
          // pl-16: "+998" va undan keyingi bo'shliq uchun joy
          'w-full min-h-11 rounded-lg border border-input bg-card pl-16 pr-4 text-[16px] text-card-foreground',
          'transition-colors duration-200 placeholder:text-muted-foreground',
          'focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
          'aria-[invalid=true]:border-destructive',
          className
        )}
        {...props}
      />
    </div>
  )
})
