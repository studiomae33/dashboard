import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth.config'
import { prisma } from '@/lib/prisma'
import { needsInvoice } from '@/lib/utils'

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
        desiredStart: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })
    
    const quotesToSend = await prisma.quoteRequest.count({
      where: { 
        status: 'READY',
        desiredStart: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    // Récupérer la prochaine location
    const nextBooking = await prisma.quoteRequest.findFirst({
      where: {
        AND: [
          {
            desiredStart: {
              gte: new Date()
            }
          },
          {
            status: {
              in: ['SIGNED', 'PAYMENT_PENDING', 'ONSITE_PAYMENT', 'PAID']
            }
          }
        ]
      },
      orderBy: {
        desiredStart: 'asc'
      },
      select: {
        desiredStart: true,
        background: true
      }
    })

    const nextBookingDate = nextBooking ? nextBooking.desiredStart : null
    const nextBookingBackground = nextBooking ? nextBooking.background : null

    const invoicedQuotesThisMonth = await prisma.quoteRequest.count({
      where: { 
        status: 'INVOICED',
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    // Récupérer tous les devis payés pour vérifier lesquels nécessitent une facture
    const paidQuotes = await prisma.quoteRequest.findMany({
      where: { 
        status: 'PAID'
      },
      select: {
        id: true,
        status: true,
        desiredEnd: true
      }
    })

    // Compter les devis qui nécessitent une facture
    const quotesNeedingInvoice = paidQuotes.filter(needsInvoice)
    const invoicesToSendCount = quotesNeedingInvoice.length

    // Récupérer les détails complets des devis nécessitant une facture (limité à 5 pour l'affichage)
    const quotesNeedingInvoiceDetails = quotesNeedingInvoice.length > 0 
      ? await prisma.quoteRequest.findMany({
          where: {
            id: {
              in: quotesNeedingInvoice.slice(0, 5).map(q => q.id)
            }
          },
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
                companyName: true,
              }
            }
          },
          orderBy: { desiredEnd: 'asc' }
        })
      : []

    // Récupérer les devis en cours (avec date de location ce mois et nécessitant encore une action)
    const recentQuotes = await prisma.quoteRequest.findMany({
      where: {
        AND: [
          {
            desiredStart: {
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
              notIn: ['PAYMENT_PENDING', 'ONSITE_PAYMENT', 'PAID', 'INVOICED', 'CANCELED']
            }
          }
        ]
      },
      take: 10,
      orderBy: { desiredStart: 'asc' },
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

    // Récupérer les réservations des mois futurs
    const upcomingBookingsFutureMonths = await prisma.booking.findMany({
      where: {
        AND: [
          {
            start: {
              gte: new Date(now.getFullYear(), now.getMonth() + 1, 1) // Premier jour du mois prochain
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

    // Calculer le CA du mois (devis signés et étapes suivantes avec date de location ce mois)
    // Inclure tous les devis confirmés (SIGNED, PAYMENT_PENDING, ONSITE_PAYMENT, PAID, INVOICED) avec date de location ce mois
    const monthlyRevenue = await prisma.quoteRequest.aggregate({
      where: {
        AND: [
          {
            status: {
              in: ['SIGNED', 'PAYMENT_PENDING', 'ONSITE_PAYMENT', 'PAID', 'INVOICED']
            }
          },
          {
            desiredStart: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          }
        ]
      },
      _sum: {
        amountTTC: true
      }
    })

    const totalMonthlyRevenue = monthlyRevenue._sum.amountTTC || 0

    const stats = {
      totalQuotes: totalQuotesThisMonth,
      quotesToSend,
      nextBookingDate,
      nextBookingBackground,
      invoicedQuotes: invoicedQuotesThisMonth,
      monthlyRevenue: totalMonthlyRevenue,
      recentQuotes,
      upcomingBookings: upcomingBookingsThisMonth,
      upcomingBookingsFuture: upcomingBookingsFutureMonths,
      invoicesToSendCount,
      quotesNeedingInvoiceDetails,
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
