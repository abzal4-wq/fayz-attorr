import { redirect } from 'next/navigation'
import { AdminLoginForm } from '@/components/auth/admin-login-form'
import { getCurrentAdmin } from '@/lib/auth/session'

export const metadata = {
  title: 'Boshqaruv',
  // Qidiruv tizimlari indekslamasin
  robots: { index: false, follow: false },
}

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect('/admin')

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-md sm:p-8">
        <h1 className="font-serif text-2xl text-card-foreground">Boshqaruv paneli</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Davom etish uchun tizimga kiring.
        </p>

        <div className="mt-6">
          <AdminLoginForm />
        </div>
      </div>
    </main>
  )
}
