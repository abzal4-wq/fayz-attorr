/**
 * Ma'lumot keshining umri.
 *
 * NEGA KERAK: til cookie'da saqlanadi, ya'ni sahifa HTML'i har bir
 * so'rovda qayta render bo'ladi (cookie o'qilgan sahifani Next build
 * paytida muzlatib qo'ya olmaydi). Agar baza so'rovlari ham har
 * ochilishda takrorlansa, bosh sahifa Neon'ga 4 marta murojaat qiladi.
 *
 * Shuning uchun kesh HTML darajasidan MA'LUMOT darajasiga tushirildi:
 * HTML har safar yangi (va to'g'ri tilda), baza so'rovlari esa 60
 * soniyada bir marta. Admin o'zgartirishi ham xuddi shu bir daqiqa
 * ichida chiqadi — avvalgi ISR bilan bir xil.
 */
export const CACHE_SECONDS = 60
