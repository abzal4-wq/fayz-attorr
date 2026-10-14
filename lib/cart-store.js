'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * Savat — Zustand + localStorage.
 *
 * MUHIM: bu yerdagi narxlar FAQAT ko'rsatish uchun. Buyurtma berishda
 * server har bir variant narxini bazadan qaytadan oladi va jami summani
 * o'zi hisoblaydi — brauzerdan kelgan summaga ishonilmaydi.
 *
 * Savat elementi variant (atir + hajm) bo'yicha ajratiladi: bir atirning
 * 30ml va 50ml si alohida qatorlar.
 */
export const useCart = create(
  persist(
    (set, get) => ({
      items: [],

      addItem(item, quantity = 1) {
        const items = [...get().items]
        const index = items.findIndex((i) => i.variantId === item.variantId)

        if (index >= 0) {
          items[index] = {
            ...items[index],
            quantity: items[index].quantity + quantity,
          }
        } else {
          items.push({ ...item, quantity })
        }

        set({ items })
      },

      setQuantity(variantId, quantity) {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.variantId !== variantId) })
          return
        }
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        })
      },

      removeItem(variantId) {
        set({ items: get().items.filter((i) => i.variantId !== variantId) })
      },

      clear() {
        set({ items: [] })
      },
    }),
    {
      name: 'fayz-attor-savat',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
)

/** Savatdagi jami mahsulot soni. */
export function cartCount(items) {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

/** Taxminiy jami summa (ko'rsatish uchun). */
export function cartTotal(items) {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
}
