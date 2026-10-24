# Fayz Attor

Ko'p brendli atir do'koni — O'zbekiston uchun. Next.js App Router, uch
til (uz / ru / en), Telegram orqali buyurtma bildirishnomasi va Mini App.

Trafikning katta qismi telefondan keladi, shuning uchun loyiha mobil
qurilmani birinchi o'ringa qo'yadi: har bir sahifa 375px dan boshlab
haqiqiy brauzerda o'lchanadi.

---

## Nimalardan tuzilgan

| Qatlam | Tanlov |
|---|---|
| Framework | Next.js 15 (App Router), **JavaScript** — TypeScript ishlatilmaydi |
| Uslub | Tailwind CSS v4, shadcn/ui, lucide-react |
| Baza | PostgreSQL (Neon) + Prisma 7, `@prisma/adapter-pg` |
| Auth | O'z yechimi: `jose` (JWT) + `bcryptjs`, httpOnly cookie |
| Rasmlar | Cloudinary (imzolangan to'g'ridan-to'g'ri yuklash) |
| Savat | Zustand + localStorage |
| Forma | react-hook-form + zod |
| Bildirishnoma | Telegram Bot API (to'g'ridan-to'g'ri `fetch`) |
| Deploy | Vercel (`fra1` — baza Frankfurtda) |

---

## Ishga tushirish

```bash
npm install
cp .env.example .env     # qiymatlarni to'ldiring
npx prisma migrate deploy
node prisma/seed.mjs     # admin + hajmlar
npm run dev
```

Namunaviy atirlar kerak bo'lsa: `node prisma/seed.mjs --demo`
(keyin `--clear-demo` bilan tozalanadi).

### Environment

14 ta o'zgaruvchi, ro'yxati `.env.example` da. Eng muhimlari:

- `DATABASE_URL` — Neon **pooled** (`-pooler`), ilova shuni ishlatadi
- `DIRECT_URL` — Neon **unpooled**, faqat migratsiya uchun
- `JWT_SECRET` va `ADMIN_JWT_SECRET` — **alohida** bo'lishi shart

---

## Buyruqlar

| Buyruq | Vazifasi |
|---|---|
| `npm run dev` | Ishlab chiqish serveri |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run i18n` | Uch lug'atning kalitlari mos kelishini tekshiradi |
| `npm run audit` | Brauzerda: scroll, 44px tugmalar, a11y (`-- --all`, `--shot`) |
| `npm run miniapp` | Telegram Mini App integratsiyasi testi |
| `npm run lh` | Lighthouse (mobil) |
| `npm run tg` | Telegram webhook: `info \| set \| delete \| chats` |
| `node prisma/seed.mjs` | Admin, hajmlar va do'kon sozlamalari |

Audit buyruqlari ishlayotgan serverga ulanadi:

```bash
npm run build && npm start &
AUDIT_BASE=http://127.0.0.1:3000 npm run audit -- --all
```

---

## Tuzilish

```
app/
  (site)/        mijoz uchun sahifalar
  admin/         boshqaruv paneli (alohida auth, o'zbekcha)
  api/           route handler'lar
lib/
  i18n/          lug'atlar va tarjimon (server + client)
  auth/          JWT, parol, rate limit
  catalog.js     mahsulot so'rovlari (60s kesh)
  orders.js      buyurtma yaratish, narx SERVERDA hisoblanadi
prisma/          schema, migratsiyalar, seed
scripts/         audit, i18n, telegram vositalari
design-system/   MASTER.md — ranglar, kontrast, mobil qoidalar
```

---

## Bilib qo'yish kerak bo'lgan qarorlar

**Narx hech qachon brauzerdan olinmaydi.** Mijoz faqat `variantId` va
sonini yuboradi; nom, narx va mavjudlik bazadan olinadi, jami serverda
hisoblanadi (`lib/orders.js`). Qoldiq buyurtma paytida qayta
tekshiriladi va tranzaksiya ichida kamayadi.

**Til URL'da emas, cookie'da.** `/katalog` uch tilda ham bir xil
manzil — havolani ulashganda til almashib ketmaydi. Buning evaziga
sahifalar dinamik render bo'ladi, shuning uchun kesh HTML darajasidan
ma'lumot darajasiga tushirilgan (`lib/cache.js`, 60 soniya).

**Admin paneli ataylab o'zbekcha** va `/admin` kirmagan odamga **404**
qaytaradi (401 emas) — panel mavjudligi bilinmasligi uchun.

**Shisha effekti to'q bo'lishi shart.** Ochiq fon ustida oq parda
matnni ko'rinmas qiladi; sabab va o'lchovlar `app/globals.css` dagi
izohda.

---

## Deploy

`DEPLOY.md` — bosqichma-bosqich: GitHub, Vercel, environment,
domen, Telegram webhook va deploy'dan keyingi tekshiruv ro'yxati.

---

© Fayz Attor. Barcha huquqlar himoyalangan.
