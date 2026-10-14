import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'
import { getUserId } from '@/lib/auth/session'
import { safeRedirectPath } from '@/lib/safe-redirect'

export const metadata = { title: 'Kirish' }

export default async function LoginPage({ searchParams }) {
  const params = await searchParams
  const redirectTo = safeRedirectPath(params?.keyin)

  // Allaqachon kirgan bo'lsa, kirish sahifasini ko'rsatmaymiz
  if (await getUserId()) redirect(redirectTo)

  return (
    <AuthShell
      title="Kirish"
      subtitle="Telefon raqamingiz va parolingiz bilan kiring."
      footer={
        <>
          Hisobingiz yo'qmi?{' '}
          <Link
            href={`/royxatdan-otish${params?.keyin ? `?keyin=${encodeURIComponent(redirectTo)}` : ''}`}
            className="font-medium text-gold underline-offset-4 hover:underline"
          >
            Ro'yxatdan o'ting
          </Link>
        </>
      }
    >
      <LoginForm redirectTo={redirectTo} />
    </AuthShell>
  )
}
