import { z } from 'zod'
import { fail, ok, readJson } from '@/lib/api'
import { guardAdmin } from '@/lib/admin-api'
import { prisma } from '@/lib/prisma'
import { revalidateCatalog } from '@/lib/revalidate'

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'Hech narsa tanlanmadi'),
  isActive: z.boolean(),
})

export async function POST(request) {
  const guard = await guardAdmin()
  if (guard.response) return guard.response

  const body = await readJson(request)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail('Tanlovni tekshiring')

  const { count } = await prisma.product.updateMany({
    where: { id: { in: parsed.data.ids } },
    data: { isActive: parsed.data.isActive },
  })

  revalidateCatalog()
  return ok({ count })
}
