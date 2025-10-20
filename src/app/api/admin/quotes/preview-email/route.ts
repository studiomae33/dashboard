import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth.config'
import { renderDevisEmailHTML } from '@/lib/email'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { quoteId, emailContent } = await request.json()

    if (!quoteId) {
      return NextResponse.json({ error: 'ID du devis manquant' }, { status: 400 })
    }

    const quote = await prisma.quoteRequest.findUnique({
      where: { id: quoteId },
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

    const emailData = {
      quote,
      client: quote.client,
      settings
    }

    const html = await renderDevisEmailHTML(emailData)

    return NextResponse.json({ html })
  } catch (error) {
    console.error('Erreur prévisualisation email:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
