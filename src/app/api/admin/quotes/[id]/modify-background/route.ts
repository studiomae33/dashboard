import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth.config'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { background } = body

    if (!background || typeof background !== 'string') {
      return NextResponse.json({ error: 'Type de fond requis' }, { status: 400 })
    }

    // Vérifier que le devis existe
    const quote = await prisma.quoteRequest.findUnique({
      where: { id },
      include: {
        client: true,
        booking: true,
      }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    const oldBackground = quote.background

    // Mettre à jour le type de fond
    const updatedQuote = await prisma.quoteRequest.update({
      where: { id },
      data: {
        background,
      },
      include: {
        client: true,
        booking: true,
      }
    })

    // Mettre à jour également la réservation si elle existe
    if (quote.booking) {
      await prisma.booking.update({
        where: { id: quote.booking.id },
        data: {
          background,
        }
      })
    }

    // Log de l'événement
    await prisma.eventLog.create({
      data: {
        entityType: 'QUOTE',
        entityId: quote.id,
        action: 'BACKGROUND_MODIFIED',
        payload: JSON.stringify({ 
          from: oldBackground, 
          to: background 
        }),
      }
    })

    // Récupérer les logs d'événements mis à jour
    const eventLogs = await prisma.eventLog.findMany({
      where: {
        entityType: 'QUOTE',
        entityId: id
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ ...updatedQuote, eventLogs })
  } catch (error) {
    console.error('Erreur modification type de fond:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
