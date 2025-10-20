import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth.config'
import { sendPaymentEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  let quoteId: string | null = null
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    quoteId = body.quoteId
    const invoiceRef = body.invoiceRef
    const paymentDueDate = body.paymentDueDate

    if (!quoteId) {
      return NextResponse.json({ error: 'ID du devis manquant' }, { status: 400 })
    }

    if (!invoiceRef) {
      return NextResponse.json({ error: 'Référence facture manquante' }, { status: 400 })
    }

    // Vérifier que le devis existe et récupérer ses informations
    const quote = await prisma.quoteRequest.findUnique({
      where: { id: quoteId },
      include: { client: true }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    if (quote.status !== 'SIGNED') {
      return NextResponse.json({ error: 'Le devis n\'est pas encore signé' }, { status: 400 })
    }

    // Envoyer l'email de paiement
    const result = await sendPaymentEmail(quoteId, invoiceRef, paymentDueDate)

    console.log('✅ Email de paiement envoyé pour le devis:', quote.reference)

    return NextResponse.json({ 
      success: true, 
      messageId: result?.id || 'unknown',
      recipientEmail: quote.client.email,
      quoteReference: quote.reference
    })

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de paiement:', error)
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'email de paiement',
      quoteId 
    }, { status: 500 })
  }
}
