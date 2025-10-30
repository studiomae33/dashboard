import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'your-secret-key')

export async function generateValidationToken(quoteId: string): Promise<string> {
  const token = await new SignJWT({ quoteId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Token valide 7 jours
    .sign(secret)

  return token
}

export async function generateBookingInfoToken(bookingId: string): Promise<string> {
  const token = await new SignJWT({ bookingId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d') // Token valide 30 jours (pour les infos pratiques)
    .sign(secret)

  return token
}

export async function verifyValidationToken(token: string): Promise<{ quoteId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return { quoteId: payload.quoteId as string }
  } catch (error) {
    return null
  }
}

export async function verifyBookingInfoToken(token: string): Promise<{ bookingId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return { bookingId: payload.bookingId as string }
  } catch (error) {
    return null
  }
}
