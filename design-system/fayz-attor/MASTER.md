# FAYZ ATTOR — Design System MASTER

> **LOGIC:** Sahifa qurishdan oldin `design-system/fayz-attor/pages/[page-name].md` ni tekshir.
> Agar u fayl mavjud bo'lsa, uning qoidalari bu Master faylni **override** qiladi.
> Mavjud bo'lmasa — qat'iy ravishda quyidagi qoidalarga amal qil.

**Project:** Fayz Attor — ko'p brendli atir e-commerce
**Category:** E-commerce Luxury
**Style:** Liquid Glass (glassmorphism), premium teal + gold
**Generated:** ui-ux-pro-max 2.15.0 (2026-10-13), ranglar logodan qo'lda moslandi

---

## 1. Rang palitrasi

Ranglar **logodan** olingan. Generator taklif qilgan neytral-tosh palitra rad etildi.
Bu qiymatlarni o'zgartirish mumkin emas.

### Asosiy tokenlar (brend — majburiy)

| Token | Hex | Rol |
|---|---|---|
| `--brand-deep` | `#0D454E` | Chuqur petrol-teal — asosiy to'q fon (logo foni) |
| `--brand-darker` | `#072B32` | Eng to'q — footer, overlay, CTA ustidagi matn |
| `--brand-mid` | `#14626E` | O'rta teal — hover, gradient oxiri |
| `--brand-light` | `#2A8A99` | Ochiq teal — **faqat** aksent chiziq/border/ikonka |
| `--ivory` | `#F5F2EA` | Issiq oq — to'q fondagi asosiy matn, ochiq sahifa foni |
| `--pure-white` | `#FFFFFF` | Sof oq |
| `--gold` | `#C9A961` | Premium aksent — CTA fon, narx (to'q fonda) |
| `--gold-light` | `#E0C88A` | Gold hover / ochiqroq aksent |
| `--success` | `#2E9E6B` | Muvaffaqiyat |
| `--danger` | `#C7503F` | Chegirma badge, xato |
| `--muted` | `#8FA7AC` | Ikkilamchi matn (to'q fonda), chizilgan eski narx |

### Hosila tokenlar (ochiq fon uchun — a11y majburiyati)

Asl `--gold` va `--muted` ochiq (ivory/oq) fonda 4.5:1 dan o'tmaydi
(`--gold` → 2.01, `--muted` → 2.26). Prompt kontrastni **har doim** 4.5:1+ talab qiladi,
shuning uchun ochiq yuzalarda **faqat** quyidagi hosila variantlar ishlatiladi.
Brend tokenlari o'zgarmadi — bu ularning ochiq-fon juftligi.

| Token | Hex | Ivory fonda | Oq fonda | Qayerda |
|---|---|---|---|---|
| `--gold-deep` | `#856A2E` | 4.58 ✅ | 5.12 ✅ | Ochiq fondagi narx matni |
| `--muted-deep` | `#577076` | 4.71 ✅ | 5.27 ✅ | Ochiq fondagi ikkilamchi matn |
| `--danger-deep` | `#AC4232` | 5.24 ✅ | 5.87 ✅ | Ochiq fondagi xato matni |
| `--success-deep` | `#237650` | 4.97 ✅ | 5.56 ✅ | Ochiq fondagi "Mavjud" matni |

### Tasdiqlangan kontrast juftliklari (WCAG hisoblangan)

| Matn | Fon | Nisbat | Daraja |
|---|---|---|---|
| `--ivory` | `--brand-deep` | **9.49** | AAA |
| `--ivory` | `--brand-darker` | **13.40** | AAA |
| `--ivory` | `--brand-mid` | **6.25** | AA |
| `--gold` | `--brand-deep` | **4.72** | AA |
| `--gold` | `--brand-darker` | **6.66** | AA |
| `--gold-light` | `--brand-deep` | **6.47** | AA |
| `--brand-darker` | `--gold` (CTA) | **6.66** | AA |
| `--brand-darker` | `--gold-light` (CTA hover) | **9.14** | AAA |
| `--muted` | `--brand-deep` | 4.19 | ⚠️ faqat 18px+/bold |
| `--pure-white` | `--danger` (badge) | **4.52** | AA |
| `--brand-deep` | `--ivory` | **9.49** | AAA |
| `--brand-mid` | `--ivory` | **6.25** | AA |

### TAQIQLANGAN juftliklar

| Matn | Fon | Nisbat | Nima qilish kerak |
|---|---|---|---|
| `--gold` | `--ivory` / oq | 2.01 ❌ | `--gold-deep` ishlat |
| `--muted` | `--ivory` / oq | 2.26 ❌ | `--muted-deep` ishlat |
| `--brand-light` | `--brand-deep` | 2.63 ❌ | Matn uchun emas — faqat border/dekor |
| `--gold` | `--brand-mid` | 3.11 ❌ | Matn uchun emas |
| `--pure-white` | `--success` | 3.38 ❌ | Badge foni `--success-deep` qil |

### Rang ishlatish qoidasi

- **Asosiy fon:** `--brand-deep` (to'q sahifalar) yoki `--ivory` (katalog/kontent sahifalari)
- **CTA tugmalar** ("Savatga qo'shish", "Buyurtma berish"): fon `--gold`, matn `--brand-darker`
- **Narx:** to'q fonda `--gold`, ochiq fonda `--gold-deep`
- **Eski narx:** `--muted` / `--muted-deep`, ustidan chizilgan (`line-through`)
- **Chegirma badge:** fon `--danger`, matn `--pure-white`
- **Admin panel:** ochiq fon (`--ivory` / oq), teal faqat aksent sifatida — bu ish quroli

### Hech qachon

- Neon ranglar
- Pushti-binafsha gradient, "AI look"
- Palitradan tashqari tasodifiy hex qiymat

---

## 2. Tipografika

- **Sarlavhalar:** `Cormorant Garamond` (serif — logodagi "FAYZ" ruhi)
- **Matn / UI:** `Inter` (sans — logodagi "ATTOR" ruhi, keng harfli)
- Yuklash: **`next/font/google`** orqali — CLS nol bo'lishi uchun.
  `@import` yoki `<link>` ishlatilmaydi.

```js
// app/fonts.js
import { Cormorant_Garamond, Inter } from 'next/font/google'

export const serif = Cormorant_Garamond({
  subsets: ['latin'], weight: ['400', '500', '600', '700'],
  variable: '--font-serif', display: 'swap',
})
export const sans = Inter({
  subsets: ['latin', 'cyrillic'], // ru tili uchun kirill majburiy
  variable: '--font-sans', display: 'swap',
})
```

### Shkala (mobile-first)

| Rol | Mobil | Desktop | Font | Weight |
|---|---|---|---|---|
| Hero H1 | 36px | 60px | serif | 600 |
| H2 (bo'lim) | 28px | 40px | serif | 600 |
| H3 (karta nomi) | 18px | 20px | serif | 500 |
| Body | 16px | 16px | sans | 400 |
| Small / meta | 14px | 14px | sans | 400 |
| Narx | 20px | 22px | sans | 700 |
| Tugma matni | 16px | 16px | sans | 600 |

**Qoida:** matn hech qachon 14px dan kichik emas. `input` har doim **16px** —
aks holda iOS fokusda sahifani zoom qiladi.
"ATTOR" uslubidagi sarlavhalarda `letter-spacing: 0.18em` ishlatilsin.

---

## 3. Glassmorphism (mijozning aniq talabi)

```css
.glass {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 8px 32px rgba(7, 43, 50, 0.28);
}

/* Ochiq (ivory) fon ustidagi shisha */
.glass-light {
  background: rgba(13, 69, 78, 0.06);
  backdrop-filter: blur(14px) saturate(130%);
  -webkit-backdrop-filter: blur(14px) saturate(130%);
  border: 1px solid rgba(13, 69, 78, 0.12);
  box-shadow: 0 8px 24px rgba(7, 43, 50, 0.1);
}
```

### Qayerda ishlatiladi (faqat shu ro'yxat)

1. Header — scroll qilinganda
2. Mahsulot kartochkasi — hover'da (desktop)
3. Filtr paneli / bottom sheet
4. Savat drawer
5. Modal
6. Bottom navigation (mobil)

### Performance qoidalari — QAT'IY

Arzon Android telefonlarda `backdrop-filter` sekinlashtiradi:

- Bir ekranda **6 tadan ortiq** blur elementi bo'lmasin
- **Scroll qilinadigan uzun ro'yxatlarda blur YO'Q** — mahsulot grid kartochkalari
  mobil versiyada qattiq (solid) fon ishlatadi, blur emas
- Blur faqat **statik / fixed** elementlarda (header, drawer, bottom nav, modal)
- Shisha orqasidagi matn kontrasti **har doim 4.5:1+** —
  kerak bo'lsa shisha ostiga qattiq to'q qatlam qo'shiladi

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 4. Logo

Fayl: `public/logo.png` (flakon monogrammasi + "FAYZ" serif + "ATTOR" keng sans)

| Joy | Ko'rinish | Balandlik |
|---|---|---|
| Header | Monogramma + "FAYZ ATTOR" matni | 36–40px |
| Footer | To'liq logo | ~80px |
| Favicon | Faqat monogramma | 32/180px |

- Cho'zish, ranglarini o'zgartirish, soya/effekt qo'shish — taqiqlanadi
- Atrofida kamida logo balandligining **yarmicha** bo'sh joy
- Logo foni `--brand-deep` bilan bir xil — ochiq fonda ishlatilsa teal konteyner ichida

---

## 5. Spacing

| Token | Qiymat | Ishlatilishi |
|---|---|---|
| `--space-xs` | 4px | Zich bo'shliq |
| `--space-sm` | 8px | Ikonka oralig'i |
| `--space-md` | 16px | Standart padding, mobil sahifa chekkasi |
| `--space-lg` | 24px | Bo'lim paddingi |
| `--space-xl` | 32px | Katta oraliq |
| `--space-2xl` | 48px | Bo'lim margini (mobil) |
| `--space-3xl` | 64px | Hero padding / bo'lim margini (desktop) |

Mobil sahifa chekkasi: **16px**. Desktop konteyner: `max-width: 1280px`, chekka 24px.

---

## 6. Radius va soya

| Token | Qiymat |
|---|---|
| `--radius-sm` | 8px (tugma, input) |
| `--radius-md` | 12px (karta) |
| `--radius-lg` | 16px (modal, drawer) |
| `--radius-full` | 9999px (badge, chip) |

```css
--shadow-sm: 0 1px 2px rgba(7, 43, 50, 0.06);
--shadow-md: 0 4px 12px rgba(7, 43, 50, 0.1);
--shadow-lg: 0 10px 28px rgba(7, 43, 50, 0.16);
--shadow-xl: 0 20px 40px rgba(7, 43, 50, 0.22);
```

Soyalar qora emas — `--brand-darker` tonida (teal-qora).

---

## 7. Komponentlar

### Tugmalar

```css
/* Asosiy CTA — "Savatga qo'shish", "Buyurtma berish" */
.btn-primary {
  background: var(--gold);
  color: var(--brand-darker); /* 6.66:1 */
  padding: 14px 24px;
  min-height: 48px; /* touch target */
  border-radius: var(--radius-sm);
  font: 600 16px/1 var(--font-sans);
  transition: background 200ms ease, transform 200ms ease;
  cursor: pointer;
}
.btn-primary:hover {
  background: var(--gold-light);
  transform: translateY(-1px);
}
.btn-primary:active {
  transform: translateY(0);
}
.btn-primary:disabled {
  background: var(--muted);
  color: var(--brand-darker);
  cursor: not-allowed;
  transform: none;
}

/* Ikkilamchi — to'q fonda */
.btn-secondary {
  background: transparent;
  color: var(--ivory);
  border: 1px solid rgba(245, 242, 234, 0.35);
  padding: 14px 24px;
  min-height: 48px;
  border-radius: var(--radius-sm);
  font: 600 16px/1 var(--font-sans);
  transition: all 200ms ease;
  cursor: pointer;
}
.btn-secondary:hover {
  border-color: var(--gold);
  color: var(--gold);
}

/* Fokus — barcha interaktiv elementlar uchun majburiy */
.btn-primary:focus-visible,
.btn-secondary:focus-visible,
.input:focus-visible {
  outline: 2px solid var(--gold-light);
  outline-offset: 2px;
}
```

### Mahsulot kartochkasi

```css
.product-card {
  background: var(--pure-white); /* ochiq katalogda */
  border: 1px solid rgba(13, 69, 78, 0.1);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: box-shadow 200ms ease, transform 200ms ease;
  cursor: pointer;
}
/* Hover faqat desktopda — mobil grid'da blur/hover YO'Q */
@media (hover: hover) and (min-width: 1024px) {
  .product-card:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }
}
```

Kartochka tarkibi: rasm (1:1, `next/image`, aniq width/height) → brend nomi
(`--muted-deep`, 14px) → mahsulot nomi (serif 18px, 2 qatorda kesiladi) →
narx oralig'i (`--gold-deep`, 20px, 700). Chegirma bo'lsa — yuqori chap burchakda
`--danger` badge. Tugagan bo'lsa — rasm ustida `--brand-darker` 60% overlay + "Tugagan".

### Input

```css
.input {
  width: 100%;
  padding: 12px 16px;
  min-height: 48px;
  font-size: 16px; /* iOS zoom bo'lmasin */
  border: 1px solid rgba(13, 69, 78, 0.2);
  border-radius: var(--radius-sm);
  background: var(--pure-white);
  color: var(--brand-darker);
  transition: border-color 200ms ease, box-shadow 200ms ease;
}
.input:focus {
  border-color: var(--brand-mid);
  box-shadow: 0 0 0 3px rgba(20, 98, 110, 0.15);
  outline: none;
}
.input[aria-invalid='true'] {
  border-color: var(--danger-deep);
}
```

Telefon input'i: `inputMode="tel"`, mask `+998 (XX) XXX-XX-XX`.

### Modal / Drawer

```css
.modal-overlay {
  background: rgba(7, 43, 50, 0.55);
  backdrop-filter: blur(4px);
}
.modal {
  background: var(--brand-deep);
  color: var(--ivory);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-xl);
}
```

Mobil (<768px): modal va drawer ekranni **to'liq** egallaydi, `safe-area-inset` hurmat qilinadi.

### Skeleton loader

Spinner **ishlatilmaydi**. Yuklanish — kontent shaklidagi skeleton:
`--muted` 10% fon + 1.5s shimmer. `prefers-reduced-motion` da shimmer o'chadi.

---

## 8. Mobil (eng yuqori ustuvorlik)

Foydalanuvchilarning 90%+ telefondan. **Mobile-first:** avval 375px, keyin kattalashtir.
Tekshiruv nuqtalari: **375 / 414 / 768 / 1024 / 1440px**.

| Qoida | Qiymat |
|---|---|
| Touch target | min **44×44px** (CTA 48px) |
| Mahsulot grid | mobil **2** ustun / planshet 3 / desktop 4 |
| Gorizontal scroll | **umuman yo'q** — `overflow-x: hidden` bilan yashirish taqiqlanadi, sabab topib tuzatiladi |
| Rasmlar | `next/image`, lazy, WebP, aniq `width`/`height` → CLS = 0 |
| Bottom nav | sticky, glass: Bosh sahifa / Katalog / Savat / Profil |
| Lighthouse mobile | Performance **85+**, Accessibility **95+** |

Bottom nav balandligi 64px + `env(safe-area-inset-bottom)`.
Sahifa kontentiga shuncha `padding-bottom` qo'shiladi — kontent nav ostida qolmasin.

---

## 9. Animatsiya

- `framer-motion` — **me'yorida**. Mobil tezlikni buzmasin.
- Transition: 150–300ms, `ease-out`
- Faqat `transform` va `opacity` animatsiya qilinadi (layout shift yo'q)
- Sahifa o'tishlari: fade + 8px translateY, 200ms
- `prefers-reduced-motion: reduce` — barcha animatsiya o'chadi

---

## 10. Sahifa patterni

**Pattern:** Feature-Rich Showcase
**CTA joylashuvi:** Hero (sticky) + xususiyatlardan keyin + pastda
**Bosh sahifa tartibi:** Hero → Kategoriyalar (Ayollar/Erkaklar/Unisex) →
Tanlangan atirlar (slider) → Brendlar → Nega biz → Footer

---

## 11. Anti-patternlar (QILMA)

- Emoji ikonka sifatida — **faqat `lucide-react` SVG**
- Neon rang, pushti-binafsha gradient, "AI look"
- Vibrant & block-based, o'yinqaroq ranglar
- `cursor: pointer` siz bosiladigan element
- Layout siljitadigan hover (scale)
- 4.5:1 dan past kontrast
- Transition'siz holat o'zgarishi
- Ko'rinmas fokus holati
- Haddan ziyod blur (mobil tezligini o'ldiradi)
- Logoni cho'zish/o'zgartirish
- Lorem ipsum yoki soxta ma'lumot
- Spinner (skeleton ishlatiladi)

---

## 12. Yetkazishdan oldingi checklist

- [ ] Emoji ikonka sifatida ishlatilmagan (faqat lucide SVG)
- [ ] Barcha ikonka bitta to'plamdan (lucide-react)
- [ ] Bosiladigan elementlarda `cursor-pointer`
- [ ] Hover holatlari 150–300ms transition bilan
- [ ] Matn kontrasti 4.5:1+ (TAQIQLANGAN juftliklar ishlatilmagan)
- [ ] Fokus holati klaviatura navigatsiyasida ko'rinadi
- [ ] `prefers-reduced-motion` hurmat qilingan
- [ ] Responsive tekshirildi: 375 / 414 / 768 / 1024 / 1440px
- [ ] Kontent fixed header/bottom-nav ostida qolmagan
- [ ] Mobilda gorizontal scroll yo'q
- [ ] Bir ekranda 6 tadan ortiq blur elementi yo'q
- [ ] Scroll ro'yxatlarida blur ishlatilmagan
- [ ] Barcha rasm `next/image` + aniq o'lcham (CLS = 0)
- [ ] Touch target 44×44px dan katta
- [ ] Input shrifti 16px (iOS zoom yo'q)
