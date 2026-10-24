import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/auth/auth-shell'
import { RegisterForm } from '@/components/auth/register-form'
import { getUserId } from '@/lib/auth/session'
import { safeRedirectPath } from '@/lib/safe-redirect'
import { getT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const t = await getT()
  return { title: t('meta.registerTitle') }
}

export default async function RegisterPage({ searchParams }) {
  const [params, t] = await Promise.all([searchParams, getT()])
  const redirectTo = safeRedirectPath(params?.keyin)

  if (await getUserId()) redirect(redirectTo)

  return (
    <AuthShell
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      footer={
        <>
          {t('auth.hasAccount')}{' '}
          <Link
            href={`/kirish${params?.keyin ? `?keyin=${encodeURIComponent(redirectTo)}` : ''}`}
            className="inline-block py-2.5 font-medium text-gold underline-offset-4 hover:underline"
          >
            {t('auth.goLogin')}
          </Link>
        </>
      }
    >
      <RegisterForm redirectTo={redirectTo} />
    </AuthShell>
  )
}
