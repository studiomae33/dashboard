import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth.config'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const quotes = await prisma.quoteRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json(quotes)
  } catch (error) {
    console.error('Erreur devis:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Traiter FormData pour l'upload de fichier
    const formData = await request.formData()
    const clientId = formData.get('clientId') as string
    const reference = formData.get('reference') as string
    const desiredStart = formData.get('desiredStart') as string
    const desiredEnd = formData.get('desiredEnd') as string
    const background = formData.get('background') as string
    const amountTTC = formData.get('amountTTC') as string
    const message = formData.get('message') as string
    const pdfFile = formData.get('pdfFile') as File

    if (!pdfFile) {
      return NextResponse.json({ error: 'Fichier PDF requis' }, { status: 400 })
    }

    if (!reference || !reference.trim()) {
      return NextResponse.json({ error: 'Référence du devis requise' }, { status: 400 })
    }

    // Valider le montant TTC
    if (!amountTTC || !amountTTC.trim()) {
      return NextResponse.json({ error: 'Montant TTC requis' }, { status: 400 })
    }

    const amountValue = parseFloat(amountTTC.replace(',', '.'))
    if (isNaN(amountValue) || amountValue <= 0) {
      return NextResponse.json({ error: 'Montant TTC invalide' }, { status: 400 })
    }

    // Vérifier que la référence n'existe pas déjà
    const existingQuote = await prisma.quoteRequest.findUnique({
      where: { reference: reference.trim() }
    })

    if (existingQuote) {
      return NextResponse.json({ error: 'Cette référence existe déjà' }, { status: 400 })
    }

    // Sauvegarder le fichier PDF
    const bytes = await pdfFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Créer un nom de fichier unique avec la référence saisie
    const fileName = `${reference.trim()}_${Date.now()}.pdf`
    const filePath = join(process.cwd(), 'public', 'uploads', fileName)
    
    await writeFile(filePath, buffer)
    
    const pdfPath = `/uploads/${fileName}`

    // Créer le devis avec le montant TTC
    const quoteData: any = {
      clientId,
      reference: reference.trim(),
      desiredStart: new Date(desiredStart),
      desiredEnd: new Date(desiredEnd),
      background,
      message: message || null,
      status: 'READY', // Le devis est prêt à être envoyé avec le PDF
      pdfPath,
    }
    
    // Ajouter le montant TTC
    quoteData.amountTTC = amountValue

    const quote = await prisma.quoteRequest.create({
      data: quoteData,
      include: {
        client: true
      }
    })

    // Log de l'événement
    await prisma.eventLog.create({
      data: {
        entityType: 'QUOTE',
        entityId: quote.id,
        action: 'CREATED',
        payload: JSON.stringify({ 
          reference: quote.reference, 
          clientId: quote.clientId,
          pdfPath: quote.pdfPath 
        }),
      }
    })

    return NextResponse.json(quote, { status: 201 })
  } catch (error) {
    console.error('Erreur création devis:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
