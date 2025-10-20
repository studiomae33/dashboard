import { Resend } from 'resend'
import { prisma } from './prisma'
import { generateValidationToken } from './token'

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Mode développement - utiliser NODE_ENV pour détecter l'environnement
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your-resend-api-key'

interface QuoteEmailData {
  quote: {
    id: string
    reference: string
    desiredStart: Date
    desiredEnd: Date
    background: string
    message?: string | null
    amountTTC?: number | null
  }
  client: {
    firstName: string
    lastName: string
    companyName?: string | null
    email: string
  }
  settings: {
    studioName: string
    studioAddress: string
    studioPhone: string
    studioEmail: string
    senderEmail: string
  }
}

export async function renderDevisEmailHTML(data: QuoteEmailData): Promise<string> {
  const { quote, client, settings } = data
  const clientName = client.companyName || `${client.firstName} ${client.lastName}`
  const validationToken = await generateValidationToken(quote.id)
  
  // S'assurer qu'on a une URL de base valide
  let baseUrl = process.env.NEXTAUTH_URL
  
  if (!baseUrl) {
    // Utiliser l'URL de production Vercel directement
    baseUrl = 'https://dashboard-gamma-smoky-61.vercel.app'
  }
  
  const validationUrl = `${baseUrl}/quote/validate/${validationToken}`
  
  console.log('🔗 Configuration URL:', {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    baseUrl,
    validationUrl
  })

  // Formatage des dates
  const startDate = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  }).format(quote.desiredStart)

  const endTime = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  }).format(quote.desiredEnd)

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Devis ${quote.reference} - Studio MAE</title>
</head>
<body>
    <table style="width: 100%; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; font-family: Arial, sans-serif; color: #333 !important;">
        <tbody>
            <tr>
                <td style="background-color: #060c20 !important; padding: 20px; text-align: center;">
                    <img style="max-width: 100px;" src="https://www.studiomae.fr/images/logo_mail.png" alt="Logo Studio" width="100" height="auto">
                </td>
            </tr>
            <tr>
                <td style="padding: 20px;">
                    <h2 style="margin-top: 0; color: #060c20 !important;">Bonjour,</h2>
                    <p style="color: #333 !important;">
                        Merci de trouver ci-joint le devis relatif à votre réservation. 
                        Vous pouvez le valider de 3 façons :
                    </p>
                    
                    <!-- Bouton de validation en ligne -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${validationUrl}" style="display: inline-block; background-color: #10b981 !important; color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            ✅ Valider le devis en ligne
                        </a>
                    </div>
                    
                    <p style="color: #333 !important; text-align: center; font-size: 14px; margin: 20px 0;">
                        <em>OU</em>
                    </p>
                    
                    <p style="color: #333 !important;">
                        • En nous renvoyant le devis signé en pièce jointe<br>
                        • En répondant simplement à ce mail avec : <em>"Je valide le devis ${quote.reference}"</em>
                    </p>
                    
                    <p style="color: #333 !important;">
                        <strong>📅 Date et heure de la location :</strong><br>
                        ${startDate} – ${endTime}
                    </p>
                    
                    <p style="color: #333 !important;">
                        <strong>🎨 Espace(s) utilisé(s) :</strong><br>
                        ${quote.background}
                    </p>
                    
                    <div style="background: #fff8e1 !important; border-left: 4px solid #ffc107 !important; padding: 12px; margin: 20px 0;">
                        <p style="margin: 0; color: #333 !important;">
                            <strong>⚠️ Durée de location :</strong><br>
                            Merci de noter que le créneau intègre l'installation et la désinstallation du matériel, en plus du shooting. 
                            Toute durée supplémentaire fera l'objet d'une facturation additionnelle.
                            <br><br>
                            <strong>⚠️ Sol du cyclo blanc :</strong><br>
                            Le sol est protégé par une moquette que vous pouvez retirer si nécessaire.<br>
                            Il est repeint avant chaque location pour garantir un rendu propre.<br>
                            En cas de traces ou de dégradations constatées après votre passage, une remise en peinture de <strong>40 € HT</strong> sera facturée.
                            <br><br>
                            <strong>⚠️ Sol des fonds photo :</strong><br>
                            L'utilisation des fonds en arrière-plan est incluse dans la location.<br>
                            Toute utilisation au sol, générant une usure, est considérée comme consommable et fera l'objet d'une facturation de <strong>12,5 € HT par mètre linéaire utilisé (hors mur)</strong>.
                        </p>
                    </div>
                    
                    <p style="color: #333 !important;">
                        <strong>📄 Référence du devis :</strong><br>
                        ${quote.reference}
                    </p>
                    
                    <p style="color: #333 !important;">
                        🧾 <strong>Vous souhaitez modifier l'adresse de facturation ?</strong><br>
                        Il suffit de nous indiquer les informations à corriger dans votre mail signature du devis, 
                        et nous les mettrons à jour directement sur la facture finale.
                    </p>
                    
                    <div style="margin: 25px 0; background: #f1f1f1; border-left: 4px solid #3853ea; padding: 15px;">
                        <p style="margin: 0; color: #333 !important;">
                            📎 <strong>Le devis est joint à ce message au format PDF.</strong><br>
                            Il peut être validé par retour signé ou par une confirmation écrite dans votre réponse.
                        </p>
                    </div>
                    
                    <p style="color: #333 !important;">
                        💡 Dès réception du devis validé, nous vous transmettrons les consignes de paiement par mail.
                    </p>
                    
                    <p style="margin-bottom: 0; color: #333 !important;">Merci pour votre confiance,</p>
                    <p style="margin-top: 5px; color: #333 !important;">L'équipe Studio MAE</p>
                </td>
            </tr>
            <tr>
                <td style="background: #f9f9f9 !important; padding: 15px; font-size: 12px; text-align: center; color: #777 !important;">
                    Studio MAE – 46 rue Promis, 33100 Bordeaux<br>
                    📞 05.54.54.70.93 – 📧 contact@studiomae.fr
                </td>
            </tr>
        </tbody>
    </table>
