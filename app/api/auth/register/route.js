import { fail, ok, readJson } from '@/lib/api'
import { hashPassword } from '@/lib/auth/password'
import { consumeAttempt, getClientIp } from '@/lib/auth/rate-limit'
import { createUserSession } from '@/lib/auth/session'
import { formatZodError, makeRegisterSchema } from '@/lib/validation/auth'
import { prisma } from '@/lib/prisma'
import { getT } from '@/lib/i18n/server'

export async function POST(request) {
  const ip = getClientIp(request)
  const t = await getT()

  const limit = await consumeAttempt('register', ip)
  if (!limit.allowed) {
    return fail(
      t('errors.tooManyAttempts', {
        minutes: Math.ceil(limit.retryAfterSeconds / 60),
      }),
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    )
  }

  const body = await readJson(request)
  if (!body) return fail(t('errors.badRequest'))

  const parsed = makeRegisterSchema(t).safeParse(body)
  if (!parsed.success) {
    const { fieldErrors } = formatZodError(parsed.error)
    return fail(t('errors.checkData'), { fieldErrors })
  }

  const { phone, password, fullName } = parsed.data

  const existing = await prisma.user.findUnique({
    where: { phone },
    select: { id: true },
  })
  if (existing) {
    return fail(t('errors.phoneTaken'), {
      fieldErrors: { phone: t('errors.phoneTakenField') },
    })
  }

  const passwordHash = await hashPassword(password)

  const user = await prisma.user.create({
    data: { phone, passwordHash, fullName: fullName ?? null },
    select: { id: true, phone: true, fullName: true },
  })

  await createUserSession(user.id)

  return ok({ user }, { status: 201 })
}
