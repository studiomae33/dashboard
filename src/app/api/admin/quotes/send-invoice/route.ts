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
    const invoiceCount = parseInt(formData.get('invoiceCount') as string) || 1
    const newTotalAmount = formData.get('newTotalAmount') as string

    if (!quoteId) {
      return NextResponse.json({ error: 'ID du devis manquant' }, { status: 400 })
    }

    // Récupérer toutes les factures depuis le FormData
    const invoices: Array<{file: File, invoiceRef: string, label: string}> = []
    
    for (let i = 0; i < invoiceCount; i++) {
      const file = formData.get(`invoiceFile_${i}`) as File
      const invoiceRef = formData.get(`invoiceRef_${i}`) as string
      const label = formData.get(`invoiceLabel_${i}`) as string

      if (!file || !invoiceRef) {
        return NextResponse.json({ error: `Données manquantes pour la facture ${i + 1}` }, { status: 400 })
      }

      // Vérifier que le fichier est un PDF
      if (file.type !== 'application/pdf') {
        return NextResponse.json({ error: `Le fichier ${i + 1} doit être un PDF` }, { status: 400 })
      }

      // Vérifier la taille du fichier (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: `Le fichier ${i + 1} ne peut pas dépasser 10MB` }, { status: 400 })
      }

      invoices.push({ file, invoiceRef, label })
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

    // Uploader chaque facture vers Vercel Blob
    const uploadedInvoices: Array<{invoiceRef: string, label: string, secureUrl: string, blobUrl: string}> = []

    for (const invoice of invoices) {
      // Créer le nom de fichier obfusqué et sécurisé
      const fileName = generateObfuscatedFileName(invoice.invoiceRef)
      
      // Upload vers Vercel Blob avec accès privé
      const blob = await put(fileName, invoice.file, {
        access: 'public', // On garde public mais on obfusque les noms
      })

      // Générer une URL sécurisée avec expiration (72h)
      const secureDownloadUrl = generateSecureDownloadUrl(
        blob.url,
        quote.client.email,
        invoice.invoiceRef,
        72 // 72 heures
      )

      uploadedInvoices.push({
        invoiceRef: invoice.invoiceRef,
        label: invoice.label,
        secureUrl: secureDownloadUrl,
        blobUrl: blob.url
      })
    }

    // Combiner toutes les références de factures
    const allRefs = uploadedInvoices.map(inv => inv.invoiceRef).join(' | ')

    // Déterminer le montant TTC à utiliser pour la facturation
    let finalAmountTTC = quote.amountTTC || 0
    if (newTotalAmount && invoices.length > 1) {
      const parsedNewAmount = parseFloat(newTotalAmount.replace(',', '.'))
      if (!isNaN(parsedNewAmount) && parsedNewAmount >= finalAmountTTC) {
        finalAmountTTC = parsedNewAmount
      }
    }

    // Mettre à jour le devis avec les informations de facturation
    const updatedQuote = await prisma.quoteRequest.update({
      where: { id: quoteId },
      data: {
        status: 'INVOICED',
        invoiceRef: allRefs,
        invoiceAmountTTC: finalAmountTTC, // Utiliser le nouveau montant si fourni
        // Mettre à jour le montant TTC du devis si une facture d'options augmente le total
        ...(finalAmountTTC !== (quote.amountTTC || 0) && { amountTTC: finalAmountTTC })
      },
    })

    // Envoyer l'email de facture avec toutes les URLs sécurisées
    try {
      await sendInvoiceEmail({
        quote: updatedQuote,
        client: quote.client,
        invoices: uploadedInvoices, // Passer le tableau complet
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
          invoices: uploadedInvoices.map(inv => ({
            invoiceRef: inv.invoiceRef,
            label: inv.label,
            fileName: generateObfuscatedFileName(inv.invoiceRef).split('/')[1]
          })),
          recipientEmail: quote.client.email,
          secureUrls: true
        }),
      },
    })

    return NextResponse.json({
      success: true,
      recipientEmail: quote.client.email,
      quoteReference: quote.reference,
      invoiceRef: allRefs,
    })

  } catch (error) {
    console.error('Erreur lors de l\'envoi de la facture:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'envoi de la facture' },
      { status: 500 }
    )
  }
}
