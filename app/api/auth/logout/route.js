import { ok } from '@/lib/api'
import { destroyUserSession } from '@/lib/auth/session'

export async function POST() {
  await destroyUserSession()
  return ok()
}
