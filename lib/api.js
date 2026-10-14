import { NextResponse } from 'next/server'

/** Muvaffaqiyatli javob. */
export function ok(data = {}, init) {
  return NextResponse.json({ ok: true, ...data }, init)
}

/**
 * Xato javobi.
 * @param message foydalanuvchiga ko'rsatiladigan matn (o'zbekcha)
 * @param options.status HTTP kodi
 * @param options.fieldErrors forma maydonlariga biriktiriladigan xatolar
 * @param options.details qo'shimcha ro'yxat (masalan qaysi mahsulot muammoli)
 */
export function fail(message, { status = 400, fieldErrors, details, headers } = {}) {
  return NextResponse.json(
    {
      ok: false,
      message,
      ...(fieldErrors ? { fieldErrors } : {}),
      ...(details ? { details } : {}),
    },
    { status, headers }
  )
}

/**
 * Topilmadi. Admin yo'llarida ataylab 401 o'rniga shu ishlatiladi —
 * panel mavjudligini oshkor qilmaslik uchun.
 */
export function notFound() {
  return NextResponse.json({ ok: false, message: 'Topilmadi' }, { status: 404 })
}

/** So'rov tanasini xavfsiz o'qiydi. */
export async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}
