import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth.config'
import { prisma } from '@/lib/prisma'

// Endpoint pour voir les prochaines locations (debug)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const now = new Date()
    
    // Prochaines 7 jours
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        AND: [
          {
            start: {
              gte: now
            }
          },
          {
            start: {
              lte: nextWeek
            }
          },
          {
            quoteRequest: {
              status: {
                in: ['SIGNED', 'PAYMENT_PENDING', 'PAID', 'INVOICED']
              }
            }
          }
        ]
      },
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
      },
      orderBy: {
        start: 'asc'
      }
    })
    
    const bookingsWithDetails = upcomingBookings.map(booking => {
      const clientName = booking.quoteRequest.client.companyName || 
                        `${booking.quoteRequest.client.firstName} ${booking.quoteRequest.client.lastName}`
      
      const timeUntil = booking.start.getTime() - now.getTime()
      const hoursUntil = Math.floor(timeUntil / (60 * 60 * 1000))
      
      return {
        id: booking.id,
        start: booking.start.toISOString(),
        client: clientName,
        reference: booking.quoteRequest.reference,
        background: booking.background,
        status: booking.quoteRequest.status,
        hoursUntil,
        willGetReminder: hoursUntil >= 47 && hoursUntil <= 49, // 48h +/- 1h
        startFormatted: new Intl.DateTimeFormat('fr-FR', {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone: 'Europe/Paris'
        }).format(booking.start)
      }
    })
    
    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      totalBookings: bookingsWithDetails.length,
      bookingsWithReminders: bookingsWithDetails.filter(b => b.willGetReminder).length,
      bookings: bookingsWithDetails
    })
    
  } catch (error) {
    console.error('❌ Erreur debug bookings:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
