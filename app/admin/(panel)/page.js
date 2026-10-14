import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/auth/logout-button'
import { getCurrentAdmin } from '@/lib/auth/session'

export const metadata = {
  title: 'Boshqaruv paneli',
  robots: { index: false, follow: false },
}

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin()

  // Middleware allaqachon tekshiradi; bu ikkinchi qatlam himoya —
  // token haqiqiy, lekin admin bazadan o'chirilgan bo'lishi mumkin.
  if (!admin) redirect('/admin/kirish')

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl text-foreground">Boshqaruv paneli</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {admin.username}
            </p>
          </div>
          <LogoutButton variant="admin" />
        </div>
      </div>
    </main>
  )
}
