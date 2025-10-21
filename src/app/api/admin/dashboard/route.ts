import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth.config'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer les statistiques
    const totalQuotes = await prisma.quoteRequest.count()
    
    const quotesToSend = await prisma.quoteRequest.count({
      where: { status: 'READY' }
    })

    const signedQuotes = await prisma.quoteRequest.count({
      where: { status: 'SIGNED' }
    })

    // Récupérer les devis nécessitant encore une action (tâches restantes)
    const recentQuotes = await prisma.quoteRequest.findMany({
      where: {
        AND: [
          {
            desiredEnd: {
              gte: new Date()
            }
          },
          {
            status: {
              notIn: ['PAYMENT_PENDING', 'PAID', 'INVOICED', 'CANCELED']
            }
          }
        ]
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
          }
        }
      }
    })

    // Récupérer les réservations à venir, triées par date de devis (desiredStart)
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        AND: [
          {
            start: {
              gte: new Date()
            }
          },
          {
            end: {
              gte: new Date()
            }
          }
        ]
      },
      take: 10,
      include: {
        quoteRequest: {
          select: {
            desiredStart: true,
            reference: true,
            status: true,
            client: {
              select: {
                firstName: true,
                lastName: true,
                companyName: true
              }
            }
          }
        }
      },
      orderBy: {
        quoteRequest: {
          desiredStart: 'asc'
        }
      }
    })

    const stats = {
      totalQuotes,
      quotesToSend,
      signedQuotes,
      recentQuotes,
      upcomingBookings,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Erreur dashboard:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
