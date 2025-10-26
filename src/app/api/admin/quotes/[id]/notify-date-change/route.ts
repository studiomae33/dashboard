import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth.config'
import { prisma } from '@/lib/prisma'
import { sendDateChangeNotification } from '@/lib/email'

export async function POST(
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
    const { oldStartDate, oldEndDate, newStartDate, newEndDate } = body

    // Vérifier que le devis existe
    const quote = await prisma.quoteRequest.findUnique({
      where: { id },
      include: {
        client: true,
      }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Envoyer l'email de notification
    await sendDateChangeNotification(
      id,
      new Date(oldStartDate),
      new Date(oldEndDate),
      new Date(newStartDate),
      new Date(newEndDate)
    )

    return NextResponse.json({ 
      message: 'Email de notification envoyé avec succès',
      recipient: quote.client.email 
    })

  } catch (error) {
    console.error('Erreur envoi email modification:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de l\'envoi de l\'email',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
