-- Parolni telefon raqami orqali tiklash.
--
-- Raqam egasi Telegram orqali tasdiqlanadi, keyin 6 xonali kod
-- beriladi. Ikkala sir ham faqat hash ko'rinishida saqlanadi.

CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "codeHash" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "chatId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- Bir havola — bir urinish.
CREATE UNIQUE INDEX "PasswordResetToken_requestHash_key" ON "PasswordResetToken"("requestHash");

CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- Muddati o'tganlarni tozalash uchun.
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- Foydalanuvchi o'chirilsa, uning tiklash tokenlari ham o'chadi.
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
