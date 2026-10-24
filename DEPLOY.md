# Deploy — Vercel + fayzattor.uz

Bu qo'llanma bo'yicha saytni jonli holatga chiqarasiz. Har bir qadamni
tartib bilan bajaring — oldingi qadam tugamasdan keyingisiga o'tmang.

Loyiha deploy'ga tayyor: build toza, migratsiyalar yozilgan, xavfsizlik
sarlavhalari qo'yilgan. Qolgani — sizning hisoblaringiz orqali
bajariladigan ishlar.

---

## 0. Oldindan hal qilinadigan ikki narsa

### Admin paroli

Hozirgi parol — `***`. U 10 ta kichik harfdan iborat va lug'atdagi
so'zlardan tuzilgan. Panel ichida mijozlarning **telefon raqamlari,
manzillari va buyurtmalari** turadi, panel esa deploy'dan keyin ochiq
internetda bo'ladi. Parolni almashtiring.

Kuchli parol yaratish:

```bash
node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))"
```

Natijani `.env` dagi `ADMIN_PASSWORD` ga yozing va **parolni saqlab
qo'ying** — u faqat seed paytida ishlatiladi.

### Demo mahsulotlar

Bazada 4 ta namunaviy atir bor (Dior, Chanel, Lattafa, Armaf) — narxlari
va tavsiflari o'ylab topilgan. Jonli saytda soxta mahsulot turishi
yaxshi emas. Ularni o'chirish:

```bash
node prisma/seed.mjs --clear-demo
```

O'z atirlaringizni admin panelidan qo'shasiz.

---

## 1. Git remote (GitHub)

Hozir loyihada remote yo'q. Vercel'ning avtomatik deploy'i uchun GitHub
repozitoriysi kerak.

```bash
gh repo create fayz-attor --private --source=. --remote=origin
git push -u origin master
```

`gh` o'rnatilmagan bo'lsa, github.com da qo'lda **private** repo yarating,
so'ng:

```bash
git remote add origin https://github.com/<foydalanuvchi>/fayz-attor.git
git push -u origin master
```

> Repo **private** bo'lsin. `.env` git'ga tushmaydi (tekshirilgan), lekin
> repo ochiq bo'lishi uchun sabab yo'q.

---

## 2. Vercel loyihasi

```bash
npx vercel login
npx vercel link
```

Vercel Next.js'ni o'zi taniydi. `vercel.json` da ikkita narsa yozilgan:

- `regions: ["fra1"]` — **buni o'zgartirmang**. Baza Neon'da
  `eu-central-1` (Frankfurt) da turibdi. Vercel'ning sukutdagi regioni
  AQShda; o'sha holda har bir baza so'rovi okean ortiga borib kelardi.
- `framework: "nextjs"`

---

## 3. Environment o'zgaruvchilari

14 ta o'zgaruvchi kerak. Ro'yxat `.env.example` da, qiymatlar `.env` da.

Eng tez yo'li:

```bash
# Har birini Production, Preview va Development uchun qo'shadi
npx vercel env add DATABASE_URL production
# ... va hokazo
```

Yoki Vercel panelida: **Settings → Environment Variables** → qiymatlarni
`.env` dan nusxalang.

