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
    const { startDate, endDate } = body

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Les dates de début et de fin sont obligatoires' }, 
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date()

    // Validation des dates
    if (start >= end) {
      return NextResponse.json(
        { error: 'La date de fin doit être après la date de début' },
        { status: 400 }
      )
    }

    if (start < now) {
      return NextResponse.json(
        { error: 'La date de début ne peut pas être dans le passé' },
        { status: 400 }
      )
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

    // Vérifier que le devis est dans un état où il peut être modifié
    if (!['SIGNED', 'PAYMENT_PENDING', 'PAID'].includes(quote.status)) {
      return NextResponse.json(
        { error: 'Les dates ne peuvent être modifiées que pour les devis signés' },
        { status: 400 }
      )
    }

    // Vérifier les conflits avec d'autres réservations
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        AND: [
          { id: { not: quote.booking?.id } }, // Exclure le booking actuel
          {
            OR: [
              // Nouvelle période commence pendant une réservation existante
              {
                AND: [
                  { start: { lte: start } },
                  { end: { gt: start } }
                ]
              },
              // Nouvelle période finit pendant une réservation existante
              {
                AND: [
                  { start: { lt: end } },
                  { end: { gte: end } }
                ]
              },
              // Nouvelle période englobe une réservation existante
              {
                AND: [
                  { start: { gte: start } },
                  { end: { lte: end } }
                ]
              }
            ]
          }
        ]
      },
      include: {
        quoteRequest: {
          select: {
            reference: true,
            status: true
          }
        }
      }
    })

    // Filtrer les conflits pour ne garder que les bookings de devis confirmés
    const activeConflicts = conflictingBookings.filter(booking => 
      ['SIGNED', 'PAYMENT_PENDING', 'PAID', 'INVOICED'].includes(booking.quoteRequest.status)
    )

    if (activeConflicts.length > 0) {
      return NextResponse.json(
        { 
          error: 'Conflit de réservation détecté',
          conflicts: activeConflicts.map(b => ({
            reference: b.quoteRequest.reference,
            start: b.start,
            end: b.end
          }))
        },
        { status: 409 }
      )
    }

    // Utiliser une transaction pour mettre à jour le devis et le booking
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour le devis
      const updatedQuote = await tx.quoteRequest.update({
        where: { id },
        data: {
          desiredStart: start,
          desiredEnd: end,
        },
        include: {
          client: true,
          booking: true,
        }
      })

      // Mettre à jour ou créer le booking
      if (quote.booking) {
        await tx.booking.update({
          where: { id: quote.booking.id },
          data: {
            start,
            end,
            title: `${updatedQuote.client.firstName} ${updatedQuote.client.lastName} - ${updatedQuote.background}`,
          }
        })
      } else {
        await tx.booking.create({
          data: {
            quoteRequestId: quote.id,
            start,
            end,
            background: quote.background,
            title: `${updatedQuote.client.firstName} ${updatedQuote.client.lastName} - ${updatedQuote.background}`,
          }
        })
      }

      // Logger l'événement
      await tx.eventLog.create({
        data: {
          entityType: 'QUOTE',
          entityId: quote.id,
          action: 'DATES_MODIFIED',
          payload: JSON.stringify({
            oldStart: quote.desiredStart,
            oldEnd: quote.desiredEnd,
            newStart: start,
            newEnd: end,
            modifiedBy: session.user?.email
          }),
        }
      })

      return updatedQuote
    })

    // Récupérer les logs d'événements mis à jour
    const eventLogs = await prisma.eventLog.findMany({
      where: {
        entityType: 'QUOTE',
        entityId: id
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ 
      ...result, 
      eventLogs,
      message: 'Dates modifiées avec succès' 
    })

  } catch (error) {
    console.error('Erreur modification dates devis:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
