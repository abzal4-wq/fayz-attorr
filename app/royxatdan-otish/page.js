import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/auth/auth-shell'
import { RegisterForm } from '@/components/auth/register-form'
import { getUserId } from '@/lib/auth/session'
import { safeRedirectPath } from '@/lib/safe-redirect'

export const metadata = { title: "Ro'yxatdan o'tish" }

export default async function RegisterPage({ searchParams }) {
  const params = await searchParams
  const redirectTo = safeRedirectPath(params?.keyin)

  if (await getUserId()) redirect(redirectTo)

  return (
    <AuthShell
      title="Ro'yxatdan o'tish"
      subtitle="Buyurtma berish uchun telefon raqamingizni qoldiring."
      footer={
        <>
          Hisobingiz bormi?{' '}
          <Link
            href={`/kirish${params?.keyin ? `?keyin=${encodeURIComponent(redirectTo)}` : ''}`}
            className="font-medium text-gold underline-offset-4 hover:underline"
          >
            Kiring
          </Link>
        </>
      }
    >
      <RegisterForm redirectTo={redirectTo} />
    </AuthShell>
  )
}
