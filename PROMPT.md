# FAYZ ATTOR — E-commerce Website | Master Prompt

> Bu loyihaning yagona manba spetsifikatsiyasi (single source of truth).
> Har bir bosqichdan oldin shu fayl va `design-system/fayz-attor/MASTER.md` o'qiladi.

---

## 0. ROL VA UMUMIY VAZIFA

Tajribali full-stack developer va product engineer sifatida ishlash. Vazifa —
**FAYZ ATTOR** nomli ko'p brendli atir do'koni uchun to'liq ishlaydigan,
production-ready e-commerce websayt qurish.

Bu real mijoz uchun real loyiha. Demo emas, placeholder emas — ishlaydigan mahsulot kerak.

**Mahsulot:** atirlarni online ko'rish, filtrlash, savatga qo'shish va buyurtma berish
platformasi + to'liq admin panel + Telegram bot integratsiyasi.

**Bozor:** O'zbekiston. Foydalanuvchilarning 90%+ telefondan kiradi.
Sayt keyinchalik Telegram Mini App sifatida ham ishlaydi.

---

## PHASE 0 — SKILLAR

```bash
# 1. UI/UX Pro Max — design intelligence
npx ui-ux-pro-max-cli init --ai claude

# 2. ECC — agent harness (plan -> test -> implement -> review)
npx ecc-universal@2.2.3 setup
# Claude Code ichidan muqobil yo'l:
#   /plugin marketplace add https://github.com/affaan-m/ECC
#   /plugin install ecc@ecc

# 3. find-skills
npx skills add https://github.com/vercel-labs/skills --skill find-skills
```

Eslatma: `ui-ux-pro-max` ishlashi uchun `python3` kerak.

**O'rnatgandan keyin majburiy:**

1. `find-skills` orqali loyihaga mos qo'shimcha skillar bor-yo'qligini tekshirish.
2. `ui-ux-pro-max` dan design system generatsiya qilish:
   ```bash
   python3 .claude/skills/ui-ux-pro-max/scripts/search.py "luxury perfume e-commerce glassmorphism" \
     --design-system --persist -p "Fayz Attor"
   ```
3. Chiqqan design systemni **brend ranglariga moslab** `design-system/fayz-attor/MASTER.md`
   ga saqlash. Ranglar logodan olinadi — generator taklif qilgan ranglar emas.
4. Har bir sahifani qurishdan oldin shu MASTER.md ni o'qish.

Skill o'rnatishda xato chiqsa — to'xtash, xabar berish, o'zicha boshqa yo'l bilan
aylanib o'tmaslik.

---

## PHASE 1 — TEXNOLOGIYA STEKI

**Qoida: hammasi JavaScript ekotizimida. TypeScript ishlatilmaydi — faqat `.js` / `.jsx`.
Murakkab abstraksiyalar, microservice, Docker, GraphQL — kerak emas.**

