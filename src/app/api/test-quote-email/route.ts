import { NextRequest, NextResponse } from 'next/server'
import { sendQuoteEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { quoteId, testEmail } = await request.json()
    
    if (!quoteId) {
      return NextResponse.json({ error: 'QuoteId manquant' }, { status: 400 })
    }

    console.log('=== TEST ENVOI DEVIS SPÉCIFIQUE ===')
    console.log('QuoteId:', quoteId)
    console.log('Email de test:', testEmail)
    
    // Récupérer le devis
    const quote = await prisma.quoteRequest.findUnique({
      where: { id: quoteId },
      include: { client: true }
    })
    
    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }
    
    console.log('📋 Devis trouvé:', {
      reference: quote.reference,
      status: quote.status,
      pdfPath: quote.pdfPath,
      clientEmail: quote.client.email
    })
    
    // Si email de test fourni, modifier temporairement l'email du client
    let originalEmail = quote.client.email
    if (testEmail) {
      console.log('📧 Changement temporaire d\'email:', originalEmail, '->', testEmail)
      await prisma.client.update({
        where: { id: quote.client.id },
        data: { email: testEmail }
      })
      quote.client.email = testEmail
    }
    
    try {
      // Tenter l'envoi
      console.log('🚀 Tentative d\'envoi...')
      const result = await sendQuoteEmail(quoteId, quote.pdfPath)
      console.log('✅ Résultat envoi:', result)
      
      return NextResponse.json({
        success: true,
        message: 'Email de devis envoyé avec succès',
        details: {
          quoteReference: quote.reference,
          sentTo: quote.client.email,
          emailId: result.data?.id,
          pdfPath: quote.pdfPath
        }
      })
      
    } finally {
      // Restaurer l'email original si changé
      if (testEmail && originalEmail) {
        console.log('🔄 Restauration email original:', testEmail, '->', originalEmail)
        await prisma.client.update({
          where: { id: quote.client.id },
          data: { email: originalEmail }
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur test envoi devis:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
