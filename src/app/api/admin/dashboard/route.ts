import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth.config'
import { prisma } from '@/lib/prisma'

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

    // Récupérer les devis récents avec les infos client
    const recentQuotes = await prisma.quoteRequest.findMany({
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

    // Récupérer les réservations à venir
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        start: {
          gte: new Date()
        }
      },
      take: 10,
      orderBy: { start: 'asc' }
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
