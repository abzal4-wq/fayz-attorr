import { fail, ok, readJson } from '@/lib/api'
import { guardAdmin } from '@/lib/admin-api'
import { createUploadSignature } from '@/lib/cloudinary'

const ALLOWED_SUBFOLDERS = ['brendlar', 'atirlar']

export async function POST(request) {
  const guard = await guardAdmin()
  if (guard.response) return guard.response

  const body = await readJson(request)
  const subfolder = body?.subfolder

  // Papka imzoga kiradi — faqat ro'yxatdagilarga ruxsat
  if (!ALLOWED_SUBFOLDERS.includes(subfolder)) {
    return fail("Papka noto'g'ri")
  }

  try {
    return ok(createUploadSignature(subfolder))
  } catch (error) {
    return fail(error.message, { status: 500 })
  }
}
