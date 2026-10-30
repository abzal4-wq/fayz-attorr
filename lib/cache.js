/**
 * Ma'lumot keshining umri: 1 soat.
 *
 * NEGA KESH KERAK: til cookie'da saqlanadi, ya'ni sahifa HTML'i har bir
 * so'rovda qayta render bo'ladi. Agar baza so'rovlari ham har ochilishda
 * takrorlansa, har sahifa Neon'ga bir necha marta murojaat qiladi.
 * Shuning uchun kesh HTML darajasidan MA'LUMOT darajasiga tushirilgan.
 *
 * NEGA 1 SOAT (avval 60 soniya edi):
 *
 *  1. Neon bepul tarifi 5 daqiqa ishlatilmagan bazani uxlatadi. Uxlab
 *     yotgan bazaga birinchi murojaat 2-3 soniya (foydalanuvchi
 *     tarmog'idan o'lchanganda 12-23 soniyagacha) kutadi. Kesh qancha
 *     uzoq yashasa, ommaviy sahifalar bazani shuncha kam uyg'otadi —
 *     mijoz kutmaydi va bepul hisoblash soatlari tejaladi.
 *
 *  2. Muddat tugaganda ham mijoz KUTMAYDI: unstable_cache eski qiymatni
 *     darhol qaytaradi va yangisini fonda oladi (stale-while-revalidate).
 *
 *  3. Eskirgan ma'lumot xavfi yo'q, chunki keshni vaqt emas, O'ZGARISH
 *     tozalaydi (lib/revalidate.js): admin atir/brend/hajm/sozlamani
 *     o'zgartirganda va buyurtma qoldiqni o'zgartirganda (lib/orders.js)
 *     kesh darhol bo'shatiladi. 1 soat — biror yo'l esdan chiqqan
 *     taqdirdagi zaxira.
 *
 * Narx va qoldiq baribir buyurtmada SERVERDA qayta tekshiriladi —
 * keshdagi ma'lumot faqat ko'rsatish uchun.
 */
export const CACHE_SECONDS = 60 * 60
