import { Resend } from 'resend'
import { prisma } from './prisma'
import { generateValidationToken, generateBookingInfoToken } from './token'

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Mode développement - forcer l'envoi en production même sans clé API (pour debug)
const isDevelopment = process.env.NODE_ENV === 'development'

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

interface EquipmentRequestEmailData {
  equipmentRequest: {
    id: string
    equipment: string
    validationToken: string
  }
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

interface LocationReminderEmailData {
  booking: {
    id: string
    start: Date
    end: Date
    background: string
  }
  quote: {
    id: string
    reference: string
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
<table style="width: 100%; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; font-family: Arial, sans-serif; color: #333 !important;">
<tbody>
<tr>
<td style="background-color: #060c20 !important; padding: 20px; text-align: center;"><img style="max-width: 100px;" src="https://www.studiomae.fr/images/logo_mail.png" alt="Logo Studio"></td>
</tr>
<tr>
<td style="padding: 20px;">
<h2 style="margin-top: 0; color: #060c20 !important;">Bonjour ${clientName} !</h2>

<p style="color: #333 !important;">Merci de trouver ci-joint votre devis personnalisé pour votre location du Studio MAE. Nous avons préparé cette proposition avec soin selon vos besoins spécifiques.</p>

<div style="text-align: center; margin: 32px 0; padding: 24px; background: #f7fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
<h3 style="margin-bottom: 16px; color: #2d3748; font-weight: 600;">Validation de votre devis</h3>
<a href="${validationUrl}" style="display: inline-block; background: #48bb78; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">📋 Voir les conditions et valider le devis</a>
<p style="margin-top: 16px; color: #718096; font-size: 14px;">Validation sécurisée et immédiate</p>
</div>

<div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 20px 0;">
<div style="display: flex; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
<div style="font-size: 20px; margin-right: 12px; min-width: 32px;">📅</div>
<div>
<h4 style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 16px;">Séance programmée</h4>
<p style="color: #4a5568; margin: 0; font-size: 15px;">${startDate} • ${endTime}</p>
</div>
</div>

<div style="display: flex; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
<div style="font-size: 20px; margin-right: 12px; min-width: 32px;">🎨</div>
<div>
<h4 style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 16px;">Configuration studio</h4>
<p style="color: #4a5568; margin: 0; font-size: 15px;">${quote.background}</p>
</div>
</div>

<div style="display: flex; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
<div style="font-size: 20px; margin-right: 12px; min-width: 32px;">💰</div>
<div>
<h4 style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 16px;">Tarif</h4>
<p style="color: #4a5568; margin: 0; font-size: 15px;">${quote.amountTTC ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(quote.amountTTC) : '450,00 €'} TTC</p>
</div>
</div>

<div style="display: flex; align-items: flex-start;">
<div style="font-size: 20px; margin-right: 12px; min-width: 32px;">📄</div>
<div>
<h4 style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 16px;">Référence devis</h4>
<p style="color: #4a5568; margin: 0; font-size: 15px; font-family: 'Courier New', monospace;">${quote.reference}</p>
</div>
</div>
</div>

<div style="background: #ebf8ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 8px 8px 0; margin: 24px 0;">
<p style="margin: 0; color: #1e40af; font-weight: 500;"><strong>📋 Conditions et informations détaillées</strong><br>
Retrouvez toutes les informations nécessaires à votre location (conditions, tarifs, modalités) directement dans le lien de validation du devis ci-dessus.</p>
</div>

<div style="background: #f0fff4; border-left: 4px solid #10b981; padding: 20px; border-radius: 0 8px 8px 0; margin: 32px 0;">
<p style="margin: 0; color: #059669; font-weight: 500;"><strong>💡 Prochaine étape</strong><br>
Dès réception de votre validation, nous vous transmettrons immédiatement les instructions de paiement par email.</p>
</div>

<div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
<p style="color: #4a5568; font-weight: 500;">
Merci pour votre confiance,<br>
<strong>L'équipe Studio MAE</strong>
</p>
</div>
</td>
</tr>
<tr>
<td style="background: #f9f9f9 !important; padding: 15px; font-size: 12px; text-align: center; color: #777 !important;"><strong>Studio MAE</strong><br>46 rue Promis, 33100 Bordeaux<br>📞 05.54.54.70.93 • ✉️ contact@studiomae.fr</td>
</tr>
</tbody>
</table>`
}

export function renderEquipmentRequestEmailHTML(data: EquipmentRequestEmailData): string {
  const { equipmentRequest, quote, client, settings } = data
  const clientName = client.companyName || `${client.firstName} ${client.lastName}`
  
  // S'assurer qu'on a une URL de base valide
  let baseUrl = process.env.NEXTAUTH_URL
  
  if (!baseUrl) {
    // Utiliser l'URL de production Vercel directement
    baseUrl = 'https://dashboard-gamma-smoky-61.vercel.app'
  }
  
  const confirmUrl = `${baseUrl}/api/equipment/validate/${equipmentRequest.validationToken}/confirm`
  const rejectUrl = `${baseUrl}/api/equipment/validate/${equipmentRequest.validationToken}/reject`
  
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
    <title>Demande de location de matériel - ${quote.reference}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 20px;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #060c20; padding: 40px 30px; text-align: center;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="color: #ffffff; font-size: 24px; font-weight: bold; margin-bottom: 8px;">
                                        📦 Demande de location de matériel
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color: #ffffff; font-size: 16px; opacity: 0.9; padding-top: 8px;">
                                        Devis ${quote.reference}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <!-- Greeting -->
                                <tr>
                                    <td style="font-size: 28px; font-weight: bold; color: #333333; padding-bottom: 24px;">
                                        Nouvelle demande de location
                                    </td>
                                </tr>
                                
                                <!-- Intro text -->
                                <tr>
                                    <td style="color: #666666; line-height: 1.7; padding-bottom: 32px;">
                                        Bonjour,<br><br>
                                        Vous avez reçu une nouvelle demande de location de matériel pour une séance photo au ${settings.studioName}.<br>
                                        Merci de confirmer ou refuser la disponibilité du matériel demandé.
                                    </td>
                                </tr>
                                
                                <!-- Info Section -->
                                <tr>
                                    <td style="padding-bottom: 32px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
                                            <tr>
                                                <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9;">
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="width: 32px; font-size: 20px; vertical-align: top; padding-right: 12px;">👤</td>
                                                            <td>
                                                                <div style="font-weight: bold; color: #2d3748; margin-bottom: 4px; font-size: 16px;">Client</div>
                                                                <div style="color: #4a5568; font-size: 15px;">${clientName}</div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9;">
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="width: 32px; font-size: 20px; vertical-align: top; padding-right: 12px;">📋</td>
                                                            <td>
                                                                <div style="font-weight: bold; color: #2d3748; margin-bottom: 4px; font-size: 16px;">Référence devis</div>
                                                                <div style="color: #4a5568; font-size: 15px;">${quote.reference}</div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9;">
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="width: 32px; font-size: 20px; vertical-align: top; padding-right: 12px;">📅</td>
                                                            <td>
                                                                <div style="font-weight: bold; color: #2d3748; margin-bottom: 4px; font-size: 16px;">Date de la séance</div>
                                                                <div style="color: #4a5568; font-size: 15px;">${startDate} • ${endTime}</div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 16px;">
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="width: 32px; font-size: 20px; vertical-align: top; padding-right: 12px;">🎨</td>
                                                            <td>
                                                                <div style="font-weight: bold; color: #2d3748; margin-bottom: 4px; font-size: 16px;">Configuration studio</div>
                                                                <div style="color: #4a5568; font-size: 15px;">${quote.background}</div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Equipment Section -->
                                <tr>
                                    <td style="padding-bottom: 32px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0fff4; border: 2px solid #16a34a; border-radius: 8px;">
                                            <tr>
                                                <td style="padding: 24px;">
                                                    <div style="color: #15803d; font-weight: bold; font-size: 18px; margin-bottom: 16px;">
                                                        📦 Matériel demandé
                                                    </div>
                                                    <div style="background-color: #ffffff; border-radius: 8px; padding: 16px; color: #374151; white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.5;">
                                                        ${equipmentRequest.equipment}
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Action Section -->
                                <tr>
                                    <td style="padding-bottom: 32px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px;">
                                            <tr>
                                                <td style="padding: 32px; text-align: center;">
                                                    <div style="color: #92400e; font-weight: bold; font-size: 20px; margin-bottom: 16px;">
                                                        Confirmez-vous la disponibilité ?
                                                    </div>
                                                    <div style="color: #a16207; margin-bottom: 24px; font-size: 16px;">
                                                        Cliquez sur l'un des boutons ci-dessous pour répondre à cette demande
                                                    </div>
                                                    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                                                        <tr>
                                                            <td style="padding-right: 8px;">
                                                                <table cellpadding="0" cellspacing="0" border="0">
                                                                    <tr>
                                                                        <td style="background-color: #16a34a; border-radius: 6px; text-align: center;">
                                                                            <a href="${confirmUrl}" 
                                                                               style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; min-width: 140px;">
                                                                                ✅ Confirmer la disponibilité
                                                                            </a>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                            <td style="padding-left: 8px;">
                                                                <table cellpadding="0" cellspacing="0" border="0">
                                                                    <tr>
                                                                        <td style="background-color: #dc2626; border-radius: 6px; text-align: center;">
                                                                            <a href="${rejectUrl}" 
                                                                               style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; min-width: 140px;">
                                                                                ❌ Matériel non disponible
                                                                            </a>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Footer note -->
                                <tr>
                                    <td style="padding-bottom: 32px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ebf8ff; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0;">
                                            <tr>
                                                <td style="padding: 20px; color: #1e40af; font-weight: 500;">
                                                    <strong>💡 Important</strong><br>
                                                    Une fois votre réponse donnée, le studio sera automatiquement notifié et pourra informer le client de la disponibilité du matériel.
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #060c20; padding: 24px 30px; text-align: center; color: #ffffff; font-size: 14px; line-height: 1.8;">
                            <strong>Demande envoyée par ${settings.studioName}</strong><br>
                            ${settings.studioAddress}<br>
                            📞 ${settings.studioPhone} • ✉️ ${settings.studioEmail}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
}

export async function sendEquipmentRequestEmail(equipmentRequestId: string) {
  const equipmentRequest = await prisma.equipmentRequest.findUnique({
    where: { id: equipmentRequestId },
    include: {
      quoteRequest: {
        include: { client: true }
      }
    }
  })

  if (!equipmentRequest) {
    throw new Error('Demande de location non trouvée')
  }

  const settings = await prisma.settings.findUnique({
    where: { id: 'singleton' }
  })

  if (!settings) {
    throw new Error('Configuration manquante')
  }

  const emailData = {
    equipmentRequest: {
      id: equipmentRequest.id,
      equipment: equipmentRequest.equipment,
      validationToken: equipmentRequest.validationToken || ''
    },
    quote: {
      id: equipmentRequest.quoteRequest.id,
      reference: equipmentRequest.quoteRequest.reference,
      desiredStart: equipmentRequest.quoteRequest.desiredStart,
      desiredEnd: equipmentRequest.quoteRequest.desiredEnd,
      background: equipmentRequest.quoteRequest.background,
      message: equipmentRequest.quoteRequest.message,
      amountTTC: equipmentRequest.quoteRequest.amountTTC
    },
    client: equipmentRequest.quoteRequest.client,
    settings: {
      studioName: settings.studioName,
      studioAddress: settings.studioAddress,
      studioPhone: settings.studioPhone,
      studioEmail: settings.studioEmail,
      senderEmail: settings.senderEmail
    }
  }

  const htmlContent = renderEquipmentRequestEmailHTML(emailData)

  const emailOptions: any = {
    from: `${settings.studioName} <devis@mail.studiomae.fr>`,
    to: 'david.poirout@prise2son.fr', // Email du loueur
    replyTo: settings.studioEmail, // Rediriger les réponses vers l'email principal du studio
    subject: `📦 Demande de location matériel - ${equipmentRequest.quoteRequest.reference}`,
    html: htmlContent,
  }

  let result
  
  console.log('📧 Préparation envoi email demande de location:', {
    from: emailOptions.from,
    to: emailOptions.to,
    subject: emailOptions.subject,
    isDevelopment,
    hasResend: !!resend,
    NODE_ENV: process.env.NODE_ENV,
    RESEND_API_KEY_EXISTS: !!process.env.RESEND_API_KEY
  })

  if (isDevelopment) {
    // Mode développement - afficher l'email dans la console
    console.log('\n=== EMAIL DEMANDE LOCATION (MODE DÉVELOPPEMENT) ===')
    console.log('De:', emailOptions.from)
    console.log('À:', emailOptions.to)
    console.log('Sujet:', emailOptions.subject)
    console.log('HTML Content:')
    console.log(htmlContent.substring(0, 500) + '...')
    console.log('================================================\n')
    
    // Simuler une réponse réussie
    result = { data: { id: 'dev-' + Date.now() } }
  } else if (!resend) {
    // Production mais pas de clé API Resend
    console.error('❌ ERREUR: Pas de clé API Resend pour demande de location!')
    throw new Error('Configuration email manquante en production')
  } else {
    console.log('🚀 Envoi demande de location via Resend API...')
    result = await resend.emails.send(emailOptions)
    console.log('✅ Réponse Resend:', result)
  }

  console.log('✅ Email de demande de location envoyé avec succès')
  return result?.data || { id: 'fallback-' + Date.now() }
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
    replyTo: settings.studioEmail, // Rediriger les réponses vers l'email principal du studio
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

  if (isDevelopment) {
    // Mode développement - afficher l'email dans la console
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
  } else if (!resend) {
    // Production mais pas de clé API Resend
    console.error('❌ ERREUR: Pas de clé API Resend en production!')
    console.log('Variables d\'environnement:', {
      NODE_ENV: process.env.NODE_ENV,
      RESEND_API_KEY_EXISTS: !!process.env.RESEND_API_KEY,
      RESEND_API_KEY_LENGTH: process.env.RESEND_API_KEY?.length
    })
    throw new Error('Configuration email manquante en production')
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

export async function sendPaymentEmail(quoteId: string, invoiceRef: string, paymentDueDate?: string, paymentLink?: string) {
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
    paymentDueDate,
    paymentLink
  }

  const htmlContent = renderPaymentEmailHTML(emailData)

  const emailOptions: any = {
    from: `${settings.studioName} <${settings.senderEmail}>`,
    to: quote.client.email,
    replyTo: settings.studioEmail, // Rediriger les réponses vers l'email principal du studio
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

  if (isDevelopment) {
    // Mode développement - afficher l'email dans la console
    console.log('\n=== EMAIL DE PAIEMENT (MODE DÉVELOPPEMENT) ===')
    console.log('De:', emailOptions.from)
    console.log('À:', emailOptions.to)
    console.log('Sujet:', emailOptions.subject)
    console.log('HTML Content:')
    console.log(htmlContent.substring(0, 500) + '...')
    console.log('===========================================\n')
    
    // Simuler une réponse réussie
    result = { data: { id: 'dev-' + Date.now() } }
  } else if (!resend) {
    // Production mais pas de clé API Resend
    console.error('❌ ERREUR: Pas de clé API Resend pour email de paiement!')
    throw new Error('Configuration email manquante en production')
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

export async function sendOnsitePaymentEmail(quoteId: string) {
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

  const htmlContent = renderOnsitePaymentEmailHTML(emailData)

  const emailOptions: any = {
    from: `${settings.studioName} <${settings.senderEmail}>`,
    to: quote.client.email,
    replyTo: settings.studioEmail,
    subject: `Instructions de paiement sur place - Devis ${quote.reference} - ${settings.studioName}`,
    html: htmlContent,
  }

  let result
  
  console.log('📧 Préparation envoi email de paiement sur place:', {
    from: emailOptions.from,
    to: emailOptions.to,
    subject: emailOptions.subject,
    isDevelopment,
    hasResend: !!resend,
    NODE_ENV: process.env.NODE_ENV,
    RESEND_API_KEY_EXISTS: !!process.env.RESEND_API_KEY,
    RESEND_API_KEY_LENGTH: process.env.RESEND_API_KEY?.length
  })

  if (isDevelopment) {
    // Mode développement - afficher l'email dans la console
    console.log('\n=== EMAIL DE PAIEMENT SUR PLACE (MODE DÉVELOPPEMENT) ===')
    console.log('De:', emailOptions.from)
    console.log('À:', emailOptions.to)
    console.log('Sujet:', emailOptions.subject)
    console.log('HTML Content:')
    console.log(htmlContent.substring(0, 500) + '...')
    console.log('=======================================================\n')
    
    // Simuler une réponse réussie
    result = { data: { id: 'dev-onsite-' + Date.now() } }
  } else if (!resend) {
    // Production mais pas de clé API Resend
    console.error('❌ ERREUR: Pas de clé API Resend pour email de paiement sur place!')
    throw new Error('Configuration email manquante en production')
  } else {
    console.log('🚀 Envoi email de paiement sur place via Resend API...')
    result = await resend.emails.send(emailOptions)
    console.log('✅ Réponse Resend:', result)
  }

  // Mettre à jour le statut du devis pour indiquer qu'un email de paiement a été envoyé
  await prisma.quoteRequest.update({
    where: { id: quoteId },
    data: {
      status: 'PAYMENT_PENDING',
    }
  })

  // Log de l'événement
  await prisma.eventLog.create({
    data: {
      entityType: 'QUOTE',
      entityId: quoteId,
      action: 'ONSITE_PAYMENT_EMAIL_SENT',
      payload: JSON.stringify({ 
        sentAt: new Date().toISOString(),
        recipientEmail: quote.client.email
      }),
    }
  })

  console.log('✅ Email de paiement sur place envoyé avec succès')
  return result?.data || { id: 'fallback-onsite-' + Date.now() }
}

export function renderPaymentEmailHTML(data: QuoteEmailData & { 
  invoiceRef: string
  paymentDueDate?: string
  paymentLink?: string
}): string {
  const { quote, client, settings, invoiceRef, paymentDueDate, paymentLink } = data
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
<table style="width: 100%; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; font-family: Arial, sans-serif; color: #333 !important;">
<tbody>
<tr>
<td style="background-color: #060c20 !important; padding: 20px; text-align: center;"><img style="max-width: 100px;" src="https://www.studiomae.fr/images/logo_mail.png" alt="Logo Studio"></td>
</tr>
<tr>
<td style="padding: 20px;">
<h2 style="margin-top: 0; color: #060c20 !important;">Instructions de paiement</h2>

<p style="color: #333 !important;">Bonjour <strong>${clientName}</strong>,<br><br>Merci d'avoir validé votre devis ! Pour finaliser votre réservation au studio, voici les informations nécessaires pour effectuer votre paiement.</p>

<div style="text-align: center; margin: 32px 0; padding: 24px; background: #48bb78; border-radius: 8px; color: white;">
<div style="font-size: 16px; margin-bottom: 8px;">Montant à régler</div>
<div style="font-size: 32px; font-weight: 700; margin: 0;">${amountFormatted}</div>
</div>

${paymentDueDate ? `
<div style="background: #fff8e1 !important; border-left: 4px solid #ffc107 !important; padding: 12px; margin: 20px 0;">
<p style="margin: 0; color: #333 !important;"><strong>⚠️ Date limite de paiement : ${paymentDueDate}</strong><br>Merci de procéder au paiement avant cette date pour confirmer votre réservation.</p>
</div>
` : ''}

<div style="text-align: center; margin: 32px 0;">
<a href="${paymentLink}" style="display: inline-block; background: #48bb78; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">💳 Payer la location</a>
<p style="margin-top: 16px; font-size: 14px; color: #666;">Paiement sécurisé par SumUp</p>
</div>

<div style="margin: 25px 0; background: #f1f1f1; border-left: 4px solid #3853ea; padding: 15px;">
<p style="margin: 0; color: #333 !important;"><strong>💡 Pour finaliser votre réservation :</strong><br>Cliquez sur le bouton "Payer la location" ci-dessus pour accéder au paiement sécurisé. Votre réservation sera automatiquement confirmée après validation du paiement.</p>
</div>

<p style="color: #333 !important;">À très bientôt au studio !<br><strong>L'équipe ${settings.studioName}</strong></p>

<div style="margin: 20px 0; padding: 12px; background: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666;">
💡 <strong>Vous pouvez répondre directement à cet email</strong> - vos messages seront reçus par notre équipe.
</div>
</td>
</tr>
<tr>
<td style="background: #f9f9f9 !important; padding: 15px; font-size: 12px; text-align: center; color: #777 !important;"><strong>${settings.studioName}</strong><br>${settings.studioAddress}<br>📞 ${settings.studioPhone} • 📧 ${settings.studioEmail}</td>
</tr>
</tbody>
</table>`
}

export function renderOnsitePaymentEmailHTML(data: QuoteEmailData): string {
  const { quote, client, settings } = data
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
<table style="width: 100%; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; font-family: Arial, sans-serif; color: #333 !important;">
<tbody>
<tr>
<td style="background-color: #060c20 !important; padding: 20px; text-align: center;"><img style="max-width: 100px;" src="https://www.studiomae.fr/images/logo_mail.png" alt="Logo Studio"></td>
</tr>
<tr>
<td style="padding: 20px;">
<h2 style="margin-top: 0; color: #060c20 !important;">Instructions de paiement</h2>

<p style="color: #333 !important;">Bonjour <strong>${clientName}</strong>,<br><br>Merci d'avoir validé votre devis ! Votre réservation au studio est confirmée.</p>

<div style="text-align: center; margin: 32px 0; padding: 24px; background: #48bb78; border-radius: 8px; color: white;">
<div style="font-size: 16px; margin-bottom: 8px;">Montant à régler</div>
<div style="font-size: 32px; font-weight: 700; margin: 0;">${amountFormatted}</div>
</div>

<div style="margin: 25px 0; background: #f1f1f1; border-left: 4px solid #f59e0b; padding: 15px;">
<p style="margin: 0; color: #333 !important;"><strong>💳 Mode de paiement :</strong><br>Le paiement devra être effectué sur place le jour de la location par carte bancaire. Aucun paiement à l'avance n'est requis.</p>
</div>

<div style="margin: 25px 0; background: #e1f5fe; border-left: 4px solid #3853ea; padding: 15px;">
<p style="margin: 0; color: #333 !important;"><strong>📅 Rappel de votre réservation :</strong><br>
<strong>Date :</strong> ${startDate}<br>
<strong>Horaires :</strong> ${startTime} - ${endTime}<br>
<strong>Devis :</strong> ${quote.reference}<br>
<strong>Montant :</strong> ${amountFormatted}</p>
</div>

<p style="color: #333 !important;">Nous vous attendons avec plaisir au studio !<br><strong>L'équipe ${settings.studioName}</strong></p>

<div style="margin: 20px 0; padding: 12px; background: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666;">
💡 <strong>Vous pouvez répondre directement à cet email</strong> - vos messages seront reçus par notre équipe.
</div>
</td>
</tr>
<tr>
<td style="background: #f9f9f9 !important; padding: 15px; font-size: 12px; text-align: center; color: #777 !important;"><strong>${settings.studioName}</strong><br>${settings.studioAddress}<br>📞 ${settings.studioPhone} • 📧 ${settings.studioEmail}</td>
</tr>
</tbody>
</table>`
}

export function renderDateChangeEmailHTML(data: QuoteEmailData & {
  oldStartDate: Date
  oldEndDate: Date
  newStartDate: Date
  newEndDate: Date
}): string {
  const { quote, client, settings, oldStartDate, oldEndDate, newStartDate, newEndDate } = data
  const clientName = client.companyName || `${client.firstName} ${client.lastName}`

  // Formatage des dates
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris'
    }).format(date)
  }

  const oldStartFormatted = formatDateTime(oldStartDate)
  const oldEndFormatted = formatDateTime(oldEndDate)
  const newStartFormatted = formatDateTime(newStartDate)
  const newEndFormatted = formatDateTime(newEndDate)

  return `
<table style="width: 100%; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; font-family: Arial, sans-serif; color: #333 !important;">
<tbody>
<tr>
<td style="background-color: #060c20 !important; padding: 20px; text-align: center;"><img style="max-width: 100px;" src="https://www.studiomae.fr/images/logo_mail.png" alt="Logo Studio"></td>
</tr>
<tr>
<td style="padding: 20px;">
<h2 style="margin-top: 0; color: #060c20 !important;">📅 Modification de réservation</h2>
<p style="margin: 5px 0 20px 0; color: #666; font-size: 14px;">Référence ${quote.reference}</p>

<h3 style="color: #060c20 !important;">Bonjour ${client.firstName},</h3>

<p style="color: #333 !important;">Nous vous confirmons que nous avons bien pris en compte votre demande de modification des dates pour votre réservation <strong>${quote.reference}</strong>.</p>

<div style="background: #f0fff4; border-left: 4px solid #10b981; padding: 20px; border-radius: 0 8px 8px 0; margin: 32px 0; text-align: center;">
<h3 style="color: #059669; font-size: 20px; font-weight: 600; margin-bottom: 8px;">✅ Modification confirmée</h3>
<p style="color: #047857; font-size: 16px; margin: 0;">Vos nouvelles dates sont maintenant réservées et confirmées dans notre planning.</p>
</div>

<div style="background: #f7fafc; border-radius: 8px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0;">
<div style="font-size: 18px; font-weight: 600; color: #2d3748; margin-bottom: 24px; text-align: center;">Récapitulatif des modifications</div>

<div style="padding: 20px; border-radius: 8px; text-align: center; background: #fef2f2; border: 1px solid #fecaca; margin-bottom: 16px;">
<div style="font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; color: #dc2626;">❌ Anciennes dates</div>
<div style="font-size: 16px; font-weight: 500; margin-bottom: 4px; color: #2d3748;">${oldStartFormatted}</div>
<div style="font-size: 14px; color: #4a5568;">au ${oldEndFormatted}</div>
</div>

<div style="text-align: center; margin: 16px 0;">
<div style="font-size: 24px; color: #ed8936;">⬇️</div>
</div>

<div style="padding: 20px; border-radius: 8px; text-align: center; background: #f0fdf4; border: 1px solid #bbf7d0;">
<div style="font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; color: #16a34a;">✅ Nouvelles dates confirmées</div>
<div style="font-size: 16px; font-weight: 500; margin-bottom: 4px; color: #2d3748;">${newStartFormatted}</div>
<div style="font-size: 14px; color: #4a5568;">au ${newEndFormatted}</div>
</div>
</div>

<p style="margin-top: 32px; text-align: center; color: #333 !important;">
Merci pour votre confiance,<br>
<strong>L'équipe ${settings.studioName}</strong>
</p>
</td>
</tr>
<tr>
<td style="background: #f9f9f9 !important; padding: 15px; font-size: 12px; text-align: center; color: #777 !important;"><strong>${settings.studioName}</strong><br>${settings.studioAddress}<br>📞 ${settings.studioPhone} • ✉️ ${settings.studioEmail}</td>
</tr>
</tbody>
</table>
  `
}

export async function sendPaymentReminderEmail(quoteId: string, invoiceRef: string, paymentDueDate?: string, paymentLink?: string) {
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
    paymentDueDate,
    paymentLink,
    isReminder: true // Indicateur pour le template
  }

  const htmlContent = renderPaymentReminderEmailHTML(emailData)

  const emailOptions: any = {
    from: `${settings.studioName} <${settings.senderEmail}>`,
    to: quote.client.email,
    replyTo: settings.studioEmail, // Rediriger les réponses vers l'email principal du studio
    subject: `🔄 Rappel de paiement - Devis ${quote.reference} - ${settings.studioName}`,
    html: htmlContent,
  }

  let result
  
  console.log('📧 Préparation envoi relance de paiement:', {
    from: emailOptions.from,
    to: emailOptions.to,
    subject: emailOptions.subject,
    isDevelopment,
    hasResend: !!resend,
    NODE_ENV: process.env.NODE_ENV
  })

  if (isDevelopment) {
    // Mode développement - afficher l'email dans la console
    console.log('\n=== RELANCE DE PAIEMENT (MODE DÉVELOPPEMENT) ===')
    console.log('De:', emailOptions.from)
    console.log('À:', emailOptions.to)
    console.log('Sujet:', emailOptions.subject)
    console.log('HTML Content:')
    console.log(htmlContent.substring(0, 500) + '...')
    console.log('===========================================\n')
    
    // Simuler une réponse réussie
    result = { data: { id: 'dev-reminder-' + Date.now() } }
  } else if (!resend) {
    // Production mais pas de clé API Resend
    console.error('❌ ERREUR: Pas de clé API Resend pour relance de paiement!')
    throw new Error('Configuration email manquante en production')
  } else {
    console.log('🚀 Envoi relance de paiement via Resend API...')
    result = await resend.emails.send(emailOptions)
    console.log('✅ Réponse Resend:', result)
  }

  // NE PAS mettre à jour le statut du devis pour une relance
  // Le devis reste en statut PAYMENT_PENDING

  // Log de l'événement
  await prisma.eventLog.create({
    data: {
      entityType: 'QUOTE',
      entityId: quoteId,
      action: 'PAYMENT_REMINDER_SENT',
      payload: JSON.stringify({ 
        invoiceRef,
        paymentDueDate,
        sentAt: new Date().toISOString(),
        recipientEmail: quote.client.email
      }),
    }
  })

  console.log('✅ Relance de paiement envoyée avec succès')
  return result?.data || { id: 'fallback-reminder-' + Date.now() }
}

export async function sendDateChangeNotification(quoteId: string, oldStartDate: Date, oldEndDate: Date, newStartDate: Date, newEndDate: Date) {
  console.log('🔄 Début envoi notification changement de dates...')
  
  // Récupérer les informations du devis
  const quote = await prisma.quoteRequest.findUnique({
    where: { id: quoteId },
    include: {
      client: true,
    }
  })

  if (!quote) {
    throw new Error('Devis non trouvé')
  }

  // Récupérer les paramètres
  const settings = await prisma.settings.findUnique({
    where: { id: 'singleton' }
  })

  if (!settings) {
    throw new Error('Paramètres non trouvés')
  }

  // Générer le contenu HTML
  const htmlContent = renderDateChangeEmailHTML({
    quote: {
      id: quote.id,
      reference: quote.reference,
      desiredStart: quote.desiredStart,
      desiredEnd: quote.desiredEnd,
      background: quote.background,
      message: quote.message,
      amountTTC: quote.amountTTC
    },
    client: quote.client,
    settings: {
      studioName: settings.studioName,
      studioAddress: settings.studioAddress,
      studioPhone: settings.studioPhone,
      studioEmail: settings.studioEmail,
      senderEmail: settings.senderEmail
    },
    oldStartDate,
    oldEndDate,
    newStartDate,
    newEndDate
  })

  const emailOptions = {
    from: settings.senderEmail,
    to: quote.client.email,
    replyTo: settings.studioEmail, // Rediriger les réponses vers l'email principal du studio
    subject: `📅 Modification confirmée - Réservation ${quote.reference}`,
    html: htmlContent,
  }

  let result
  
  console.log('📧 Configuration email notification:', {
    to: emailOptions.to,
    subject: emailOptions.subject,
    isDevelopment,
    hasResend: !!resend,
    NODE_ENV: process.env.NODE_ENV,
    RESEND_API_KEY_EXISTS: !!process.env.RESEND_API_KEY,
    RESEND_API_KEY_LENGTH: process.env.RESEND_API_KEY?.length,
    senderEmail: settings.senderEmail
  })

  if (isDevelopment) {
    // Mode développement - afficher l'email dans la console
    console.log('\n=== EMAIL MODIFICATION DATES (MODE DÉVELOPPEMENT) ===')
    console.log('De:', emailOptions.from)
    console.log('À:', emailOptions.to)
    console.log('Sujet:', emailOptions.subject)
    console.log('HTML Content:')
    console.log(htmlContent.substring(0, 500) + '...')
    console.log('====================================================\n')
    
    // Simuler une réponse réussie
    result = { data: { id: 'dev-' + Date.now() } }
  } else if (!resend) {
    // Production mais pas de clé API Resend
    console.error('❌ ERREUR: Pas de clé API Resend pour notification!')
    throw new Error('Configuration email manquante en production')
  } else {
    console.log('🚀 Envoi notification via Resend API...')
    result = await resend.emails.send(emailOptions)
    console.log('✅ Réponse Resend:', result)
  }

  // Log de l'événement
  await prisma.eventLog.create({
    data: {
      entityType: 'QUOTE',
      entityId: quoteId,
      action: 'DATE_CHANGE_EMAIL_SENT',
      payload: JSON.stringify({
        recipient: quote.client.email,
        oldDates: { start: oldStartDate, end: oldEndDate },
        newDates: { start: newStartDate, end: newEndDate },
        sentAt: new Date().toISOString()
      }),
    }
  })

  console.log('✅ Notification de changement de dates envoyée avec succès')
  return result?.data || { id: 'fallback-' + Date.now() }
}

export function renderPaymentReminderEmailHTML(data: QuoteEmailData & { 
  invoiceRef: string
  paymentDueDate?: string
  paymentLink?: string
  isReminder?: boolean
}): string {
  const { quote, client, settings, invoiceRef, paymentDueDate, paymentLink } = data
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
<table style="width: 100%; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; font-family: Arial, sans-serif; color: #333 !important;">
<tbody>
<tr>
<td style="background-color: #060c20 !important; padding: 20px; text-align: center;"><img style="max-width: 100px;" src="https://www.studiomae.fr/images/logo_mail.png" alt="Logo Studio"></td>
</tr>
<tr>
<td style="padding: 20px;">
<h2 style="margin-top: 0; color: #f59e0b !important;">🔄 Rappel de paiement</h2>

<p style="color: #333 !important;">Bonjour <strong>${clientName}</strong>,<br><br>Nous vous rappelons que le paiement de votre réservation est toujours en attente. Pour maintenir votre créneau réservé, merci de procéder au règlement dans les plus brefs délais.</p>

<div style="background: #fef3c7 !important; border-left: 4px solid #f59e0b !important; padding: 16px; margin: 24px 0;">
<p style="margin: 0; color: #333 !important; font-weight: 600;">⚠️ Votre réservation est actuellement en attente de paiement</p>
<p style="margin: 8px 0 0 0; color: #333 !important;">Sans règlement rapide, votre créneau pourrait être libéré pour d'autres clients.</p>
</div>

<div style="text-align: center; margin: 32px 0; padding: 24px; background: #f59e0b; border-radius: 8px; color: white;">
<div style="font-size: 16px; margin-bottom: 8px;">Montant à régler</div>
<div style="font-size: 32px; font-weight: 700; margin: 0;">${amountFormatted}</div>
</div>

${paymentDueDate ? `
<div style="background: #fef2f2 !important; border-left: 4px solid #ef4444 !important; padding: 12px; margin: 20px 0;">
<p style="margin: 0; color: #333 !important;"><strong>🚨 Date limite de paiement : ${paymentDueDate}</strong><br>Cette date approche rapidement ! Merci de procéder au paiement dès maintenant.</p>
</div>
` : ''}

<div style="text-align: center; margin: 32px 0;">
<a href="${paymentLink}" style="display: inline-block; background: #f59e0b; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">💳 Payer maintenant</a>
<p style="margin-top: 16px; font-size: 14px; color: #666;">Paiement sécurisé par SumUp</p>
</div>

<div style="margin: 25px 0; background: #f1f1f1; border-left: 4px solid #f59e0b; padding: 15px;">
<p style="margin: 0; color: #333 !important;"><strong>💡 Rappel de votre réservation :</strong><br>
<strong>Devis :</strong> ${quote.reference}<br>
<strong>Date :</strong> ${startDate}<br>
<strong>Horaires :</strong> ${startTime} - ${endTime}<br>
<strong>Montant :</strong> ${amountFormatted}</p>
</div>

<p style="color: #333 !important;">Si vous avez des questions concernant votre paiement, n'hésitez pas à nous contacter.<br><br>Cordialement,<br><strong>L'équipe ${settings.studioName}</strong></p>

<div style="margin: 20px 0; padding: 12px; background: #f8f9fa; border-radius: 6px; font-size: 12px; color: #666;">
💡 <strong>Vous pouvez répondre directement à cet email</strong> - vos messages seront reçus par notre équipe.
</div>
</td>
</tr>
<tr>
<td style="background: #f9f9f9 !important; padding: 15px; font-size: 12px; text-align: center; color: #777 !important;"><strong>${settings.studioName}</strong><br>${settings.studioAddress}<br>📞 ${settings.studioPhone} • 📧 ${settings.studioEmail}</td>
</tr>
</tbody>
</table>`
}

export async function sendInvoiceEmail({
  quote,
  client,
  invoices
}: {
  quote: any
  client: any
  invoices: Array<{invoiceRef: string, label: string, secureUrl: string, blobUrl: string}>
}) {
  console.log('📧 Début envoi email de facture...')
  
  const settings = await prisma.settings.findUnique({
    where: { id: 'singleton' }
  })

  if (!settings) {
    throw new Error('Paramètres non trouvés')
  }

  const htmlContent = renderInvoiceEmailHTML({
    quote,
    client,
    settings,
    invoices
  })

  // Pour Vercel Blob, nous utilisons les URLs directement dans l'email
  console.log('✅ URLs des factures PDF:', invoices.map(inv => `${inv.label}: ${inv.secureUrl}`))

  const emailOptions: any = {
    from: `${settings.studioName} <${settings.senderEmail}>`,
    to: client.email,
    replyTo: settings.studioEmail, // Rediriger les réponses vers l'email principal du studio
    subject: `Facture${invoices.length > 1 ? 's' : ''} ${invoices.map(inv => inv.invoiceRef).join(' & ')} - ${settings.studioName}`,
    html: htmlContent,
  }

  let result
  
  console.log('📧 Configuration email facture:', {
    from: emailOptions.from,
    to: emailOptions.to,
    subject: emailOptions.subject,
    invoiceCount: invoices.length,
    isDevelopment,
    hasResend: !!resend
  })

  if (isDevelopment) {
    console.log('\n=== EMAIL DE FACTURE (MODE DÉVELOPPEMENT) ===')
    console.log('De:', emailOptions.from)
    console.log('À:', emailOptions.to)
    console.log('Sujet:', emailOptions.subject)
    console.log('Factures:', invoices.map(inv => `${inv.label}: ${inv.secureUrl}`))
    console.log('HTML Content:')
    console.log(htmlContent.substring(0, 500) + '...')
    console.log('============================================\n')
    
    result = { data: { id: 'dev-' + Date.now() } }
  } else if (!resend) {
    console.error('❌ ERREUR: Pas de clé API Resend pour email de facture!')
    throw new Error('Configuration email manquante en production')
  } else {
    console.log('🚀 Envoi email de facture via Resend API...')
    result = await resend.emails.send(emailOptions)
    console.log('✅ Réponse Resend:', result)
  }

  console.log('✅ Email de facture envoyé avec succès')
  return result?.data || { id: 'fallback-' + Date.now() }
}

export function renderInvoiceEmailHTML(data: QuoteEmailData & { 
  invoices: Array<{invoiceRef: string, label: string, secureUrl: string, blobUrl: string}>
}): string {
  const { quote, client, settings, invoices } = data
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
    <title>Facture${invoices.length > 1 ? 's' : ''} ${invoices.map(inv => inv.invoiceRef).join(' & ')} - ${settings.studioName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 20px;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #060c20; padding: 40px 30px; text-align: center;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="color: #ffffff; font-size: 28px; font-weight: bold; margin-bottom: 8px;">
                                        📄 Facture transmise
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color: #ffffff; font-size: 16px; opacity: 0.9; padding-top: 8px;">
                                        Merci pour votre séance au studio
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <!-- Greeting -->
                                <tr>
                                    <td style="font-size: 28px; font-weight: bold; color: #333333; padding-bottom: 24px;">
                                        Bonjour ${clientName} !
                                    </td>
                                </tr>
                                
                                <!-- Intro text -->
                                <tr>
                                    <td style="color: #666666; line-height: 1.7; padding-bottom: 32px;">
                                        Merci d'avoir choisi le ${settings.studioName} pour votre séance photo !<br>
                                        Nous espérons que vous avez apprécié votre expérience dans nos locaux.<br>
                                        Vous trouverez ci-joint votre facture.
                                    </td>
                                </tr>
                                
                                <!-- Invoice Summary -->
                                <tr>
                                    <td style="padding-bottom: 32px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                                            <!-- Invoice header -->
                                            <tr>
                                                <td style="text-align: center; padding: 24px 20px;">
                                                    <div style="font-size: 24px; font-weight: bold; color: #2563eb; font-family: 'Courier New', monospace;">
                                                        Facture${invoices.length > 1 ? 's' : ''} ${invoices.map(inv => inv.invoiceRef).join(' & ')}
                                                    </div>
                                                    <div style="color: #64748b; font-size: 14px; margin-top: 4px;">
                                                        Émise le ${new Intl.DateTimeFormat('fr-FR', {
                                                          day: '2-digit',
                                                          month: '2-digit',
                                                          year: 'numeric'
                                                        }).format(new Date())}
                                                    </div>
                                                </td>
                                            </tr>
                                            
                                            <!-- Booking details -->
                                            <tr>
                                                <td style="padding: 0 20px 20px;">
                                                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 6px; border: 1px solid #e2e8f0;">
                                                        <tr>
                                                            <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b;">
                                                                📅 Date de la séance
                                                            </td>
                                                            <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: 500; text-align: right;">
                                                                ${startDate}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b;">
                                                                ⏰ Horaires
                                                            </td>
                                                            <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: 500; text-align: right;">
                                                                ${startTime} - ${endTime}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b;">
                                                                🎨 Configuration
                                                            </td>
                                                            <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: 500; text-align: right;">
                                                                ${quote.background}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b;">
                                                                📋 Référence devis
                                                            </td>
                                                            <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: 500; text-align: right;">
                                                                ${quote.reference}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 12px 16px; color: #64748b;">
                                                                💰 Montant TTC
                                                            </td>
                                                            <td style="padding: 12px 16px; color: #2563eb; font-weight: bold; font-size: 18px; text-align: right;">
                                                                ${amountFormatted}
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Download Section -->
                                <tr>
                                    <td style="padding-bottom: 32px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #dbeafe; border: 2px solid #3b82f6; border-radius: 8px;">
                                            <tr>
                                                <td style="padding: 24px; text-align: center;">
                                                    <div style="color: #1e40af; font-weight: bold; font-size: 18px; margin-bottom: 16px;">
                                                        📄 Vos factures
                                                    </div>
                                                    <div style="color: #1e40af; margin-bottom: 20px; line-height: 1.6;">
                                                        ${invoices.length > 1 ? 'Vos factures sont prêtes !' : 'Votre facture est prête !'} Cliquez sur ${invoices.length > 1 ? 'les boutons ci-dessous' : 'le bouton ci-dessous'} pour télécharger ${invoices.length > 1 ? 'vos documents' : 'votre document'} au format PDF.
                                                    </div>
                                                    ${invoices.map(invoice => `
                                                    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 12px auto;">
                                                        <tr>
                                                            <td style="background-color: #3b82f6; border-radius: 6px; text-align: center;">
                                                                <a href="${invoice.secureUrl}" 
                                                                   target="_blank" 
                                                                   download="facture-${invoice.invoiceRef}.pdf"
                                                                   style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                                                                    📥 ${invoice.label} (${invoice.invoiceRef})
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    `).join('')}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Google Review Section -->
                                <tr>
                                    <td style="padding-bottom: 32px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px;">
                                            <tr>
                                                <td style="padding: 24px; text-align: center;">
                                                    <div style="color: #92400e; font-weight: bold; font-size: 18px; margin-bottom: 16px;">
                                                        ⭐ Votre avis nous intéresse !
                                                    </div>
                                                    <div style="color: #a16207; margin-bottom: 20px; line-height: 1.6;">
                                                        Nous serions ravis de connaître votre expérience au studio.<br>
                                                        Votre avis nous aide à améliorer nos services et aide d'autres clients à nous découvrir.
                                                    </div>
                                                    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                                                        <tr>
                                                            <td style="background-color: #f59e0b; border-radius: 6px; text-align: center;">
                                                                <a href="https://g.page/r/CYD6Q8RA1VRQEAI/review" 
                                                                   target="_blank" 
                                                                   style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                                                                    ⭐ Laisser un avis Google
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Thank you section -->
                                <tr>
                                    <td style="padding-bottom: 32px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0fff4; border-left: 4px solid #10b981; border-radius: 0 8px 8px 0;">
                                            <tr>
                                                <td style="padding: 20px; color: #059669; font-weight: 500;">
                                                    <strong>🙏 Merci pour votre confiance !</strong><br>
                                                    Nous espérons vous revoir bientôt au ${settings.studioName} pour de nouveaux projets créatifs !
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Closing -->
                                <tr>
                                    <td style="border-top: 1px solid #e2e8f0; padding-top: 24px; color: #666666; font-weight: 500;">
                                        Cordialement,<br>
                                        <strong>L'équipe ${settings.studioName}</strong>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #060c20; padding: 24px 30px; text-align: center; color: #ffffff; font-size: 14px; line-height: 1.8;">
                            <strong>${settings.studioName}</strong><br>
                            ${settings.studioAddress}<br>
                            📞 ${settings.studioPhone} • ✉️ ${settings.studioEmail}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
}

export async function renderLocationReminderEmailHTML(data: LocationReminderEmailData): Promise<string> {
  const { booking, quote, client, settings } = data
  const clientName = client.companyName || `${client.firstName} ${client.lastName}`
  
  // Générer un token pour la page d'informations
  const infoToken = await generateBookingInfoToken(booking.id)
  
  // S'assurer qu'on a une URL de base valide
  let baseUrl = process.env.NEXTAUTH_URL
  
  if (!baseUrl) {
    // Utiliser l'URL de production Vercel directement
    baseUrl = 'https://dashboard-gamma-smoky-61.vercel.app'
  }
  
  const infoUrl = `${baseUrl}/location-info/${infoToken}`
  
  // Formatage des dates
  const startDate = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Europe/Paris'
  }).format(booking.start)

