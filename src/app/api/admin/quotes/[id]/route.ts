import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = params

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

    // Récupérer les logs d'événements séparément
    const eventLogs = await prisma.eventLog.findMany({
      where: {
        entityType: 'QUOTE',
        entityId: id
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ ...quote, eventLogs })
  } catch (error) {
    console.error('Erreur devis détail:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

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
    const { status: newStatus, invoiceRef, invoiceAmountTTC } = body

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

    const updatedQuote = await prisma.quoteRequest.update({
      where: { id },
      data: {
        status: newStatus,
        invoiceRef: invoiceRef || quote.invoiceRef,
        invoiceAmountTTC: invoiceAmountTTC || quote.invoiceAmountTTC,
      },
      include: {
        client: true,
        booking: true,
      }
    })

    // Si le devis passe à SIGNED, créer une réservation
    if (newStatus === 'SIGNED' && !quote.booking) {
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
        action: 'STATUS_CHANGED',
        payload: JSON.stringify({ from: quote.status, to: newStatus }),
      }
    })

    return NextResponse.json(updatedQuote)
  } catch (error) {
    console.error('Erreur mise à jour devis:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
