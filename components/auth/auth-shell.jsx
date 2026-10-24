import Image from 'next/image'
import Link from 'next/link'

/**
 * Kirish / ro'yxatdan o'tish sahifalari uchun umumiy ko'rinish.
 * To'q teal fon + bitta shisha kartochka (ekranda yagona blur elementi).
 */
export function AuthShell({ title, subtitle, children, footer }) {
  // Gradient alohida `-z-10` qatlam emas, `<main>`ning o'z foni —
  // nega aynan shunday, app/(site)/page.js dagi izohda yozilgan.
  return (
    <main
      className="dark flex min-h-app flex-col items-center justify-center bg-background px-4 py-10"
      style={{
        backgroundImage:
          'linear-gradient(160deg, #0D454E 0%, #0A3942 55%, #072B32 100%)',
      }}
    >

      <Link href="/" className="mb-8 inline-flex flex-col items-center gap-3">
        <Image
          src="/monogram.png"
          alt="Fayz Attor"
          width={200}
          height={200}
          priority
          className="h-14 w-14 rounded-xl"
        />
        <span className="text-xs uppercase tracking-[0.18em] text-muted-on-dark">
          Fayz Attor
        </span>
      </Link>

      <div className="glass w-full max-w-sm rounded-2xl p-6 sm:p-8">
        <h1 className="font-serif text-2xl text-ivory">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-muted-on-dark">{subtitle}</p>
        ) : null}

        <div className="mt-6">{children}</div>
      </div>

      {footer ? (
        <div className="mt-6 text-sm text-muted-on-dark">{footer}</div>
      ) : null}
    </main>
  )
}