</body>
</html>`
}

export function renderFactureEmailHTML(data: QuoteEmailData & { 
  invoiceRef: string
  invoiceAmount: number 
}): string {
  const { quote, client, settings, invoiceRef, invoiceAmount } = data
  const clientName = client.companyName || `${client.firstName} ${client.lastName}`

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture ${invoiceRef} - ${settings.studioName}</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: #dc2626; padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; }
        .content { padding: 40px 30px; }
        .title { color: #1f2937; font-size: 24px; font-weight: 600; margin-bottom: 20px; }
        .intro { color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
        .invoice-info { background-color: #fef2f2; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #dc2626; }
        .invoice-info h3 { color: #1f2937; margin-top: 0; margin-bottom: 15px; font-size: 18px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .info-label { font-weight: 600; color: #374151; }
        .info-value { color: #6b7280; }
        .amount-highlight { background-color: #dc2626; color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 20px; font-weight: 600; margin: 30px 0; }
        .footer { background-color: #f3f4f6; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
        .footer-info { margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${settings.studioName}</h1>
        </div>
        
        <div class="content">
            <h2 class="title">Facture ${invoiceRef}</h2>
            
            <p class="intro">
                Bonjour ${clientName},<br><br>
                Nous vous remercions pour la réalisation de votre séance photo.
                Vous trouverez ci-dessous votre facture correspondant au devis ${quote.reference}.
            </p>
            
            <div class="invoice-info">
                <h3>🧾 Informations de facturation</h3>
                <div class="info-row">
                    <span class="info-label">Numéro de facture :</span>
                    <span class="info-value">${invoiceRef}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Devis associé :</span>
                    <span class="info-value">${quote.reference}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Séance réalisée le :</span>
                    <span class="info-value">${new Intl.DateTimeFormat('fr-FR', {
                      dateStyle: 'full',
                      timeZone: 'Europe/Paris'
                    }).format(quote.desiredStart)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Type de fond :</span>
                    <span class="info-value">${quote.background}</span>
                </div>
            </div>
            
            <div class="amount-highlight">
                Montant à régler : ${new Intl.NumberFormat('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR' 
                }).format(invoiceAmount)}
            </div>
            
            <p class="intro">
                Le règlement peut être effectué par virement bancaire ou chèque. 
                Merci de préciser le numéro de facture ${invoiceRef} lors de votre règlement.
            </p>
            
            <p class="intro">
                Nous restons à votre disposition pour toute question concernant cette facture.
            </p>
            
            <p class="intro">
                Merci de votre confiance !<br><br>
                Cordialement,<br>
                L'équipe ${settings.studioName}
            </p>
        </div>
        
        <div class="footer">
            <div class="footer-info"><strong>${settings.studioName}</strong></div>
            <div class="footer-info">${settings.studioAddress}</div>
            <div class="footer-info">📞 ${settings.studioPhone} | ✉️ ${settings.studioEmail}</div>
        </div>
    </div>
</body>
</html>`
}

