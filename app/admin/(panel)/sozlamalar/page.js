import { SettingsForm } from '@/components/admin/settings-form'
import { prisma } from '@/lib/prisma'
import { getAdminChatIds, getBotInfo } from '@/lib/telegram'

export const metadata = { title: 'Sozlamalar' }

export default async function SettingsPage() {
  const row = await prisma.storeSettings.upsert({
    where: { id: 'settings' },
    update: {},
    create: { id: 'settings' },
  })

  // Telegram holati — xato bo'lsa sahifa baribir ochilsin
  const bot = await getBotInfo()

  const settings = {
    phone: row.phone ?? '',
    address: row.address ?? '',
    workingHours: row.workingHours ?? '',
    telegramUrl: row.telegramUrl ?? '',
    instagramUrl: row.instagramUrl ?? '',
    deliveryInfo: row.deliveryInfo ?? '',
    deliveryPrice: Number(row.deliveryPrice ?? 0),
  }

  return (
    <SettingsForm
      settings={settings}
      telegram={{
        botUsername: bot?.username ?? null,
        chatCount: getAdminChatIds().length,
      }}
    />
  )
}
