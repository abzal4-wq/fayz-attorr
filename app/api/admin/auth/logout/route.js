import { ok } from '@/lib/api'
import { destroyAdminSession } from '@/lib/auth/session'

export async function POST() {
  await destroyAdminSession()
  return ok()
}
