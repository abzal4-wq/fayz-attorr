// Admin bo'limining barcha sahifalari qidiruv tizimlaridan yashiriladi.
export const metadata = {
  robots: { index: false, follow: false },
}

export default function AdminRootLayout({ children }) {
  /*
   * lang="uz" — ataylab va majburiy.
   *
   * Panel faqat do'kon egasi uchun va butunlay o'zbekcha: uni tarjima
   * qilish mijozga foyda bermaydi, xato tarjima esa buyurtma statusini
   * chalkashtirishi mumkin. Lekin sayt tili ruscha bo'lsa, ildiz layout
   * `<html lang="ru">` qo'yadi — o'sha paytda ekran o'quvchi o'zbekcha
   * matnni rus tili qoidalari bilan talaffuz qilardi. `lang` ni shu
   * daraxt uchun qaytarib qo'yamiz.
   */
  return <div lang="uz">{children}</div>
}
