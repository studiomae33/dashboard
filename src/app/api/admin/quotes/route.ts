import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth.config'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { put } from '@vercel/blob'

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

    // En production Vercel, on ne peut pas stocker de fichiers
    // Pour l'instant, on permet la création de devis sans PDF en production
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
    
    if (!pdfFile && !isProduction) {
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

    // Sauvegarder le fichier PDF si fourni
    let pdfPath = null
    
    if (pdfFile) {
      // Créer un nom de fichier unique avec la référence saisie
      const fileName = `${reference.trim()}_${Date.now()}.pdf`
      
      try {
        // En production, utiliser Vercel Blob
        if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
          console.log('🔄 Upload vers Vercel Blob...')
          const blob = await put(fileName, pdfFile, {
            access: 'public',
          })
          pdfPath = blob.url
          console.log('✅ PDF uploadé vers Vercel Blob:', blob.url)
        } else {
          // En développement, utiliser le système de fichiers local
          const bytes = await pdfFile.arrayBuffer()
          const buffer = Buffer.from(bytes)
          const filePath = join(process.cwd(), 'public', 'uploads', fileName)
          
          // Créer le dossier uploads s'il n'existe pas
          const fs = require('fs')
          const uploadsDir = join(process.cwd(), 'public', 'uploads')
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true })
          }
          
          await writeFile(filePath, buffer)
          pdfPath = `/uploads/${fileName}`
          console.log('✅ PDF sauvegardé localement:', fileName)
        }
      } catch (fileError) {
        console.error('❌ Erreur upload PDF:', fileError)
        throw new Error(`Impossible de sauvegarder le PDF: ${fileError instanceof Error ? fileError.message : String(fileError)}`)
      }
    } else {
      console.log('ℹ️ Aucun PDF fourni - création du devis sans PDF')
    }

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

    // Créer automatiquement le booking associé dans le calendrier
    const clientName = quote.client.companyName || `${quote.client.firstName} ${quote.client.lastName}`
    const bookingTitle = `${clientName} - ${quote.reference}`
    
    await prisma.booking.create({
      data: {
        quoteRequestId: quote.id,
        start: new Date(desiredStart),
        end: new Date(desiredEnd),
        background: background,
        title: bookingTitle
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

    // Log de la création du booking
    await prisma.eventLog.create({
      data: {
        entityType: 'BOOKING',
        entityId: quote.id,
        action: 'CREATED',
        payload: JSON.stringify({ 
          quoteReference: quote.reference,
          start: desiredStart,
          end: desiredEnd,
          title: bookingTitle
        }),
      }
    })

    return NextResponse.json(quote, { status: 201 })
  } catch (error) {
    console.error('❌ ERREUR DÉTAILLÉE CRÉATION DEVIS:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      env: {
        hasDatabase: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV
      }
    })
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur serveur',
      debug: {
        timestamp: new Date().toISOString(),
        hasDatabase: !!process.env.DATABASE_URL
      }
    }, { status: 500 })
  }
}
