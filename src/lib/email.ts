import { Resend } from 'resend'
import { prisma } from './prisma'
import { generateValidationToken } from './token'

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
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background-color: #f7fafc;
        }
        
        .email-container {
            max-width: 640px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
        }
        
        .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #48bb78, #38b2ac, #4299e1);
        }
        
        .logo {
            max-width: 120px;
            height: auto;
            filter: brightness(1.1);
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 28px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 24px;
        }
        
        .intro-text {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 32px;
            line-height: 1.7;
        }
        
        .cta-section {
            text-align: center;
            margin: 40px 0;
            padding: 32px 24px;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border-radius: 12px;
            border: 1px solid #e2e8f0;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white !important;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
            transition: all 0.3s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(72, 187, 120, 0.4);
        }
        
        .divider {
            text-align: center;
            margin: 24px 0;
            font-style: italic;
            color: #718096;
            font-size: 14px;
        }
        
        .alternative-methods {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #4299e1;
            margin: 24px 0;
        }
        
        .alternative-methods ul {
            margin: 0;
            padding-left: 20px;
        }
        
        .alternative-methods li {
            margin-bottom: 8px;
            color: #4a5568;
        }
        
        .info-section {
            margin: 32px 0;
        }
        
        .info-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 24px;
            margin: 20px 0;
        }
        
        .info-row {
            display: flex;
            align-items: flex-start;
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid #f1f5f9;
        }
        
        .info-row:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
        
        .info-icon {
            font-size: 20px;
            margin-right: 12px;
            min-width: 32px;
        }
        
        .info-content h4 {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 4px;
            font-size: 16px;
        }
        
        .info-content p {
            color: #4a5568;
            margin: 0;
            font-size: 15px;
        }
        
        .warning-section {
            background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 24px;
            margin: 32px 0;
        }
        
        .warning-title {
            display: flex;
            align-items: center;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 16px;
            font-size: 16px;
        }
        
        .warning-item {
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid #fbbf24;
        }
        
        .warning-item:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
        
        .warning-item h5 {
            font-weight: 600;
            color: #92400e;
            margin-bottom: 8px;
        }
        
        .warning-item p {
            color: #a16207;
            margin: 0;
            line-height: 1.6;
        }
        
        .highlight-box {
            background: linear-gradient(135deg, #ebf8ff 0%, #dbeafe 100%);
            border-left: 4px solid #3b82f6;
            padding: 20px;
            border-radius: 0 8px 8px 0;
            margin: 24px 0;
        }
        
        .highlight-box p {
            margin: 0;
            color: #1e40af;
            font-weight: 500;
        }
        
        .reference-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            text-align: center;
            margin: 24px 0;
        }
        
        .reference-number {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
            font-family: 'Courier New', monospace;
        }
        
        .footer-note {
            background: linear-gradient(135deg, #f0fff4 0%, #dcfce7 100%);
            border-left: 4px solid #10b981;
            padding: 20px;
            border-radius: 0 8px 8px 0;
            margin: 32px 0;
        }
        
        .footer-note p {
            margin: 0;
            color: #059669;
            font-weight: 500;
        }
        
        .closing {
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
        }
        
        .signature {
            color: #4a5568;
            font-weight: 500;
        }
        
        .footer {
            background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
            padding: 24px 30px;
            text-align: center;
            color: #a0aec0;
            font-size: 14px;
        }
        
        .footer-content {
            line-height: 1.8;
        }
        
        .footer strong {
            color: #ffffff;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <img class="logo" src="https://www.studiomae.fr/images/logo_mail.png" alt="Studio MAE" width="120" height="auto">
        </div>
        
        <!-- Content -->
        <div class="content">
            <h1 class="greeting">Bonjour ${clientName} !</h1>
            
            <p class="intro-text">
                Merci de trouver ci-joint votre devis personnalisé pour votre séance photo au Studio MAE. 
                Nous avons préparé cette proposition avec soin selon vos besoins spécifiques.
            </p>
            
            <!-- CTA Section -->
            <div class="cta-section">
                <h3 style="margin-bottom: 16px; color: #2d3748; font-weight: 600;">Validation de votre devis</h3>
                <a href="${validationUrl}" class="cta-button">
                    📋 Voir les conditions et valider le devis
                </a>
                <p style="margin-top: 16px; color: #718096; font-size: 14px;">
                    Validation sécurisée et immédiate
                </p>
            </div>
            
            <!-- Info Section -->
            <div class="info-section">
                <div class="info-card">
                    <div class="info-row">
                        <div class="info-icon">📅</div>
                        <div class="info-content">
                            <h4>Séance programmée</h4>
                            <p>${startDate} • ${endTime}</p>
                        </div>
                    </div>
                    
                    <div class="info-row">
                        <div class="info-icon">🎨</div>
                        <div class="info-content">
                            <h4>Configuration studio</h4>
                            <p>${quote.background}</p>
                        </div>
                    </div>
                    
                    <div class="info-row">
                        <div class="info-icon">💰</div>
                        <div class="info-content">
                            <h4>Tarif</h4>
                            <p>${quote.amountTTC ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(quote.amountTTC) : '450,00 €'} TTC</p>
                        </div>
                    </div>
                    
                    <div class="info-row">
                        <div class="info-icon">📄</div>
                        <div class="info-content">
                            <h4>Référence devis</h4>
                            <p class="reference-number">${quote.reference}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="highlight-box">
                <p><strong>📋 Conditions et informations détaillées</strong><br>
                Retrouvez toutes les informations nécessaires à votre location (conditions, tarifs, modalités) directement dans le lien de validation du devis ci-dessus.</p>
            </div>
            
            <div class="footer-note">
                <p><strong>💡 Prochaine étape</strong><br>
                Dès réception de votre validation, nous vous transmettrons immédiatement les instructions de paiement par email.</p>
            </div>
            
            <div class="closing">
                <p class="signature">
                    Merci pour votre confiance,<br>
                    <strong>L'équipe Studio MAE</strong>
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-content">
                <strong>Studio MAE</strong><br>
                46 rue Promis, 33100 Bordeaux<br>
                📞 05.54.54.70.93 • ✉️ contact@studiomae.fr
            </div>
        </div>
    </div>
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
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background-color: #f7fafc;
        }
        
        .email-container {
            max-width: 640px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
        }
        
        .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #48bb78, #38b2ac, #4299e1);
        }
        
        .logo {
            max-width: 120px;
            height: auto;
            filter: brightness(1.1);
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 28px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 24px;
        }
        
        .intro-text {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 32px;
            line-height: 1.7;
        }
        
        .payment-amount {
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white;
            padding: 24px;
            border-radius: 12px;
            text-align: center;
            margin: 32px 0;
            box-shadow: 0 4px 12px rgba(72, 187, 120, 0.2);
        }
        
        .payment-amount .label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 8px;
        }
        
        .payment-amount .amount {
            font-size: 32px;
            font-weight: 700;
            margin: 0;
        }
        
        .warning-box {
            background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
            border: 1px solid #fc8181;
            border-radius: 12px;
            padding: 20px;
            margin: 24px 0;
        }
        
        .warning-box p {
            margin: 0;
            color: #c53030;
            font-weight: 500;
        }
        
        .rental-details {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            margin: 32px 0;
        }
        
        .rental-details h3 {
            color: #2d3748;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
        }
        
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .detail-row:last-child {
            border-bottom: none;
        }
        
        .detail-label {
            font-weight: 500;
            color: #4a5568;
        }
        
        .detail-value {
            font-weight: 600;
            color: #2d3748;
        }
        
        .bank-info {
            background: #ffffff;
            border: 2px solid #4299e1;
            border-radius: 12px;
            padding: 24px;
            margin: 32px 0;
        }
        
        .bank-info h3 {
            color: #2d3748;
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }
        
        .bank-details {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 16px 0;
        }
        
        .bank-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
        }
        
        .bank-label {
            font-weight: 500;
            color: #4a5568;
            min-width: 120px;
        }
        
        .bank-value {
            font-weight: 600;
            color: #2d3748;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 14px;
        }
        
        .highlight-box {
            background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%);
            border: 1px solid #38b2ac;
            border-radius: 12px;
            padding: 24px;
            margin: 32px 0;
        }
        
        .highlight-box h4 {
            color: #234e52;
            font-weight: 600;
            margin-bottom: 12px;
            font-size: 16px;
        }
        
        .highlight-box p {
            color: #2c7a7b;
            margin: 0;
            font-weight: 500;
        }
        
        .action-box {
            background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%);
            border: 1px solid #4299e1;
            border-radius: 12px;
            padding: 24px;
            margin: 32px 0;
            text-align: center;
        }
        
        .action-box h4 {
            color: #2b6cb0;
            font-weight: 600;
            margin-bottom: 12px;
            font-size: 18px;
        }
        
        .action-box p {
            color: #2c5282;
            margin: 8px 0;
            font-weight: 500;
        }
        
        .contact-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 24px 0;
            text-align: center;
        }
        
        .contact-info p {
            margin: 8px 0;
            color: #4a5568;
        }
        
        .footer {
            background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
            color: white;
            padding: 30px;
            text-align: center;
            font-size: 14px;
        }
        
        .footer p {
            margin: 4px 0;
            opacity: 0.9;
        }
        
        a {
            color: #4299e1;
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <img class="logo" src="https://www.studiomae.fr/images/logo_mail.png" alt="Studio MAE" width="120" height="60" />
        </div>
        
        <div class="content">
            <h1 class="greeting">Instructions de paiement</h1>
            
            <p class="intro-text">
                Bonjour <strong>${clientName}</strong>,<br><br>
                Merci d'avoir validé votre devis ! Pour finaliser votre réservation au studio, 
                voici les informations nécessaires pour effectuer votre paiement.
            </p>
            
            <div class="payment-amount">
                <div class="label">Montant à régler</div>
                <div class="amount">${amountFormatted}</div>
            </div>
            
            ${paymentDueDate ? `
            <div class="warning-box">
                <p><strong>⚠️ Date limite de paiement : ${paymentDueDate}</strong></p>
                <p style="margin-top: 8px; font-weight: normal;">
                    Merci de procéder au paiement avant cette date pour confirmer votre réservation.
                </p>
            </div>
            ` : ''}
            
            <div class="rental-details">
                <h3>📅 Détails de votre réservation</h3>
                <div class="detail-row">
                    <span class="detail-label">Date et horaires</span>
                    <span class="detail-value">${startDate}<br>${startTime} - ${endTime}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Type de fond</span>
                    <span class="detail-value">${quote.background}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Référence devis</span>
                    <span class="detail-value">${quote.reference}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Référence facture</span>
                    <span class="detail-value">${invoiceRef}</span>
                </div>
            </div>
            
            <div class="bank-info">
                <h3>💳 Informations bancaires</h3>
                <p style="color: #4a5568; margin-bottom: 16px;">
                    Effectuez votre virement bancaire avec les informations suivantes :
                </p>
                
                <div class="bank-details">
                    <div class="bank-row">
                        <span class="bank-label">Bénéficiaire</span>
                        <span class="bank-value">BIPELEC</span>
                    </div>
                    <div class="bank-row">
                        <span class="bank-label">IBAN</span>
                        <span class="bank-value">FR76 1870 6000 0097 5066 6969 792</span>
                    </div>
                    <div class="bank-row">
                        <span class="bank-label">BIC</span>
                        <span class="bank-value">AGRIFRPP887</span>
                    </div>
                    <div class="bank-row">
                        <span class="bank-label"><strong>Objet du virement</strong></span>
                        <span class="bank-value"><strong>${invoiceRef}</strong></span>
                    </div>
                </div>
                
                <p style="color: #4a5568; font-style: italic; margin-top: 12px;">
                    ⚠️ <strong>Important :</strong> Merci d'indiquer exactement la référence "${invoiceRef}" 
                    en objet du virement pour un traitement rapide de votre paiement.
                </p>
            </div>
            
            <div class="action-box">
                <h4>📧 Confirmation de paiement</h4>
                <p><strong>Merci de nous envoyer une preuve de votre virement</strong></p>
                <p>Répondez à cet email en joignant :</p>
                <p>• Une capture d'écran de votre virement<br>
                • Ou un email de confirmation de votre banque<br>
                • Ou tout autre justificatif de paiement</p>
            </div>
            
            <div class="highlight-box">
                <h4>✅ Confirmation de réservation</h4>
                <p>
                    Votre réservation sera définitivement confirmée dès réception de votre paiement 
                    et de votre justificatif. Vous recevrez alors une confirmation finale par email.
                </p>
            </div>
            
            <div class="contact-info">
                <p><strong>Une question ?</strong></p>
                <p>📧 Écrivez-nous : <a href="mailto:${settings.studioEmail}">${settings.studioEmail}</a></p>
                <p>📞 Appelez-nous : ${settings.studioPhone}</p>
                <p style="margin-top: 16px;">
                    Nous restons à votre disposition pour toute information complémentaire.
                </p>
            </div>
            
            <p style="margin-top: 32px; text-align: center; color: #4a5568;">
                À très bientôt au studio !<br>
                <strong>L'équipe ${settings.studioName}</strong>
            </p>
        </div>
        
        <div class="footer">
            <p><strong>${settings.studioName}</strong></p>
            <p>${settings.studioAddress}</p>
            <p>📞 ${settings.studioPhone} • 📧 ${settings.studioEmail}</p>
        </div>
    </div>
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
