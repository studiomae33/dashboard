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

    // Calculer le début et la fin du mois actuel
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Récupérer les statistiques du mois actuel
    const totalQuotesThisMonth = await prisma.quoteRequest.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })
    
    const quotesToSend = await prisma.quoteRequest.count({
      where: { 
        status: 'READY',
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    const signedQuotesThisMonth = await prisma.quoteRequest.count({
      where: { 
        status: 'SIGNED',
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    const invoicedQuotesThisMonth = await prisma.quoteRequest.count({
      where: { 
        status: 'INVOICED',
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    // Récupérer les devis en cours (créés ce mois et nécessitant encore une action)
    const recentQuotes = await prisma.quoteRequest.findMany({
      where: {
        AND: [
          {
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          },
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

    // Récupérer les réservations à venir ce mois
    const upcomingBookingsThisMonth = await prisma.booking.findMany({
      where: {
        AND: [
          {
            start: {
              gte: new Date()
            }
          },
          {
            start: {
              gte: startOfMonth,
              lte: endOfMonth
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
        start: 'asc'
      }
    })

    // Calculer le CA du mois (devis facturés ce mois)
    const monthlyRevenue = await prisma.quoteRequest.aggregate({
      where: {
        AND: [
          {
            status: 'INVOICED'
          },
          {
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          }
        ]
      },
      _sum: {
        invoiceAmountTTC: true
      }
    })

    const stats = {
      totalQuotes: totalQuotesThisMonth,
      quotesToSend,
      signedQuotes: signedQuotesThisMonth,
      invoicedQuotes: invoicedQuotesThisMonth,
      monthlyRevenue: monthlyRevenue._sum.invoiceAmountTTC || 0,
      recentQuotes,
      upcomingBookings: upcomingBookingsThisMonth,
      monthInfo: {
        startOfMonth: startOfMonth.toISOString(),
        endOfMonth: endOfMonth.toISOString(),
        currentMonth: now.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Erreur dashboard:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
