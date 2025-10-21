import { NextRequest, NextResponse } from 'next/server'
import { verifyValidationToken } from '@/lib/token'
import { prisma } from '@/lib/prisma'
import { renderDevisEmailHTML } from '@/lib/email'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    // Vérifier le token JWT
    const tokenData = await verifyValidationToken(token)
    if (!tokenData) {
      return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 400 })
    }

    // Récupérer le devis
    const quote = await prisma.quoteRequest.findUnique({
      where: { id: tokenData.quoteId },
      include: { client: true }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' }
    })

    if (!settings) {
      return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
    }

    // Générer le HTML du devis
    const emailData = {
      quote,
      client: quote.client,
      settings
    }

    const html = await renderDevisEmailHTML(emailData)
    
    // Retourner le HTML qui sera affiché dans l'iframe
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Erreur génération PDF:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
