import { NextRequest, NextResponse } from 'next/server'
import { verifyValidationToken } from '@/lib/token'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    
    const tokenData = await verifyValidationToken(token)
    if (!tokenData) {
      return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 400 })
    }

    const quote = await prisma.quoteRequest.findUnique({
      where: { id: tokenData.quoteId },
      include: { client: true }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    if (quote.status !== 'SENT') {
      return NextResponse.json({ 
        error: 'Ce devis ne peut plus être validé' 
      }, { status: 400 })
    }

    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' }
    })

    if (!settings) {
      return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
    }

    return NextResponse.json({
      quote,
      client: quote.client,
      settings
    })
  } catch (error) {
    console.error('Erreur validation token:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    
    const tokenData = await verifyValidationToken(token)
    if (!tokenData) {
      return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 400 })
    }

    const quote = await prisma.quoteRequest.findUnique({
      where: { id: tokenData.quoteId },
      include: { client: true }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    if (quote.status !== 'SENT') {
      return NextResponse.json({ 
        error: 'Ce devis ne peut plus être validé' 
      }, { status: 400 })
    }

    // Récupérer l'IP du client
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1'

    // Mettre à jour le devis
    const updatedQuote = await prisma.quoteRequest.update({
      where: { id: tokenData.quoteId },
      data: {
        status: 'SIGNED',
        signedAt: new Date(),
        signedIp: clientIp,
      }
    })

    // Vérifier si une réservation existe déjà
    const existingBooking = await prisma.booking.findUnique({
      where: { quoteRequestId: quote.id }
    })

    // Créer la réservation seulement si elle n'existe pas
    if (!existingBooking) {
      await prisma.booking.create({
        data: {
          quoteRequestId: quote.id,
          start: quote.desiredStart,
          end: quote.desiredEnd,
          background: quote.background,
          title: `${quote.client.companyName || `${quote.client.firstName} ${quote.client.lastName}`} - ${quote.background}`,
        }
      })
    }

    // Log de l'événement
    await prisma.eventLog.create({
      data: {
        entityType: 'QUOTE',
        entityId: quote.id,
        action: 'SIGNED',
        payload: JSON.stringify({ 
          signedAt: new Date().toISOString(),
          signedIp: clientIp,
          method: 'online'
        }),
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ ERREUR DÉTAILLÉE VALIDATION DEVIS:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tokenParam: params.token,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur serveur',
      debug: {
        timestamp: new Date().toISOString(),
        token: params.token.substring(0, 20) + '...' // Partie du token pour debug
      }
    }, { status: 500 })
  }
}
