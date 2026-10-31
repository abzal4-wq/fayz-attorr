/**
 * Sayt sahifalari yuklanayotganda (umumiy).
 *
 * NEGA KERAK: sahifalar dinamik (til cookie'da), ya'ni har o'tish serverga
 * boradi. Foydalanuvchi tarmog'ida so'rov O'zbekiston -> Gonkong (Vercel
 * kirish nuqtasi) -> Frankfurt (server) yo'lini bosib o'tadi: o'lchangan
 * 1-3 soniya. loading.js bo'lmaganida havola bosilgach shu vaqt davomida
 * ekran o'zgarmasdi — "qotib qoldi", "tugma ishlamayapti" deb qabul
 * qilinardi (sekin tarmoq taqlidida: 786ms hech narsa).
 *
 * Next bu skeletni OLDINDAN yuklab qo'yadi (ko'rinib turgan havolalar
 * uchun), shuning uchun bosilgan zahoti chiqadi.
 *
 * Header, footer va pastki menyu layout'da — ular joyida qoladi, faqat
 * asosiy qism almashadi.
 */
export default function SiteLoading() {
  return (
    <main className="pb-8 md:pb-16" aria-busy="true">
      <div className="mx-auto max-w-[1280px] space-y-4 px-4 py-4 sm:px-6 md:py-6">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-4 w-64 max-w-full rounded" />
        <div className="skeleton h-64 w-full rounded-xl" />
        <div className="skeleton h-24 w-full rounded-xl" />
      </div>
    </main>
  )
}
