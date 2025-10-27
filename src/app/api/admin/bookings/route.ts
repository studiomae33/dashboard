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

    const bookings = await prisma.booking.findMany({
      include: {
        quoteRequest: {
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
                companyName: true,
                email: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: {
        start: 'asc'
      }
    })

    // S'assurer qu'il n'y a pas de cache
    const response = NextResponse.json(bookings)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    
    return response
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
