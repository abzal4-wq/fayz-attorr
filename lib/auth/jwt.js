import { SignJWT, jwtVerify } from 'jose'

/**
 * JWT imzolash va tekshirish.
 *
 * `jose` Edge runtime'da ham ishlaydi — shuning uchun middleware
 * tokenni bazaga murojaat qilmasdan tekshira oladi.
 *
 * Mijoz va admin uchun ALOHIDA maxfiy kalit ishlatiladi: mijoz tokeni
 * sizib chiqsa ham admin panelga yaramaydi.
 */

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 kun

const ISSUER = 'fayz-attor'
const AUD_USER = 'user'
const AUD_ADMIN = 'admin'

function secretFor(audience) {
  const raw =
    audience === AUD_ADMIN ? process.env.ADMIN_JWT_SECRET : process.env.JWT_SECRET

  if (!raw) {
    throw new Error(
      `${audience === AUD_ADMIN ? 'ADMIN_JWT_SECRET' : 'JWT_SECRET'} o'rnatilmagan`
    )
  }
  return new TextEncoder().encode(raw)
}

async function sign(payload, audience) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setAudience(audience)
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretFor(audience))
}

async function verify(token, audience) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretFor(audience), {
      issuer: ISSUER,
      audience,
    })
    return payload
  } catch {
    // Muddati o'tgan, imzosi noto'g'ri yoki buzilgan token
    return null
  }
}

/**
 * Mijoz tokeni.
 *
 * `tv` — hisobning joriy `tokenVersion` qiymati. Chiqishda yoki parol
 * almashganda bazadagi raqam oshadi va bu tokendagi `tv` unga mos
 * kelmay qoladi. Busiz token 30 kun davomida, chiqib ketgandan keyin
 * ham ishlayverardi.
 */
export function signUserToken(userId, tokenVersion = 0) {
  return sign({ sub: userId, tv: tokenVersion }, AUD_USER)
}

export function verifyUserToken(token) {
  return verify(token, AUD_USER)
}

/** Admin tokeni. `tv` — `signUserToken` dagi kabi. */
export function signAdminToken(adminId, role = 'admin', tokenVersion = 0) {
  return sign({ sub: adminId, role, tv: tokenVersion }, AUD_ADMIN)
}

export function verifyAdminToken(token) {
  return verify(token, AUD_ADMIN)
}
