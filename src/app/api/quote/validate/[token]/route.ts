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

    // Créer la réservation
    await prisma.booking.create({
      data: {
        quoteRequestId: quote.id,
        start: quote.desiredStart,
        end: quote.desiredEnd,
        background: quote.background,
        title: `${quote.client.companyName || `${quote.client.firstName} ${quote.client.lastName}`} - ${quote.background}`,
      }
    })

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
    console.error('Erreur validation devis:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
