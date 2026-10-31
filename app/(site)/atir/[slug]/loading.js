/**
 * Atir sahifasi yuklanayotganda.
 *
 * Haqiqiy sahifa joylashuviga mos (atir/[slug]/page.js): yo'l ko'rsatkich,
 * kvadrat rasm, nom, narx va tugma. O'lchamlar mos bo'lmasa kontent
 * kelganda sahifa sakrardi (CLS). Nega umuman kerak — (site)/loading.js.
 */
export default function ProductLoading() {
  return (
    <main className="pb-8 md:pb-16" aria-busy="true">
      <div className="mx-auto max-w-[1280px] px-4 py-4 sm:px-6 md:py-6">
        <div className="mb-2 flex min-h-11 items-center gap-2 md:mb-5">
          <div className="skeleton h-4 w-16 rounded" />
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-4 w-28 rounded" />
        </div>

        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
          <div className="skeleton aspect-square w-full rounded-xl" />

          <div>
            <div className="skeleton h-4 w-20 rounded" />
            <div className="skeleton mt-3 h-9 w-3/4 rounded" />
            <div className="skeleton mt-4 h-4 w-full rounded" />
            <div className="skeleton mt-2 h-4 w-2/3 rounded" />

            <div className="mt-7 flex gap-2">
              <div className="skeleton h-11 w-20 rounded-lg" />
              <div className="skeleton h-11 w-20 rounded-lg" />
            </div>
            <div className="skeleton mt-5 h-8 w-40 rounded" />
            <div className="skeleton mt-5 h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </main>
  )
}
