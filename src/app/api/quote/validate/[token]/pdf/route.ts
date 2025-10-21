import { NextRequest, NextResponse } from 'next/server'
import { verifyValidationToken } from '@/lib/token'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

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

    if (!quote.pdfPath) {
      return NextResponse.json({ error: 'Aucun PDF disponible pour ce devis' }, { status: 404 })
    }

    // Si le PDF est hébergé sur Vercel Blob (URL externe)
    if (quote.pdfPath.startsWith('http')) {
      try {
        const response = await fetch(quote.pdfPath)
        if (!response.ok) {
          throw new Error('Impossible de récupérer le PDF depuis Vercel Blob')
        }
        
        const pdfBuffer = await response.arrayBuffer()
        
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="devis-${quote.reference}.pdf"`,
          },
        })
      } catch (error) {
        console.error('Erreur téléchargement PDF Vercel Blob:', error)
        return NextResponse.json({ error: 'Erreur lors du téléchargement du PDF' }, { status: 500 })
      }
    }

    // Si le PDF est stocké localement
    const fullPath = path.join(process.cwd(), 'public', quote.pdfPath.replace('/uploads/', 'uploads/'))
    
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'Fichier PDF non trouvé' }, { status: 404 })
    }

    const pdfBuffer = fs.readFileSync(fullPath)
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="devis-${quote.reference}.pdf"`,
      },
    })
    
  } catch (error) {
    console.error('Erreur génération PDF:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
