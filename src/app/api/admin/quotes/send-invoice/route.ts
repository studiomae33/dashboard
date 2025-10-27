import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { sendInvoiceEmail } from '@/lib/email'
import { generateObfuscatedFileName, generateSecureDownloadUrl } from '@/lib/secure-blob'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const formData = await request.formData()
    const quoteId = formData.get('quoteId') as string
    const invoiceRef = formData.get('invoiceRef') as string
    const file = formData.get('invoiceFile') as File

    if (!quoteId || !invoiceRef || !file) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Vérifier que le fichier est un PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Le fichier doit être un PDF' }, { status: 400 })
    }

    // Vérifier la taille du fichier (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Le fichier ne peut pas dépasser 10MB' }, { status: 400 })
    }

    // Récupérer le devis
    const quote = await prisma.quoteRequest.findUnique({
      where: { id: quoteId },
      include: {
        client: true,
      },
    })

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Créer le nom de fichier obfusqué et sécurisé
    const fileName = generateObfuscatedFileName(invoiceRef)
    
    // Upload vers Vercel Blob avec accès privé
    const blob = await put(fileName, file, {
      access: 'public', // On garde public mais on obfusque les noms
    })

    // Générer une URL sécurisée avec expiration (72h)
    const secureDownloadUrl = generateSecureDownloadUrl(
      blob.url,
      quote.client.email,
      invoiceRef,
      72 // 72 heures
    )

    // Mettre à jour le devis avec les informations de facturation
    const updatedQuote = await prisma.quoteRequest.update({
      where: { id: quoteId },
      data: {
        status: 'INVOICED',
        invoiceRef,
      },
    })

    // Envoyer l'email de facture avec URL sécurisée
    try {
      await sendInvoiceEmail({
        quote: updatedQuote,
        client: quote.client,
        invoiceFileUrl: secureDownloadUrl, // URL sécurisée au lieu de l'URL directe
        invoiceRef,
      })
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailError)
      // Ne pas faire échouer la requête si l'email échoue
    }

    // Créer un log d'événement
    await prisma.eventLog.create({
      data: {
        action: 'INVOICE_SENT',
        entityType: 'QuoteRequest',
        entityId: quoteId,
        payload: JSON.stringify({ 
          invoiceRef,
          fileName: fileName.split('/')[1], // Enlever le préfixe "invoices/"
          recipientEmail: quote.client.email,
          secureUrl: true, // Indiquer que c'est une URL sécurisée
          blobUrl: blob.url // Garder l'URL originale pour référence interne
        }),
      },
    })

    return NextResponse.json({
      success: true,
      recipientEmail: quote.client.email,
      quoteReference: quote.reference,
      invoiceRef,
    })

  } catch (error) {
    console.error('Erreur lors de l\'envoi de la facture:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'envoi de la facture' },
      { status: 500 }
    )
  }
}
