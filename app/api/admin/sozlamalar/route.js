import { fail, ok, readJson } from '@/lib/api'
import { guardAdmin } from '@/lib/admin-api'
import { prisma } from '@/lib/prisma'
import { settingsSchema } from '@/lib/validation/admin'
import { formatZodError } from '@/lib/validation/auth'
import { revalidateSettings } from '@/lib/revalidate'

export async function PATCH(request) {
  const guard = await guardAdmin()
  if (guard.response) return guard.response

  const body = await readJson(request)
  if (!body) return fail("So'rov formati noto'g'ri")

  const parsed = settingsSchema.safeParse(body)
  if (!parsed.success) {
    return fail("Ma'lumotlarni tekshiring", {
      fieldErrors: formatZodError(parsed.error).fieldErrors,
    })
  }

  const settings = await prisma.storeSettings.upsert({
    where: { id: 'settings' },
    update: parsed.data,
    create: { id: 'settings', ...parsed.data },
  })

  revalidateSettings()
  return ok({ settings: { ...settings, deliveryPrice: Number(settings.deliveryPrice) } })
}