  const startTime = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  }).format(booking.start)

  const endTime = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  }).format(booking.end)

  // Calculer le nombre d'heures jusqu'à la location
  const hoursUntil = Math.round((booking.start.getTime() - new Date().getTime()) / (1000 * 60 * 60))

  return `
<table style="width: 100%; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; font-family: Arial, sans-serif; color: #333 !important;">
<tbody>
<tr>
<td style="background-color: #060c20 !important; padding: 20px; text-align: center;"><img style="max-width: 100px;" src="https://www.studiomae.fr/images/logo_mail.png" alt="Logo Studio"></td>
</tr>
<tr>
<td style="padding: 20px;">
<h2 style="margin-top: 0; color: #060c20 !important;">Bonjour ${clientName} !</h2>

<p style="color: #333 !important;">Votre location au Studio MAE approche ! Dans environ ${hoursUntil}h, vous aurez rendez-vous avec nous pour votre séance.</p>

<div style="text-align: center; margin: 32px 0; padding: 24px; background: #fef3cd; border-radius: 8px; border: 1px solid #fbbf24;">
<h3 style="margin-bottom: 16px; color: #92400e; font-weight: 600;">🎬 Rappel de votre location</h3>
<div style="background: white; border-radius: 6px; padding: 16px; margin: 16px 0;">
<h4 style="color: #1f2937; margin-bottom: 8px; font-size: 18px;">${startDate}</h4>
<p style="color: #4b5563; margin: 0; font-size: 16px; font-weight: 600;">${startTime} - ${endTime}</p>
</div>
<a href="${infoUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin-top: 8px;">📋 Informations pratiques & FAQ</a>
<p style="margin-top: 16px; color: #92400e; font-size: 14px;">Adresse, parking, matériel, conseils...</p>
</div>

<div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 20px 0;">
<div style="display: flex; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
<div style="font-size: 20px; margin-right: 12px; min-width: 32px;">🎨</div>
<div>
<h4 style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 16px;">Configuration studio</h4>
<p style="color: #4a5568; margin: 0; font-size: 15px;">${booking.background}</p>
</div>
</div>

<div style="display: flex; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
<div style="font-size: 20px; margin-right: 12px; min-width: 32px;">📄</div>
<div>
<h4 style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 16px;">Référence de votre réservation</h4>
<p style="color: #4a5568; margin: 0; font-size: 15px; font-family: 'Courier New', monospace;">${quote.reference}</p>
</div>
</div>

<div style="display: flex; align-items: flex-start;">
<div style="font-size: 20px; margin-right: 12px; min-width: 32px;">📍</div>
<div>
<h4 style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 16px;">Adresse</h4>
<p style="color: #4a5568; margin: 0; font-size: 15px;">${settings.studioAddress}</p>
</div>
</div>
</div>

<div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; border-radius: 0 8px 8px 0; margin: 24px 0;">
<p style="margin: 0; color: #0c4a6e; font-weight: 500;"><strong>💡 Tout est prêt pour vous accueillir !</strong><br>
Consultez la page d'informations pratiques ci-dessus pour tous les détails : accès, parking, matériel inclus, et nos conseils pour réussir votre séance.</p>
</div>

<div style="background: #f0fff4; border-left: 4px solid #10b981; padding: 20px; border-radius: 0 8px 8px 0; margin: 32px 0;">
<p style="margin: 0; color: #059669; font-weight: 500;"><strong>📞 Besoin d'aide ?</strong><br>
Notre équipe reste à votre disposition : ${settings.studioPhone} • ${settings.studioEmail}</p>
</div>

<div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
<p style="color: #4a5568; font-weight: 500;">
À très bientôt au studio !<br>
<strong>L'équipe ${settings.studioName}</strong>
</p>
</div>
</td>
</tr>
<tr>
<td style="background: #f9f9f9 !important; padding: 15px; font-size: 12px; text-align: center; color: #777 !important;"><strong>${settings.studioName}</strong><br>${settings.studioAddress}<br>📞 ${settings.studioPhone} • ✉️ ${settings.studioEmail}</td>
</tr>
</tbody>
</table>`
}

