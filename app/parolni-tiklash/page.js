import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/auth/auth-shell'
import { ResetForm } from '@/components/auth/reset-form'
import { getUserId } from '@/lib/auth/session'
import { getT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const t = await getT()
  // Tiklash sahifasi qidiruvda chiqishi kerak emas
  return { title: t('meta.resetTitle'), robots: { index: false, follow: false } }
}

export default async function ResetPasswordPage() {
  const t = await getT()

  // Allaqachon kirgan bo'lsa tiklash keraksiz
  if (await getUserId()) redirect('/profil')

  return (
    <AuthShell
      title={t('auth.resetTitle')}
      subtitle={t('auth.resetSubtitle')}
      footer={
        <>
          {t('auth.hasAccount')}{' '}
          <Link
            href="/kirish"
            className="inline-block py-2.5 font-medium text-gold underline-offset-4 hover:underline"
          >
            {t('auth.goLogin')}
          </Link>
        </>
      }
    >
      <ResetForm />
    </AuthShell>
  )
}
