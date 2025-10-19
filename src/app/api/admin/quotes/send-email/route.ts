import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth.config'
import { sendQuoteEmail, renderDevisEmailHTML } from '@/lib/email'
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
    console.error('❌ ERREUR DÉTAILLÉE ENVOI EMAIL:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      quoteId,
      timestamp: new Date().toISOString(),
      env: {
        hasResendKey: !!process.env.RESEND_API_KEY,
        hasSenderEmail: !!process.env.SENDER_EMAIL,
        nodeEnv: process.env.NODE_ENV
      }
    })
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur serveur',
      debug: {
        timestamp: new Date().toISOString(),
        quoteId,
        hasResendKey: !!process.env.RESEND_API_KEY,
        hasSenderEmail: !!process.env.SENDER_EMAIL
      }
    }, { status: 500 })
  }
}