export async function sendLocationReminderEmail(bookingId: string) {
  console.log('📧 Préparation email de rappel pour booking:', bookingId)
  
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { 
      quoteRequest: {
        include: { client: true }
      }
    }
  })

  if (!booking) {
    throw new Error('Réservation non trouvée')
  }

  const settings = await prisma.settings.findUnique({
    where: { id: 'singleton' }
  })

  if (!settings) {
    throw new Error('Configuration manquante')
  }

  const emailData = {
    booking,
    quote: booking.quoteRequest,
    client: booking.quoteRequest.client,
    settings
  }

  const htmlContent = await renderLocationReminderEmailHTML(emailData)

  const emailOptions: any = {
    from: `${settings.studioName} <${settings.senderEmail}>`,
    to: booking.quoteRequest.client.email,
    reply_to: settings.studioEmail,
    subject: `Rappel : Votre location au ${settings.studioName} dans 48h - ${booking.quoteRequest.reference}`,
    html: htmlContent,
  }

  let result
  
  console.log('📧 Préparation envoi email rappel:', {
    from: emailOptions.from,
    to: emailOptions.to,
    subject: emailOptions.subject,
    isDevelopment,
    hasResend: !!resend
  })

  if (isDevelopment) {
    console.log('🔧 Mode développement - Email de rappel non envoyé')
    console.log('📧 Destinataire:', emailOptions.to)
    console.log('📋 Sujet:', emailOptions.subject)
    console.log('📝 Contenu HTML généré avec succès')
    
    result = {
      success: true,
      messageId: 'dev-mode-' + Date.now(),
      isDevelopment: true
    }
  } else {
    if (!resend) {
      throw new Error('Service email non configuré (RESEND_API_KEY manquante)')
    }

    try {
      const emailResult = await resend.emails.send(emailOptions)
      console.log('✅ Email de rappel envoyé avec succès:', emailResult.data)
      
      result = {
        success: true,
        messageId: emailResult.data?.id,
        isDevelopment: false
      }
    } catch (error) {
      console.error('❌ Erreur envoi email de rappel:', error)
      throw error
    }
  }

  // Log de l'événement
  await prisma.eventLog.create({
    data: {
      entityType: 'BOOKING',
      entityId: bookingId,
      action: 'REMINDER_EMAIL_SENT',
      payload: JSON.stringify({ 
        to: emailOptions.to,
        subject: emailOptions.subject,
        success: result.success,
        messageId: result.messageId
      })
    }
  })

  return result
}
