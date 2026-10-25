# Deploy — Vercel + fayzattor.uz

Bu qo'llanma bo'yicha saytni jonli holatga chiqarasiz. Har bir qadamni
tartib bilan bajaring — oldingi qadam tugamasdan keyingisiga o'tmang.

Loyiha deploy'ga tayyor: build toza, migratsiyalar yozilgan, xavfsizlik
sarlavhalari qo'yilgan. Qolgani — sizning hisoblaringiz orqali
bajariladigan ishlar.

---

## 0. Bajarilgan tayyorgarlik

Quyidagilar allaqachon qilingan — bilib qo'yishingiz uchun:

### Admin paroli almashtirildi

Eski parol kuchsiz edi: 10 ta kichik harf, lug'atdagi so'zlardan
tuzilgan. Yangi parol — 24 belgi, ~139 bit entropiya — **`.env`
faylidagi `ADMIN_PASSWORD`** da turibdi. Bazaga ham qo'llangan:
eski parol endi 401 qaytaradi.

> Parolni `.env` dan nusxalab, xavfsiz joyda saqlang. Vercel'ga ham
> aynan shu qiymatni kiritasiz. `.env` git'ga tushmaydi.

Keyinchalik almashtirmoqchi bo'lsangiz: `.env` dagi `ADMIN_PASSWORD`
ni o'zgartiring va `node prisma/seed.mjs` ni ishga tushiring — seed
endi mavjud adminning parolini ham yangilaydi.

### Demo mahsulotlar o'chirildi

Bazada 0 ta atir va 0 ta brend. 6 ta hajm (10–100 ml) qoldirildi —
ular ishingizga yaraydi. Atirlar va brendlarni admin paneldan
qo'shasiz.

Sayt bo'sh katalog bilan ham to'g'ri ko'rinadi (tekshirilgan,
CLS 0).

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

## Region haqida muhim eslatma

`vercel.json` dagi `"regions": ["fra1"]` **o'zi yetarli emas**. Bir
marta shunday deb o'ylab, deploy'dan keyin logda funksiya `hkg1`
(Gonkong) da ishlayotganini ko'rdik — loyihaning o'z sozlamasi
(`iad1`) ustun kelgan ekan.

Haqiqiy sozlama: **Vercel → Settings → Functions → Region = `fra1`**.
Hozir shunday qo'yilgan. Tekshirish: javobdagi `X-Vercel-Id`
`hkg1::fra1::...` ko'rinishida bo'lsin — ikkinchi qism bajarilish
regioni.

`fra1` tanlangan, chunki Neon bazasi `eu-central-1` (Frankfurt) da.

