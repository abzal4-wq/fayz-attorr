'use client'

import { useEffect } from 'react'

/**
 * Eng oxirgi himoya chegarasi: ildiz layout'ning O'ZI yiqilganda.
 *
 * Bu holatda `app/layout.js` render bo'lmaydi, demak shrift, tarjima
 * va umumiy uslublar yo'q. Shuning uchun bu yerda:
 *  - o'z `<html>` va `<body>` teglari bo'lishi SHART
 *  - matn faqat o'zbekcha (tarjimon provider'i mavjud emas)
 *  - uslub inline (globals.css yuklanmagan bo'lishi mumkin)
 *
 * Amalda bu sahifa deyarli hech qachon ko'rinmaydi — lekin ko'ringanda
 * mijoz oq ekran emas, tushunarli xabar ko'radi.
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Ildiz layout xatosi:', error?.digest ?? '', error?.message)
  }, [error])

  return (
    <html lang="uz">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem 1rem',
          textAlign: 'center',
          background: '#0D454E',
          color: '#F5F2EA',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
          Nimadir noto&apos;g&apos;ri ketdi
        </h1>

        <p style={{ margin: 0, maxWidth: '32rem', color: '#B4C6CA', lineHeight: 1.6 }}>
          Saytni ochishda kutilmagan xatolik yuz berdi. Qayta urinib
          ko&apos;ring — muammo takrorlansa, birozdan keyin kiring.
        </p>

        <button
          type="button"
          onClick={reset}
          style={{
            minHeight: '48px',
            padding: '0 1.5rem',
            marginTop: '0.5rem',
            border: 'none',
            borderRadius: '8px',
            background: '#C9A961',
            color: '#072B32',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Qayta urinish
        </button>

        {error?.digest ? (
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#B4C6CA', fontFamily: 'monospace' }}>
            {error.digest}
          </p>
        ) : null}
      </body>
    </html>
  )
}
