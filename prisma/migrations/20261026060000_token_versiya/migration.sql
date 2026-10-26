-- Sessiyani bekor qilish imkoni (AUDIT-002).
--
-- JWT holatsiz: chiqish faqat brauzerdagi cookie'ni o'chiradi, token
-- esa 30 kun amal qilaveradi. Tokenga versiya raqami qo'shiladi va
-- chiqishda u bittaga oshadi — eski token darhol kuchini yo'qotadi.
--
-- DEFAULT 0 bilan qo'shiladi, mavjud tokenlarda esa `tv` maydoni yo'q
-- va u 0 deb o'qiladi. Shuning uchun migratsiyadan keyin hech kim
-- tizimdan chiqib ketmaydi.

ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "AdminUser" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
