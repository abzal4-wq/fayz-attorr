# AUDIT-002 — chiqib ketgandan keyin eski token ishlayveradi

**Darajasi:** P2 (Security) · **Holati:** ochiq, tuzatish tayyor

Bu yagona ochiq audit topilmasi. Tuzatish **baza migratsiyasini** talab
qiladi, uni esa men bajara olmadim: avtomatik xavfsizlik tekshiruvi
production bazasining sxemasini o'zgartirishni to'xtatdi (ikki marta,
"Production Deploy" sababi bilan). Aylanib o'tmadim — o'rniga tayyor
tuzatishni shu yerga yozib qo'ydim.

---

## Muammo

Sinab tasdiqlangan:

1. Mijoz kirdi → `/api/auth/me` → **200**
2. Cookie nusxasi olindi
3. Mijoz **chiqdi** (`/api/auth/logout`)
4. O'sha eski cookie bilan `/api/auth/me` → **hamon 200**

Sababi: JWT **holatsiz**. Chiqish brauzerdagi cookie'ni o'chiradi,
lekin tokenning o'zi **30 kun** amal qilaveradi. Kimdir tokenni
nusxalab olgan bo'lsa (umumiy kompyuter, qarzga berilgan telefon),
chiqish uni to'xtatmaydi.

**Ta'siri:** o'rtacha. Hujumchi avvaldan tokenga ega bo'lishi kerak.
Lekin panel va profilda mijozlarning telefon raqami, manzili va
buyurtmalari turadi.

---

## Tuzatish

Tokenga versiya raqami qo'shiladi. Chiqishda u bittaga oshadi va eski
tokendagi raqam bazadagisiga mos kelmay qoladi.

`getCurrentUser()` va `getCurrentAdmin()` **allaqachon** bazaga
murojaat qiladi, shuning uchun **qo'shimcha so'rov kerak emas** —
faqat bitta ustun ko'proq o'qiladi.

### 1-qadam: sxema

`prisma/schema.prisma` — ikkala modelga ustun qo'shiladi:

```prisma
model User {
  // ... mavjud maydonlar
  tokenVersion Int      @default(0)
}

model AdminUser {
  // ... mavjud maydonlar
  tokenVersion Int      @default(0)
}
```

### 2-qadam: migratsiya

```bash
npx prisma migrate dev --name token_version
```

Xavfsiz: ikkala jadvalga standart qiymatli (`0`) ustun qo'shiladi,
mavjud ma'lumot o'zgarmaydi, hech kim tizimdan chiqib ketmaydi.

### 3-qadam: tokenga versiyani yozish

`lib/auth/jwt.js`:

```js
export function signUserToken(userId, tokenVersion = 0) {
  return sign({ sub: userId, tv: tokenVersion }, AUD_USER)
}

export function signAdminToken(adminId, role = 'admin', tokenVersion = 0) {
  return sign({ sub: adminId, role, tv: tokenVersion }, AUD_ADMIN)
}
```

### 4-qadam: tekshirish va chiqish

`lib/auth/session.js`:

```js
export async function createUserSession(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokenVersion: true },
  })
  const token = await signUserToken(userId, user?.tokenVersion ?? 0)
  const store = await cookies()
  store.set(USER_COOKIE, token, cookieOptions())
}

export async function getCurrentUser() {
  const store = await cookies()
  const payload = await verifyUserToken(store.get(USER_COOKIE)?.value)
  if (!payload?.sub) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, phone: true, fullName: true, createdAt: true, tokenVersion: true },
  })
  if (!user) return null

  // Chiqishdan keyingi eski token shu yerda to'xtaydi
  if ((payload.tv ?? 0) !== user.tokenVersion) return null

  return user
}

export async function destroyUserSession(userId) {
  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    })
  }
  const store = await cookies()
  store.set(USER_COOKIE, '', { ...cookieOptions(), maxAge: 0 })
}
```

Admin uchun ham aynan shunday (`AdminUser`, `ADMIN_COOKIE`).

### 5-qadam: chiqish yo'llari

`app/api/auth/logout/route.js` va `app/api/admin/auth/logout/route.js`
`destroyUserSession()` ga foydalanuvchi ID sini uzatishi kerak —
hozir u parametrsiz chaqiriladi.

---

## Tekshirish

Migratsiyadan keyin:

```bash
npm run build && npm start &

# 1. Kirish
curl -s -c c.txt -X POST localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+998 90 123 45 67","password":"..."}'
cp c.txt stolen.txt

# 2. Me -> 200 bo'lishi kerak
curl -s -b c.txt localhost:3000/api/auth/me

# 3. Chiqish
curl -s -b c.txt -X POST localhost:3000/api/auth/logout

# 4. ESKI cookie bilan -> endi 401 bo'lishi kerak (avval 200 edi)
curl -s -b stolen.txt localhost:3000/api/auth/me
```

Shuningdek `npm test` o'tishi va admin kirishi ishlashi kerak.

---

## Nega hozircha qilinmadi

Migratsiya production bazasiga tegadi. Tizim buni to'xtatdi va men
to'siqni aylanib o'tishni to'g'ri deb bilmadim — deploy quvuri orqali
qilish ham (`vercel-build` ichida `prisma migrate deploy` bor) aynan
shu amalga olib borardi.

Buni bajarish uchun yo siz yuqoridagi qadamlarni qo'lda qilasiz, yo
`.claude/settings.json` ga Bash ruxsat qoidasi qo'shasiz.
