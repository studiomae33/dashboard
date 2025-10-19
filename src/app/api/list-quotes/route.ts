import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('=== RECHERCHE DEVIS EXISTANTS ===')
    
    const quotes = await prisma.quoteRequest.findMany({
      include: {
        client: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })
    
    console.log(`Trouvé ${quotes.length} devis`)
    
    const quotesInfo = quotes.map(quote => ({
      id: quote.id,
      reference: quote.reference,
      status: quote.status,
      clientEmail: quote.client.email,
      pdfPath: quote.pdfPath,
      createdAt: quote.createdAt
    }))
    
    console.log('Devis disponibles:', quotesInfo)
    
    return NextResponse.json({
      success: true,
      count: quotes.length,
      quotes: quotesInfo
    })
    
  } catch (error) {
    console.error('❌ Erreur récupération devis:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
