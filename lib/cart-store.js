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

      /**
       * Serverdan kelgan joriy holatni qo'llaydi (lib/cart-sync.js).
       * @returns o'zgarishlar — foydalanuvchiga aytish uchun
       */
      sync(snapshot) {
        const { items, changes } = applySnapshot(get().items, snapshot)
        set({ items })
        return changes
      },
    }),
    {
      name: 'fayz-attor-savat',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
)

/**
 * Savat elementlarini serverdagi joriy holat bilan yangilaydi (sof funksiya).
 *
 * NEGA: savat mahsulot QO'SHILGAN paytdagi nom, narx va rasm bilan
 * saqlanardi va hech qachon yangilanmasdi — o'lik rasm havolasi abadiy
 * "yuklanib" turardi, eski narx esa checkout'dagi jami summani noto'g'ri
 * ko'rsatardi (mijoz bir summani ko'rib, server boshqasini hisoblardi).
 *
 * Qoidalar:
 *  - nom, rasm, narx, hajm nomi — serverdagisi bilan almashtiriladi
 *  - serverda yo'q (o'chirilgan/yashirilgan) yoki tugagan — `available: false`,
 *    lekin savatdan O'CHIRILMAYDI: mijoz nima bo'lganini ko'rishi kerak
 *  - miqdor qoldiqdan ko'p bo'lsa — qoldiqqa tushiriladi (checkout'da xato
 *    berib to'xtatgandan ko'ra yaxshi) va bu ham aytiladi
 *
 * @returns {{ items: object[], changes: { priceChanged: string[],
 *            unavailable: string[], quantityReduced: string[] } }}
 */
export function applySnapshot(items, snapshot) {
  const changes = { priceChanged: [], unavailable: [], quantityReduced: [] }

  const next = items.map((item) => {
    const fresh = snapshot?.[item.variantId]

    if (!fresh) {
      changes.unavailable.push(item.variantId)
      return { ...item, available: false }
    }

    if (fresh.unitPrice !== item.unitPrice) changes.priceChanged.push(item.variantId)

    let quantity = item.quantity
    if (!fresh.available) {
      changes.unavailable.push(item.variantId)
    } else if (fresh.stockQty < quantity) {
      quantity = fresh.stockQty
      changes.quantityReduced.push(item.variantId)
    }

    return {
      ...item,
      name: fresh.name,
      brandName: fresh.brandName,
      sizeLabel: fresh.sizeLabel,
      slug: fresh.slug,
      imageUrl: fresh.imageUrl,
      unitPrice: fresh.unitPrice,
      stockQty: fresh.stockQty,
      available: fresh.available,
      quantity,
    }
  })

  return { items: next, changes }
}

/** Mavjud bo'lmagan (tugagan/o'chirilgan) elementlar bormi. */
export function hasUnavailable(items) {
  return items.some((item) => item.available === false)
}

/** Savatdagi jami mahsulot soni. */
export function cartCount(items) {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

/**
 * Taxminiy jami summa (ko'rsatish uchun).
 * Mavjud bo'lmagan elementlar hisoblanmaydi — ular buyurtmaga kirmaydi.
 */
export function cartTotal(items) {
  return items
    .filter((item) => item.available !== false)
    .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
}