| Qatlam | Tanlov | Sabab |
|---|---|---|
| Framework | **Next.js 15 (App Router), JavaScript** | Frontend + backend bitta joyda, API routes bor |
| Styling | **Tailwind CSS v4** | Tez, responsive, glassmorphism uchun qulay |
| UI komponentlar | **shadcn/ui** | Tayyor, o'zgartirsa bo'ladigan komponentlar |
| Ikonkalar | **lucide-react** | Emoji ishlatilmaydi, hamma joyda SVG ikonka |
| DB | **PostgreSQL (Neon.tech free tier)** | Bepul, serverless, Vercel bilan ideal |
| ORM | **Prisma** | Schema oddiy, migration avtomatik |
| Auth | **o'z JWT** (`jose` + `bcryptjs`, httpOnly cookie) | Telefon+parol uchun NextAuth ortiqcha murakkab |
| Rasm saqlash | **Cloudinary** (free tier) | Avtomatik optimizatsiya, CDN, transformation |
| State (savat) | **Zustand** + localStorage persist | Eng yengil variant |
| Form | **react-hook-form** + **zod** | Validatsiya toza bo'lishi uchun |
| Telegram | **to'g'ridan-to'g'ri Bot API `fetch`** | Kutubxona kerak emas, `sendMessage` yetarli |
| Animatsiya | **framer-motion** (me'yorida) | Premium his, lekin mobil tezlikni buzmasin |
| Til (i18n) | oddiy JSON dictionary + Context | uz / ru / en |
| Deploy | **Vercel** | Next.js uchun eng oson |

Qo'shimcha paket qo'shishdan oldin so'rash shart.

---

## PHASE 2 — BREND IDENTITETI

### Logo

`public/logo.png` — flakon shaklidagi monogramma + "FAYZ" (serif) + "ATTOR" (keng harfli sans).

- Header'da: monogramma + "FAYZ ATTOR" matni, balandligi ~36-40px
- Footer'da: to'liq logo
- Favicon: faqat monogramma
- **Logoni cho'zish, ranglarini o'zgartirish, effekt qo'shish taqiqlanadi**
- Logo atrofida kamida logo balandligining yarmicha bo'sh joy

### Rang palitrasi (logodan olingan — MAJBURIY)

```css
:root {
  /* Asosiy — logo foni */
  --brand-deep:    #0D454E;   /* chuqur petrol-teal, asosiy fon */
  --brand-darker:  #072B32;   /* eng to'q, footer / overlay */
  --brand-mid:     #14626E;   /* o'rta teal, hover / gradient */
  --brand-light:   #2A8A99;   /* ochiq teal, aksent chiziqlar */

  /* Kontrast — logo matni */
  --ivory:         #F5F2EA;   /* issiq oq, asosiy matn to'q fonda */
  --pure-white:    #FFFFFF;

  /* Premium aksent — narx, CTA, chegirma */
  --gold:          #C9A961;
  --gold-light:    #E0C88A;

  /* Yordamchi */
  --success:       #2E9E6B;
  --danger:        #C7503F;
  --muted:         #8FA7AC;
}
```

**Rang ishlatish qoidasi:**

- Asosiy fon: `--brand-deep` yoki undan ochiqroq ivory (sahifaga qarab)
- CTA tugmalar ("Savatga qo'shish", "Buyurtma berish"): `--gold` fon, `--brand-darker` matn
- Narx: `--gold`; eski narx: `--muted` ustidan chizilgan
- Chegirma badge: `--danger` fon, oq matn
- Hech qachon neon, pushti-binafsha gradient, yoki "AI look" ishlatilmaydi

> Eslatma: `--gold` va `--muted` ochiq fonda 4.5:1 dan o'tmaydi. Shuning uchun
> MASTER.md da ochiq-fon uchun hosila tokenlar aniqlangan (`--gold-deep`,
> `--muted-deep`, `--danger-deep`, `--success-deep`). Brend tokenlari o'zgarmagan.

### Tipografika

- Sarlavhalar: **Cormorant Garamond** yoki **Playfair Display** (serif)
- Matn/UI: **Inter** yoki **Manrope** (sans)
- Google Fonts, `next/font` orqali yuklanadi (CLS bo'lmasin)

### Glassmorphism (mijozning aniq talabi)

```css
.glass {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 8px 32px rgba(7, 43, 50, 0.28);
}
```

Qayerda: header (scroll'da), mahsulot kartochkalari hover'da, filtr paneli,
savat drawer, modal, bottom navigation.

**Juda muhim:** `backdrop-filter` arzon Android telefonlarda sekinlashtiradi:

- Bir ekranda 6 tadan ortiq blur elementi bo'lmasin
- Scroll qilinadigan uzun ro'yxatlarda blur ishlatilmaydi — faqat statik elementlarda
- `@media (prefers-reduced-motion)` hurmat qilinadi
- Matn kontrasti **har doim** 4.5:1 dan yuqori

---

## PHASE 3 — MA'LUMOTLAR BAZASI SXEMASI

**Diqqat: narx va mavjudlik hajmga (ml) bog'liq** — 50ml va 10ml bir xil narxda
bo'lmaydi. Shuning uchun `ProductVariant` modeli kerak.

```prisma
model Brand {
  id        String    @id @default(cuid())
  name      String    @unique
  slug      String    @unique
  logoUrl   String?
  sortOrder Int       @default(0)
  isActive  Boolean   @default(true)
  products  Product[]
  createdAt DateTime  @default(now())
}

// Admin o'zi oldindan qo'shadigan hajmlar: 10, 15, 20, 30, 50 ml...
model Size {
  id        String           @id @default(cuid())
  valueMl   Int              @unique
  label     String           // "50 ml"
  sortOrder Int              @default(0)
  isActive  Boolean          @default(true)
  variants  ProductVariant[]
}

enum Gender { MEN WOMEN UNISEX }

model Product {
  id               String           @id @default(cuid())
  name             String
  slug             String           @unique
  shortDescription String?          @db.Text
  description      String?          @db.Text
  gender           Gender
  brandId          String
  brand            Brand            @relation(fields: [brandId], references: [id])
  images           ProductImage[]
  variants         ProductVariant[]
  isActive         Boolean          @default(true)   // false => saytda KO'RINMAYDI
  isFeatured       Boolean          @default(false)
  viewCount        Int              @default(0)
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  @@index([gender, isActive])
  @@index([brandId, isActive])
}

model ProductImage {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String
  publicId  String  // Cloudinary public_id — o'chirish uchun
  sortOrder Int     @default(0)
}

model ProductVariant {
  id              String  @id @default(cuid())
  productId       String
  product         Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  sizeId          String
  size            Size    @relation(fields: [sizeId], references: [id])
  price           Decimal @db.Decimal(12, 2)   // so'mda
  discountPercent Int     @default(0)          // 0-100, ixtiyoriy
  stockQty        Int     @default(0)
  inStock         Boolean @default(true)       // admin qo'lda ham o'chira oladi
  sku             String?

  @@unique([productId, sizeId])
}

model User {
  id           String   @id @default(cuid())
  phone        String   @unique      // +998XXXXXXXXX formatida saqlanadi
  passwordHash String
  fullName     String?
  orders       Order[]
  createdAt    DateTime @default(now())
}

enum OrderStatus { NEW CONFIRMED PACKING DELIVERING COMPLETED CANCELLED }

model Order {
  id            String      @id @default(cuid())
  orderNumber   Int         @unique @default(autoincrement())
  userId        String?
  user          User?       @relation(fields: [userId], references: [id])
  customerName  String
  customerPhone String
  address       String      @db.Text
  comment       String?     @db.Text
  status        OrderStatus @default(NEW)
  totalAmount   Decimal     @db.Decimal(12, 2)
  items         OrderItem[]
  adminNote     String?     @db.Text
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([status, createdAt])
}

// Buyurtma paytidagi narx va nom SAQLANADI — keyin mahsulot o'zgarsa ham chek buzilmaydi
model OrderItem {
  id          String  @id @default(cuid())
  orderId     String
  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  variantId   String?
  productName String
  brandName   String
  sizeLabel   String
  unitPrice   Decimal @db.Decimal(12, 2)
  quantity    Int
  imageUrl    String?
}

model AdminUser {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  role         String   @default("admin")
  createdAt    DateTime @default(now())
}
```

Seed fayl: standart hajmlar (10, 15, 20, 30, 50, 100 ml), 1 ta admin user
(`.env` dan parol), va 3-4 ta demo brend + mahsulot (test uchun).

---

## PHASE 4 — SAYT FUNKSIONALI (foydalanuvchi tomoni)

### 4.1 Bosh sahifa

- Hero: logo + brend shiori, to'q teal gradient fon, nozik animatsiya
- Kategoriyalar: **Ayollar / Erkaklar / Unisex** — 3 ta katta vizual kartochka
- Tanlangan atirlar (`isFeatured`) — gorizontal slider
- Brendlar: logolar qatori (bosilsa shu brend filtrlanadi)
- Nega biz: original mahsulot, tez yetkazib berish, kafolat (3 ta ikonka)
- Footer: kontakt, Telegram, Instagram, ish vaqti

### 4.2 Katalog sahifasi — filtrlash (eng muhim qism)

**Katta filtr (asosiy):** Ayollar / Erkaklar / Unisex
**Kichik filtr:** brend nomlari bo'yicha (checkbox, ko'p tanlash mumkin)
**Qo'shimcha:** hajm (ml), narx oralig'i (slider), faqat chegirmadagilar,
saralash (yangi / arzon / qimmat / ommabop)

Texnik talablar:

- Filtrlar **URL query params** da (`?gender=women&brands=dior,chanel&size=50`) —
  link ulashsa bo'ladi, back tugmasi ishlaydi
- Server-side filtrlash (Prisma `where`) — frontendda emas
- Pagination yoki infinite scroll (mobil uchun infinite scroll yaxshiroq)
- **Mobil:** filtr pastdan chiqadigan bottom sheet (glassmorphism), "Filtr" tugmasi sticky
- **Desktop:** chapda sidebar
- Natija yo'q bo'lsa — chiroyli "topilmadi" holati + filtrni tozalash tugmasi
- Yuklanayotganda skeleton loader (spinner emas)

### 4.3 Mahsulot sahifasi

- Rasm galereyasi: swipe (mobil), thumbnail (desktop), zoom
- Nom, brend (bosiladigan), short description
- **Hajm tanlash** — tugmalar qatori. Tanlanganda narx dinamik o'zgaradi
- Narx: chegirma bo'lsa eski narx chizilgan + yangi narx + `-20%` badge
- Mavjudlik: "Mavjud" / "Tugagan" (tugagan hajmni tanlab bo'lmaydi)
- Miqdor tanlash + "Savatga qo'shish"
- To'liq tavsif (accordion)
- "O'xshash atirlar" — shu brend yoki shu gender'dan

### 4.4 Savat

- Zustand + localStorage (sahifa yangilansa yo'qolmaydi)
- Header'da savat ikonkasida mahsulot soni badge
- Yon tomondan chiqadigan drawer + alohida `/savat` sahifasi
- Miqdorni o'zgartirish, o'chirish, jami summa
- Bo'sh savat holati chiroyli bo'lsin

### 4.5 Ro'yxatdan o'tish / Kirish

**Faqat telefon raqami + foydalanuvchi o'zi tanlagan parol. Email YO'Q. SMS tasdiqlash YO'Q.**

- Telefon formati: `+998 (XX) XXX-XX-XX` mask, bazaga `+998XXXXXXXXX` holda saqlanadi
- Parol: minimum 6 belgi, bcrypt bilan hash (hech qachon ochiq saqlanmaydi)
- JWT httpOnly + secure + sameSite cookie'da, 30 kun
- Middleware himoyalangan route'larni tekshiradi
- Rate limiting: bir IP'dan 5 ta muvaffaqiyatsiz login -> 15 daqiqa blok

> **Eslatma:** SMS tasdiqlash yo'qligi sababli soxta raqam bilan ro'yxatdan o'tish
> mumkin. Hozircha zakazni admin telefon orqali tasdiqlaydi. Lekin zakaz ko'paysa —
> Eskiz.uz yoki Play Mobile orqali SMS OTP qo'shish kerak bo'ladi. Kod shunday
> yoziladi: keyinchalik OTP qadamini qo'shish oson bo'lsin (auth service alohida modul).

### 4.6 Buyurtma berish (checkout)

- Login bo'lmagan user -> avval ro'yxatdan o'tadi
- Forma: ism, telefon (profildan avtomatik), manzil, izoh
- Buyurtma tasdiqlanishi bilan **bir vaqtda**:
  1. Bazaga `Order` + `OrderItem` yoziladi (narxlar nusxalanadi)
  2. Admin panelga tushadi (status `NEW`)
  3. Telegram botga xabar ketadi
- Muvaffaqiyat sahifasi: buyurtma raqami + "operator tez orada aloqaga chiqadi"
- Profil sahifasi: mening buyurtmalarim + statusi

### 4.7 Ko'p tillilik

uz (asosiy) / ru / en. Header'da til almashtirgich. Mahsulot nomlari va tavsiflari
hozircha bitta tilda — UI matnlari tarjima qilinadi. Keyinchalik mahsulot
tarjimasini qo'shish oson bo'lsin.

---

## PHASE 5 — ADMIN PANEL (`/admin`)

Alohida layout, alohida auth (`AdminUser`). Sayt dizaynidan farqli — bu ish quroli:
toza, zich, tez. Glassmorphism bu yerda minimal.

### 5.1 Dashboard

- Bugungi / haftalik / oylik buyurtmalar soni va summasi
- Status bo'yicha buyurtmalar (yangi, yetkazilmoqda, yakunlangan)
- Oxirgi 10 ta buyurtma
- Eng ko'p sotilgan 5 ta atir
- Tugagan mahsulotlar ogohlantirishi

### 5.2 Brendlar — CRUD

- Ro'yxat: logo, nom, mahsulotlar soni, holat
- Qo'shish/tahrirlash: **nom + logo** (rasm yuklash)
- O'chirish: agar brendda mahsulot bo'lsa — ogohlantirish, o'chirishga ruxsat berilmaydi
  (yoki "deaktiv qil" taklif qilinadi)
- Tartibni o'zgartirish (drag-drop yoki sortOrder raqami)

### 5.3 Hajmlar (Sizes) — CRUD

Mijoz o'zi oldindan hajmlarni qo'shadi: 10, 15, 20, 30, 40, 50, 100 ml va h.k.
Keyin atir qo'shishda shu ro'yxatdan tanlanadi.

### 5.4 Atirlar — CRUD

| Maydon | Turi | Majburiy |
|---|---|---|
| Nom | matn | ha |
| Brend | dropdown | ha |
| Jins | Ayollar / Erkaklar / Unisex | ha |
| Short description | qisqa matn | — |
| Description | rich text / textarea | — |
| Rasmlar | **cheksiz**, drag-drop, tartibni o'zgartirish, birinchisi asosiy | ha (min 1) |
| **Hajm variantlari** | har bir qator: hajm + narx + chegirma % + qoldiq + mavjudlik | ha (min 1) |
| Holat (active/inactive) | toggle | ha |
| Tanlangan (featured) | toggle | — |

**Hajm variantlari qismi eng muhim:** admin "+ Hajm qo'shish" bosib, bir atirga bir
nechta hajm qo'sha oladi, har biriga alohida narx va chegirma qo'yadi.

Ro'yxat sahifasi: rasm, nom, brend, jins, narx oralig'i, holat, qidiruv,
brend/jins bo'yicha filtr, ommaviy amallar (bir nechtasini tanlab deaktiv qilish).

### 5.5 Mavjudlik statusi

- `isActive = false` bo'lgan mahsulot **saytda umuman ko'rinmaydi** (katalogda ham,
  qidiruvda ham, to'g'ridan-to'g'ri URL bilan ham -> 404)
- Hamma variantlari `inStock = false` bo'lsa — katalogda "Tugagan" belgisi bilan
  ko'rinadi, lekin savatga qo'shib bo'lmaydi
- Admin bitta joydan tez toggle qila olsin

### 5.6 Buyurtmalar

- Ro'yxat: raqam, mijoz, telefon, summa, status, sana
- Filtr: status, sana oralig'i; qidiruv: telefon yoki buyurtma raqami
- Detal sahifa: barcha mahsulotlar (rasm, hajm, narx, soni), manzil, izoh
- **Status o'zgartirish:** Yangi -> Tasdiqlangan -> Yig'ilmoqda -> Yetkazilmoqda ->
  Yakunlangan / Bekor qilingan
- Admin izohi qo'shish
- Mijoz telefoniga bir bosishda qo'ng'iroq (`tel:` link)
- Excel/CSV eksport

### 5.7 Sozlamalar

Do'kon telefoni, manzili, ish vaqti, ijtimoiy tarmoqlar, Telegram bot token va
chat ID, yetkazib berish narxi/shartlari.

---

## PHASE 6 — TELEGRAM INTEGRATSIYASI

### 6.1 Yangi buyurtma xabari

```
YANGI BUYURTMA #1024

Aziz Karimov
+998 90 123 45 67
Toshkent, Chilonzor 19-kvartal, 45-uy

Mahsulotlar:
- Dior Sauvage (Dior) — 50ml x 1 = 450 000 so'm
- Lattafa Asad (Lattafa) — 30ml x 2 = 240 000 so'm

Jami: 690 000 so'm
13.10.2026, 16:45
```

- Bot API `sendMessage` ga oddiy `fetch` (kutubxona kerak emas)
- Inline tugmalar: Tasdiqlash / Bekor qilish -> callback admin paneldagi statusni
  o'zgartiradi
- **Telegram javob bermasa yoki xato bersa, buyurtma baribir bazaga yozilsin.**
  Telegram xatosi `try/catch` ichida, log qilinadi, lekin zakazni buzmaydi. Juda muhim.
- Token `.env` da: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`

### 6.2 Mini App tayyorgarligi

- `telegram-web-app.js` scriptini shartli yuklash
- `window.Telegram.WebApp` bor-yo'qligini tekshirish -> bor bo'lsa Mini App rejimi
- Mini App'da: Telegram theme ranglariga moslash, `MainButton` ni "Buyurtma berish"
  uchun ishlatish, `BackButton` ni navigatsiyaga ulash
- Telegram header'i bilan to'qnashmasin — `viewportStableHeight` hisobga olinadi
- `safe-area-inset` lar hurmat qilinadi

---

## PHASE 7 — MOBIL VA RESPONSIVE (eng yuqori ustuvorlik)

**Mijozlarning 90%+ telefondan kiradi. Mobile-first — avval 375px uchun, keyin kattalashtir.**

Majburiy tekshiruv nuqtalari: **375px, 414px, 768px, 1024px, 1440px**

- Bosiladigan har qanday element minimum **44x44px**
- Gorizontal scroll **umuman bo'lmasin** (`overflow-x: hidden` bilan yashirish emas —
  sabab topib tuzatiladi)
- Pastda sticky bottom navigation: Bosh sahifa / Katalog / Savat / Profil (glassmorphism)
- Mahsulot grid: mobil 2 ustun, planshet 3, desktop 4
- Rasmlar: `next/image`, lazy loading, WebP, aniq `width/height` (CLS nol bo'lsin)
- Shrift minimum 14px, asosiy matn 16px (iOS'da input 16px dan kichik bo'lsa zoom qiladi)
- Modal/drawer'lar mobil ekranni to'liq egallasin
- Telefon input'da `inputmode="tel"` — raqamli klaviatura chiqsin
- Sekin internet uchun: skeleton loader, progressive rasm yuklash
- Lighthouse mobile: **Performance 85+, Accessibility 95+**

---

## PHASE 8 — XAVFSIZLIK VA SIFAT

- Hamma parollar `bcryptjs` (salt rounds 10+)
- API route'larda `zod` bilan input validatsiya
- Prisma ishlatiladi -> SQL injection yo'q, lekin raw query yozilmaydi
- `/admin/*` middleware bilan himoyalangan, admin bo'lmagan -> 404 (401 emas,
  panel borligini bildirmaslik uchun)
- Rate limiting: login, registratsiya, buyurtma berish
- `.env` hech qachon git'ga tushmasin, `.env.example` yoziladi
- Rasm yuklashda: hajm limiti (5MB), format tekshiruvi (jpg/png/webp)
- Narx hisob-kitobi **faqat serverda** — frontenddan kelgan summaga ishonilmaydi
- Mahsulot mavjudligi buyurtma paytida qayta tekshiriladi

---

## PHASE 9 — ISH TARTIBI

Shu ketma-ketlikda, har bosqich oxirida xabar berib, tasdiq kutiladi:

1. **Setup** — skillar, Next.js, Tailwind, shadcn, Prisma, Neon ulanish, `.env.example`
2. **Baza** — schema, migration, seed
3. **Design system** — ranglar, shriftlar, glass komponentlar, Button/Card/Input,
   logo joylashuvi
4. **Auth** — telefon+parol, JWT, middleware
5. **Admin panel** — brend CRUD -> hajm CRUD -> atir CRUD (rasm yuklash bilan) ->
   buyurtmalar
6. **Sayt** — bosh sahifa -> katalog+filtr -> mahsulot sahifasi
7. **Savat + checkout**
8. **Telegram** — xabar yuborish + inline tugmalar
9. **i18n** — uz/ru/en
10. **Mobil polish + Mini App** — har bir sahifani 375px da tekshirish
11. **Deploy** — Vercel, environment variables, domen

**Har bosqichda:**

- `design-system/fayz-attor/MASTER.md` ni o'qib, unga amal qilish
- ECC'ning `/ecc:plan` va `tdd-workflow` dan foydalanish
- Kod yozib bo'lgach `/code-review` qilish
- Hech qachon tasodifiy kod, `// TODO` qoldirilmaydi
- Commit'lar mazmunli (`feat:`, `fix:`)

---

## 10. ANIQ "QILMA" RO'YXATI

- TypeScript
- Emoji ikonka sifatida (faqat lucide SVG)
- Neon ranglar, pushti-binafsha gradient, "AI look"
- Logoni o'zgartirish/cho'zish
- Lorem ipsum yoki soxta ma'lumot production kodida
- Narxni frontendda hisoblash
- Parolni ochiq saqlash yoki log qilish
- Telegram xatosi tufayli buyurtmani yo'qotish
- Haddan ziyod blur (mobil tezligini o'ldiradi)
- So'ramay yangi katta kutubxona qo'shish

---

## 11. QARORLAR VA KERAKLI MA'LUMOTLAR

Kod yozishdan oldin so'raladi:

1. Neon.tech / Cloudinary / Telegram bot tokenlari
2. Ikkilanish bo'lsa (masalan: to'lov usuli) — so'raladi, taxmin qilinmaydi
3. Domen nomi va yetkazib berish shartlari

**To'lov haqida:** hozircha online to'lov YO'Q. Buyurtma qabul qilinadi -> operator
qo'ng'iroq qiladi -> yetkazib berishda naqd yoki Payme/Click orqali to'lanadi.
Lekin kod shunday yoziladi: keyinchalik Payme/Click/Uzum integratsiyasini qo'shish
oson bo'lsin (to'lov alohida modul, `Order` da `paymentStatus` va `paymentMethod`
maydonlari bo'sh turgan holda tayyor tursin).
