import { ok } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth/session'

export async function GET() {
  const user = await getCurrentUser()
  return ok({ user })
}