| O'zgaruvchi | Izoh |
|---|---|
| `DATABASE_URL` | Neon **pooled** (`-pooler`) — ilova shu bilan ishlaydi |
| `DIRECT_URL` | Neon **unpooled** — faqat migratsiya uchun |
| `JWT_SECRET` | Mijoz sessiyasi |
| `ADMIN_JWT_SECRET` | Admin sessiyasi (alohida bo'lishi shart) |
| `ADMIN_USERNAME` | `fayzattor` |
| `ADMIN_PASSWORD` | **0-bosqichda almashtirgan parolingiz** |
| `CLOUDINARY_CLOUD_NAME` | `nshwom5v` |
| `CLOUDINARY_API_KEY` | |
| `CLOUDINARY_API_SECRET` | |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `CLOUDINARY_CLOUD_NAME` bilan bir xil |
| `TELEGRAM_BOT_TOKEN` | |
| `TELEGRAM_ADMIN_CHAT_IDS` | Vergul bilan ajratilgan |
| `TELEGRAM_WEBHOOK_SECRET` | |
| `NEXT_PUBLIC_SITE_URL` | `https://fayzattor.uz` |

> `NEXT_PUBLIC_` bilan boshlanadiganlar brauzerga ham yuboriladi —
> ularga hech qachon maxfiy qiymat yozmang. Hozirgi ikkitasi xavfsiz
> (cloud nomi va domen).

---

## 4. Birinchi deploy

```bash
npx vercel --prod
```

Vercel `vercel-build` skriptini ishga tushiradi:

```
prisma migrate deploy && next build
```

Ya'ni migratsiyalar deploy paytida avtomatik qo'llanadi. Agar baza
ulanmasa — build yiqiladi va **buzuq sayt chiqmaydi**. Shunday bo'lishi
kerak.

Birinchi deploy'dan keyin admin hisobini yarating:

```bash
node prisma/seed.mjs
```

(Bu `.env` dagi `ADMIN_USERNAME` / `ADMIN_PASSWORD` dan admin yaratadi.
Baza bitta bo'lgani uchun buni lokal mashinadan ishga tushirsa bo'ladi.)

---

## 5. Domen

Vercel panelida: **Settings → Domains → Add** → `fayzattor.uz`.

Vercel ko'rsatadigan DNS yozuvlarini domen registratoringizda qo'ying:

| Tur | Nom | Qiymat |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

> Aniq qiymatlarni Vercel o'zi beradi — yuqoridagilar namuna. DNS
> tarqalishi odatda 10 daqiqadan bir necha soatgacha vaqt oladi.
> HTTPS sertifikatini Vercel avtomatik oladi.

Domen ishlagach `NEXT_PUBLIC_SITE_URL` to'g'riligini tekshiring va
qayta deploy qiling (u `sitemap.xml`, `robots.txt` va Open Graph
havolalarida ishlatiladi).

---

## 6. Telegram webhook

Faqat HTTPS domen ishlagandan keyin:

```bash
npm run tg set https://fayzattor.uz
npm run tg info
```

`info` quyidagilarni ko'rsatishi kerak:

- `url: https://fayzattor.uz/api/telegram/webhook`
- `pending_update_count: 0`
- `last_error_message` — bo'sh

### Ikkala admin botga `/start` bosishi SHART

Telegram botga hech qachon yozmagan odamga xabar yubora olmaydi. Hozir
hech kim `/start` bosmagan — ya'ni buyurtma kelganda **xabar hech kimga
bormaydi**.

Har ikkala admin [@fayzattor_bot](https://t.me/fayzattor_bot) ga kirib
`/start` bossin, so'ng:

```bash
npm run tg chats
```

Bu haqiqiy chat ID larni ko'rsatadi. Agar ular `.env` dagi
`TELEGRAM_ADMIN_CHAT_IDS` (`5580646720,726130790`) bilan mos kelmasa —
Vercel'dagi qiymatni to'g'rilang va qayta deploy qiling.

---

## 7. Deploy'dan keyingi tekshiruv

```bash
AUDIT_BASE=https://fayzattor.uz npm run audit -- --all
AUDIT_BASE=https://fayzattor.uz npm run lh
```

Qo'lda tekshiriladiganlar:

- [ ] Bosh sahifa ochiladi, atirlar ko'rinadi
- [ ] Til almashtirgich: uz / ru / en
- [ ] `/admin` → **404** (kirmagan holda)
- [ ] `/admin/kirish` → ochiladi, yangi parol bilan kiriladi
- [ ] Admin paneldan atir qo'shib ko'ring — saytda **darhol** chiqsin
- [ ] Rasm yuklash ishlaydi (Cloudinary)
- [ ] Haqiqiy buyurtma bering → Telegram'ga xabar kelsin
- [ ] Xabardagi `✅ Tasdiqlash` tugmasi status va qoldiqni o'zgartirsin
- [ ] Telegram'da sayt havolasini yuboring — preview ko'rinsin
- [ ] `https://fayzattor.uz/robots.txt` va `/sitemap.xml` ochilsin

---

## 8. Keyinroq

- **Google Search Console** ga domenni qo'shing va `sitemap.xml` ni
  yuboring.
- **Neon backup**: bepul tarifda `point-in-time restore` cheklangan.
  Buyurtmalar kela boshlagach tarifni ko'rib chiqing.
- **To'lov tizimi** (Click/Payme) hali ulanmagan. Baza tayyor:
  `Order.paymentStatus` va `paymentMethod` maydonlari turibdi.
- `npm audit` da 7 ta zaiflik qoladi (kritik emas). Ularning
  ko'pchiligi Prisma CLI zanjirida va `postcss` da; to'liq yopish uchun
  Next 16 ga o'tish kerak — bu alohida ish.
