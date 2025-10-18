import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth.config'
import { sendQuoteEmail, renderDevisEmailHTML } from '@/lib/email'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { quoteId } = body

    if (!quoteId) {
      return NextResponse.json({ error: 'ID du devis manquant' }, { status: 400 })
    }

    // Vérifier que le devis existe et récupérer ses informations
    const quote = await prisma.quoteRequest.findUnique({
      where: { id: quoteId },
      include: { client: true }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    if (!quote.pdfPath) {
      return NextResponse.json({ error: 'Aucun PDF associé à ce devis' }, { status: 400 })
    }

    // Envoyer l'email avec le PDF déjà uploadé
    const result = await sendQuoteEmail(quoteId, quote.pdfPath)

    return NextResponse.json({ 
      success: true, 
      messageId: result.data?.id,
      sentTo: quote.client.email
    })
  } catch (error) {
    console.error('Erreur envoi email:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur serveur' 
    }, { status: 500 })
  }
}
