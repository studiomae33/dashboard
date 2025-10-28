import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth.config'
import { sendPaymentReminderEmail } from '@/lib/email'
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
    const paymentLink = body.paymentLink

    if (!quoteId) {
      return NextResponse.json({ error: 'ID du devis manquant' }, { status: 400 })
    }

    if (!invoiceRef) {
      return NextResponse.json({ error: 'Référence facture manquante' }, { status: 400 })
    }

    if (!paymentLink) {
      return NextResponse.json({ error: 'Lien de paiement SumUp manquant' }, { status: 400 })
    }

    // Vérifier que le devis existe et récupérer ses informations
    const quote = await prisma.quoteRequest.findUnique({
      where: { id: quoteId },
      include: { client: true }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    if (quote.status !== 'PAYMENT_PENDING') {
      return NextResponse.json({ error: 'Le devis n\'est pas en attente de paiement' }, { status: 400 })
    }

    // Envoyer l'email de relance de paiement (sans changer le statut)
    const result = await sendPaymentReminderEmail(quoteId, invoiceRef, paymentDueDate, paymentLink)

    console.log('✅ Relance de paiement envoyée pour le devis:', quote.reference)

    return NextResponse.json({ 
      success: true, 
      messageId: result?.id || 'unknown',
      recipientEmail: quote.client.email,
      quoteReference: quote.reference
    })

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la relance de paiement:', {
      quoteId,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    })
    
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de la relance de paiement' },
      { status: 500 }
    )
  }
}
