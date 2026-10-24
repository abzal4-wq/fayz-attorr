import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'
import { getUserId } from '@/lib/auth/session'
import { safeRedirectPath } from '@/lib/safe-redirect'
import { getT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const t = await getT()
  return { title: t('meta.loginTitle') }
}

export default async function LoginPage({ searchParams }) {
  const [params, t] = await Promise.all([searchParams, getT()])
  const redirectTo = safeRedirectPath(params?.keyin)

  // Allaqachon kirgan bo'lsa, kirish sahifasini ko'rsatmaymiz
  if (await getUserId()) redirect(redirectTo)

  return (
    <AuthShell
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link
            href={`/royxatdan-otish${params?.keyin ? `?keyin=${encodeURIComponent(redirectTo)}` : ''}`}
            className="font-medium text-gold underline-offset-4 hover:underline"
          >
            {t('auth.goRegister')}
          </Link>
        </>
      }
    >
      <LoginForm redirectTo={redirectTo} />
    </AuthShell>
  )
}