export function renderPaymentEmailHTML(data: QuoteEmailData & { 
  invoiceRef: string
  paymentDueDate?: string
}): string {
  const { quote, client, settings, invoiceRef, paymentDueDate } = data
  const clientName = client.companyName || `${client.firstName} ${client.lastName}`
  
  // Formatage des dates
  const startDate = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(quote.desiredStart)

  const startTime = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(quote.desiredStart)

  const endTime = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(quote.desiredEnd)

  const amountFormatted = quote.amountTTC 
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(quote.amountTTC)
    : '450,00 €'

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Instructions de paiement - ${settings.studioName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
    <table style="width: 100%; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; font-family: Arial, sans-serif; color: #333;">
        <tbody>
            <tr>
                <td style="background-color: #080e28; padding: 20px; text-align: center;">
                    <img style="max-width: 100px;" src="https://www.studiomae.fr/images/logo_mail.png" alt="Logo Studio" width="100" height="auto">
                </td>
            </tr>
            <tr>
                <td style="padding: 20px;">
                    <h2 style="margin-top: 0; color: #080e28;">Bonjour,</h2>
                    <p>Merci pour la validation de votre devis.<br>Voici les informations de paiement pour finaliser votre réservation au studio :</p>
                    
                    <p><strong>💰 Montant à régler :</strong> ${amountFormatted} TTC</p>
                    
                    ${paymentDueDate ? `
                    <div style="background: #fff3cd; padding: 12px; border-left: 4px solid #ffc107; margin: 20px 0;">
                        <p style="margin: 0;">⚠️ <strong>Merci de procéder au paiement <u>au plus tard le ${paymentDueDate}.</u></strong><br>La facture définitive vous sera transmise après votre passage au studio.</p>
                    </div>
                    ` : ''}
                    
                    <div style="background: #f1f1f1; padding: 12px; border-left: 4px solid #3853ea; margin: 25px 0;">
                        <p style="margin: 0;">
                            <strong>📅 Séance :</strong> ${startDate} – ${startTime} à ${endTime}<br>
                            <strong>🎨 Fond(s) utilisé(s) :</strong> ${quote.background}<br>
                            <strong>📄 Réf. devis :</strong> ${quote.reference}
                        </p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;">
                    
                    <h3 style="color: #080e28;">💳 Paiement par virement bancaire</h3>
                    <table style="border: 1px solid #e0e0e0; padding: 10px; margin: 10px 0; width: 100%;">
                        <tbody>
                            <tr>
                                <td style="padding: 5px;"><strong>Bénéficiaire :</strong></td>
                                <td style="padding: 5px;">BIPELEC</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px;"><strong>IBAN :</strong></td>
                                <td style="padding: 5px;">FR76 1870 6000 0097 5066 6969 792</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px;"><strong>BIC :</strong></td>
                                <td style="padding: 5px;">AGRIFRPP887</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px;"><strong>Objet :</strong></td>
                                <td style="padding: 5px;">${invoiceRef}</td>
                            </tr>
                        </tbody>
                    </table>
                    <p style="margin: 10px 0 25px;"><em>Merci d'indiquer la référence en objet du virement pour un traitement rapide.</em></p>
                    
                    <div style="background: #e8f4ff; padding: 12px; border-left: 4px solid #3853ea; margin: 20px 0;">
                        <p style="margin: 0;">📧 Merci de bien vouloir <strong>envoyer la preuve de virement en réponse à cet email</strong> afin de valider définitivement votre réservation.</p>
                    </div>
                    
                    <p style="margin-top: 20px;">✅ Le paiement fait office de confirmation définitive de votre réservation.</p>
                    
                    <p style="margin-top: 20px;">❓ Une question ? Écrivez-nous à <a href="mailto:${settings.studioEmail}">${settings.studioEmail}</a> ou appelez-nous au ${settings.studioPhone}.</p>
                    
                    <p>Nous restons disponibles si vous avez la moindre question.</p>
                    <p style="margin-bottom: 0;">À très bientôt,</p>
                    <p style="margin-top: 5px;">L'équipe Studio MAE</p>
                </td>
            </tr>
            <tr>
                <td style="background: #f9f9f9; padding: 15px; font-size: 12px; text-align: center; color: #777;">
                    Studio MAE – 46 rue Promis, 33100 Bordeaux<br>
                    📞 ${settings.studioPhone} – 📧 ${settings.studioEmail}
                </td>
            </tr>
        </tbody>
    </table>
</body>
</html>`
}

export async function sendQuoteEmail(quoteId: string, pdfPath?: string) {
  const quote = await prisma.quoteRequest.findUnique({
    where: { id: quoteId },
    include: { client: true }
  })

  if (!quote) {
    throw new Error('Devis non trouvé')
  }

  const settings = await prisma.settings.findUnique({
    where: { id: 'singleton' }
  })

  if (!settings) {
    throw new Error('Configuration manquante')
  }

  const emailData = {
    quote,
    client: quote.client,
    settings
  }

  const htmlContent = await renderDevisEmailHTML(emailData)

  const attachments = []
  if (pdfPath) {
    try {
      if (pdfPath.startsWith('http')) {
        // URL Vercel Blob - télécharger le fichier
        console.log('📎 Téléchargement PDF depuis Vercel Blob:', pdfPath)
        const response = await fetch(pdfPath)
        if (response.ok) {
          const pdfBuffer = await response.arrayBuffer()
          attachments.push({
            filename: `devis-${quote.reference}.pdf`,
            content: Buffer.from(pdfBuffer),
          })
          console.log('✅ PDF récupéré depuis Vercel Blob')
        } else {
          console.warn('⚠️ Impossible de télécharger le PDF depuis Vercel Blob')
        }
      } else {
        // Fichier local (développement)
        const fs = require('fs')
        const path = require('path')
        const fullPath = path.join(process.cwd(), 'public', pdfPath.replace('/uploads/', 'uploads/'))
        
        if (fs.existsSync(fullPath)) {
          attachments.push({
            filename: `devis-${quote.reference}.pdf`,
            content: fs.readFileSync(fullPath),
          })
          console.log('✅ PDF récupéré depuis le système de fichiers local')
        } else {
          console.warn('⚠️ Fichier PDF local non trouvé:', fullPath)
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du PDF:', error)
    }
  }

  const emailOptions: any = {
    from: `${settings.studioName} <${settings.senderEmail}>`,
    to: quote.client.email,
    subject: `Devis ${quote.reference} - ${settings.studioName}`,
    html: htmlContent,
  }

  if (attachments.length > 0) {
    emailOptions.attachments = attachments
  }

  let result
  
  console.log('📧 Préparation envoi email:', {
    from: emailOptions.from,
    to: emailOptions.to,
    subject: emailOptions.subject,
    hasAttachments: attachments.length > 0,
    attachmentCount: attachments.length,
    isDevelopment,
    hasResend: !!resend,
    NODE_ENV: process.env.NODE_ENV,
    RESEND_API_KEY_EXISTS: !!process.env.RESEND_API_KEY,
    RESEND_API_KEY_LENGTH: process.env.RESEND_API_KEY?.length
  })

  if (isDevelopment || !resend) {
    // Mode développement ou pas de clé API - afficher l'email dans la console
    console.log('\n=== EMAIL DE DEVIS (MODE DÉVELOPPEMENT) ===')
    console.log('De:', emailOptions.from)
    console.log('À:', emailOptions.to)
    console.log('Sujet:', emailOptions.subject)
    console.log('Pièces jointes:', attachments.length > 0 ? `${attachments.length} fichier(s)` : 'Aucune')
    console.log('HTML Content:')
    console.log(htmlContent.substring(0, 500) + '...')
    console.log('===========================================\n')
    
    // Simuler une réponse réussie
    result = { data: { id: 'dev-' + Date.now() } }
  } else {
    console.log('🚀 Envoi via Resend API...')
    result = await resend.emails.send(emailOptions)
    console.log('✅ Réponse Resend:', result)
  }

  // Mettre à jour le statut du devis
  await prisma.quoteRequest.update({
    where: { id: quoteId },
    data: {
      status: 'SENT',
      sentAt: new Date(),
    }
  })

  // Créer automatiquement la réservation dans le calendrier si elle n'existe pas
  const existingBooking = await prisma.booking.findUnique({
    where: { quoteRequestId: quoteId }
  })
  
  if (!existingBooking) {
    const clientName = quote.client.companyName || `${quote.client.firstName} ${quote.client.lastName}`
    await prisma.booking.create({
      data: {
        quoteRequestId: quoteId,
        start: quote.desiredStart,
        end: quote.desiredEnd,
        background: quote.background,
        title: `Réservation ${clientName} - ${quote.reference}`,
      }
    })
    console.log('✅ Réservation créée automatiquement')
  } else {
    console.log('ℹ️ Réservation déjà existante, pas de création')
  }

  // Log de l'événement
  await prisma.eventLog.create({
    data: {
      entityType: 'QUOTE',
      entityId: quoteId,
      action: 'EMAIL_SENT',
      payload: JSON.stringify({ 
        to: quote.client.email,
        messageId: result.data?.id 
      }),
    }
  })

  // Log de la création de réservation (seulement si une nouvelle réservation a été créée)
  if (!existingBooking) {
    const clientName = quote.client.companyName || `${quote.client.firstName} ${quote.client.lastName}`
    await prisma.eventLog.create({
      data: {
        entityType: 'BOOKING',
        entityId: quoteId, // On utilise l'ID du devis comme référence
        action: 'BOOKING_CREATED',
        payload: JSON.stringify({ 
          clientName,
          reference: quote.reference,
          start: quote.desiredStart,
          end: quote.desiredEnd,
          background: quote.background
        }),
      }
    })
  }

  return result
}

export async function sendPaymentEmail(quoteId: string, invoiceRef: string, paymentDueDate?: string) {
  const quote = await prisma.quoteRequest.findUnique({
    where: { id: quoteId },
    include: { client: true }
  })

  if (!quote) {
    throw new Error('Devis non trouvé')
  }

  const settings = await prisma.settings.findUnique({
    where: { id: 'singleton' }
  })

  if (!settings) {
    throw new Error('Configuration manquante')
  }

  const emailData = {
    quote,
    client: quote.client,
    settings,
    invoiceRef,
    paymentDueDate
  }

  const htmlContent = renderPaymentEmailHTML(emailData)

  const emailOptions: any = {
    from: `${settings.studioName} <${settings.senderEmail}>`,
    to: quote.client.email,
    subject: `Instructions de paiement - Devis ${quote.reference} - ${settings.studioName}`,
    html: htmlContent,
  }

  let result
  
  console.log('📧 Préparation envoi email de paiement:', {
    from: emailOptions.from,
    to: emailOptions.to,
    subject: emailOptions.subject,
    isDevelopment,
    hasResend: !!resend,
    NODE_ENV: process.env.NODE_ENV,
    RESEND_API_KEY_EXISTS: !!process.env.RESEND_API_KEY,
    RESEND_API_KEY_LENGTH: process.env.RESEND_API_KEY?.length
  })

  if (isDevelopment || !resend) {
    // Mode développement ou pas de clé API - afficher l'email dans la console
    console.log('\n=== EMAIL DE PAIEMENT (MODE DÉVELOPPEMENT) ===')
    console.log('De:', emailOptions.from)
    console.log('À:', emailOptions.to)
    console.log('Sujet:', emailOptions.subject)
    console.log('HTML Content:')
    console.log(htmlContent.substring(0, 500) + '...')
    console.log('===========================================\n')
    
    // Simuler une réponse réussie
    result = { data: { id: 'dev-' + Date.now() } }
  } else {
    console.log('🚀 Envoi email de paiement via Resend API...')
    result = await resend.emails.send(emailOptions)
    console.log('✅ Réponse Resend:', result)
  }

  // Mettre à jour le statut du devis pour indiquer qu'un email de paiement a été envoyé
  await prisma.quoteRequest.update({
    where: { id: quoteId },
    data: {
      status: 'PAYMENT_PENDING', // Nouveau statut
    }
  })

  // Log de l'événement
  await prisma.eventLog.create({
    data: {
      entityType: 'QUOTE',
      entityId: quoteId,
      action: 'PAYMENT_EMAIL_SENT',
      payload: JSON.stringify({ 
        invoiceRef,
        paymentDueDate,
        sentAt: new Date().toISOString(),
        recipientEmail: quote.client.email
      }),
    }
  })

  console.log('✅ Email de paiement envoyé avec succès')
  return result?.data || { id: 'fallback-' + Date.now() }
}
