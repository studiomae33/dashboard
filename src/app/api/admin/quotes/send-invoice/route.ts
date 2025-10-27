import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { sendInvoiceEmail } from '@/lib/email'

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

    // Créer le nom de fichier unique
    const timestamp = Date.now()
    const fileName = `invoices/${invoiceRef}_${timestamp}.pdf`
    
    // Upload vers Vercel Blob
    const blob = await put(fileName, file, {
      access: 'public',
    })

    // Mettre à jour le devis avec les informations de facturation
    const updatedQuote = await prisma.quoteRequest.update({
      where: { id: quoteId },
      data: {
        status: 'INVOICED',
        invoiceRef,
        invoiceSentAt: new Date(),
      },
    })

    // Envoyer l'email de facture
    try {
      await sendInvoiceEmail({
        quote: updatedQuote,
        client: quote.client,
        invoiceFileUrl: blob.url,
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
          blobUrl: blob.url
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