> `vercel.json` ga **izoh qo'shib bo'lmaydi**: Vercel begona kalitlarni
> rad etadi va deploy `Schema verification failed` bilan yiqiladi.
> (Shu xato bir marta ketma-ket uchta deploy'ni buzgan.)

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

Admin hisobi va hajmlar bazada allaqachon bor (baza bitta — lokal va
Vercel bir xil Neon'ga ulanadi), shuning uchun deploy'dan keyin seed
qayta ishga tushirish shart emas.

> **Build Google Fonts sababli yiqilishi mumkin.** `next/font`
> build paytida shriftlarni Google'dan yuklab oladi va bu so'rov
> ba'zan uzilib qoladi (xato: `An error occurred in next/font`).
> Bu kod xatosi emas — Vercel'da **Redeploy** bosing, odatda ikkinchi
> urinishda o'tadi.

---

## 5. Domen

Loyiha Vercel'da: **https://fayz-attor.vercel.app**
(`kaster-uz/fayz-attor`, region `fra1`)

### fayzattor.uz hali RO'YXATDAN O'TMAGAN

Tekshirildi: Google DNS ham, `.uz` registratorining o'z serveri
(`ns1.uz`) ham domenni topmadi. Ya'ni uni avval **sotib olish** kerak
(masalan ahost.uz, uzinfocom.uz yoki boshqa `.uz` registratoridan).

Domen Vercel loyihasiga allaqachon qo'shib qo'yilgan — sotib olgach
faqat DNS yozuvlarini qo'yasiz, boshqa hech narsa kerak emas.

### Sotib olgach qo'yiladigan DNS yozuvlari

| Tur | Nom | Qiymat |
|---|---|---|
| A | `@` | `216.198.79.1` |
| A | `@` | `64.29.17.1` |
| CNAME | `www` | `13e84f1fafa073b6.vercel-dns-017.com` |

Registrator ikkita A yozuvini qo'llab-quvvatlamasa, bittasi ham
yetarli. Eski muqobil: A `@` → `76.76.21.21`.

DNS tarqalishi 10 daqiqadan bir necha soatgacha. HTTPS sertifikatini
Vercel avtomatik oladi.

Tekshirish: `npx vercel domains inspect fayzattor.uz`

### Sayt hozir hammaga ochiq emas

Vercel loyihada **Deployment Protection** yoqilgan
(`all_except_custom_domains`): `.vercel.app` manzili Vercel hisobiga
kirishni talab qiladi, custom domen esa ochiq bo'ladi.

Ya'ni `fayzattor.uz` ulangach sayt o'z-o'zidan ommaga ochiladi.

Agar domen kelgunicha saytni odamlarga ko'rsatmoqchi bo'lsangiz:
**Vercel → loyiha → Settings → Deployment Protection → Vercel
Authentication → Disabled**.

### NEXT_PUBLIC_SITE_URL hozir vaqtinchalik qiymatda

Domen tayyor bo'lmagani uchun u `https://fayz-attor.vercel.app` ga
qo'yilgan. Bu o'zgaruvchi `sitemap.xml`, `robots.txt` va Open Graph
havolalarida ishlatiladi — `fayzattor.uz` da qolsa, qidiruv robotlari
mavjud bo'lmagan manzilga yo'naltirilardi.

**Domen ishga tushgach** uni albatta qaytaring:

```bash
npx vercel env rm NEXT_PUBLIC_SITE_URL production --yes
echo -n "https://fayzattor.uz" | npx vercel env add NEXT_PUBLIC_SITE_URL production
npx vercel --prod
```

> `NEXT_PUBLIC_` o'zgaruvchilari build paytida kodga yoziladi,
> shuning uchun o'zgartirgandan keyin **qayta deploy shart**.

## 6. Telegram webhook

> **Tartib muhim.** `chats` buyrug'i webhook o'rnatilgandan keyin
> ishlamaydi: Telegram bir vaqtda yo webhook, yo `getUpdates` beradi,
> ikkalasini emas. Shuning uchun avval chat ID lar, keyin webhook.

### 1-qadam: ikkala admin botga `/start` bossin

Telegram botga hech qachon yozmagan odamga xabar yubora olmaydi.
`/start` bosilmasa, buyurtma kelganda **xabar hech kimga bormaydi** —
bu eng ko'p uchraydigan nosozlik.

Har ikkala admin [@fayzattor_bot](https://t.me/fayzattor_bot) ga kirib
`/start` bossin.

### 2-qadam: haqiqiy chat ID larni oling

```bash
npm run tg chats
```

Chiqqan raqamlarni `.env` dagi `TELEGRAM_ADMIN_CHAT_IDS`
(`5580646720,726130790`) bilan solishtiring. Mos kelmasa — Vercel'dagi
qiymatni to'g'rilab, qayta deploy qiling.

### 3-qadam: webhook

```bash
npm run tg set https://fayz-attor.vercel.app
npm run tg info
```

Domen ishga tushgach `set` ni yangi manzil bilan qayta bajaring.

`info` quyidagilarni ko'rsatishi kerak:

- `url: .../api/telegram/webhook`
- `pending_update_count: 0`
- `last_error_message` — bo'sh

### Webhook'ni vaqtincha o'chirish kerak bo'lsa

```bash
npm run tg delete
```

(masalan `chats` ni qayta ishlatish uchun)

---

## 7. Deploy'dan keyingi tekshiruv

```bash
AUDIT_BASE=https://fayzattor.uz npm run audit -- --all
AUDIT_BASE=https://fayzattor.uz npm run lh
```

Atir qo'shgandan keyin mahsulot sahifasini ham tekshirish uchun:

```bash
AUDIT_BASE=https://fayzattor.uz AUDIT_PRODUCT=/atir/<slug> npm run audit
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
