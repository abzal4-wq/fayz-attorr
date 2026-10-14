import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/auth/logout-button'
import { getCurrentUser } from '@/lib/auth/session'
import { formatPhone } from '@/lib/auth/phone'

export const metadata = { title: 'Profil' }

export default async function ProfilePage() {
  const user = await getCurrentUser()

  // Middleware tokenni tekshiradi; bu yerda foydalanuvchi hali
  // bazada mavjudligiga ishonch hosil qilamiz.
  if (!user) redirect('/kirish?keyin=/profil')

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-serif text-2xl text-foreground">Profil</h1>
          <LogoutButton />
        </div>

        <dl className="mt-8 divide-y divide-border rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between gap-4 p-4">
            <dt className="text-sm text-muted-foreground">Ism</dt>
            <dd className="text-card-foreground">{user.fullName || '—'}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 p-4">
            <dt className="text-sm text-muted-foreground">Telefon</dt>
            <dd className="text-card-foreground">{formatPhone(user.phone)}</dd>
          </div>
        </dl>
      </div>
    </main>
  )
}
