import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AdminMobileNav, AdminSidebar } from '@/components/admin/admin-nav'
import { LogoutButton } from '@/components/auth/logout-button'
import { getCurrentAdmin } from '@/lib/auth/session'

export default async function AdminPanelLayout({ children }) {
  const admin = await getCurrentAdmin()

  // Middleware tokenni tekshiradi. Bu ikkinchi qatlam: token haqiqiy
  // bo'lsa ham, admin hisobi bazadan o'chirilgan bo'lishi mumkin.
  if (!admin) redirect('/admin/kirish')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="flex h-16 items-center gap-3 px-4">
          <AdminMobileNav />

          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="/monogram.png"
              alt=""
              width={200}
              height={200}
              className="size-8 rounded-md"
            />
            <span className="text-sm font-semibold tracking-[0.12em] text-card-foreground">
              FAYZ ATTOR
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {admin.username}
            </span>
            <LogoutButton variant="admin" />
          </div>
        </div>
      </header>

      <div className="flex">
        <AdminSidebar />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  )
}
