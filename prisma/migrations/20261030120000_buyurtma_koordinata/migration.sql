-- Buyurtma manzilining xaritadagi nuqtasi (ixtiyoriy).
--
-- Ikkala ustun ham NULL bo'lishi mumkin: eski buyurtmalarda koordinata
-- yo'q, mijoz xaritani ishlatmasligi ham mumkin. Matnli manzil esa
-- avvalgidek majburiy. Mavjud qatorlarga tegilmaydi.

ALTER TABLE "Order" ADD COLUMN "latitude" DOUBLE PRECISION;

ALTER TABLE "Order" ADD COLUMN "longitude" DOUBLE PRECISION;
