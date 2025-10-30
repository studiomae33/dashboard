import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyBookingInfoToken } from '@/lib/token'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 })
    }

    // Vérifier le token JWT
    const tokenData = await verifyBookingInfoToken(token)

    if (!tokenData) {
      return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 404 })
    }

    const bookingId = tokenData.bookingId

    // Récupérer les informations de la réservation
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        quoteRequest: {
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
                companyName: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 })
    }

    // Vérifier que la réservation est confirmée
    const validStatuses = ['SIGNED', 'PAYMENT_PENDING', 'PAID', 'INVOICED']
    if (!validStatuses.includes(booking.quoteRequest.status)) {
      return NextResponse.json({ error: 'Réservation non confirmée' }, { status: 403 })
    }

    // Récupérer les paramètres du studio
    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' },
      select: {
        studioName: true,
        studioAddress: true,
        studioPhone: true,
        studioEmail: true
      }
    })

    if (!settings) {
      return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
    }

    // Préparer les données de réponse
    const response = {
      booking: {
        start: booking.start.toISOString(),
        end: booking.end.toISOString(),
        background: booking.background
      },
      quote: {
        reference: booking.quoteRequest.reference
      },
      client: {
        firstName: booking.quoteRequest.client.firstName,
        lastName: booking.quoteRequest.client.lastName,
        companyName: booking.quoteRequest.client.companyName
      },
      settings
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Erreur récupération info location:', error)
    
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
