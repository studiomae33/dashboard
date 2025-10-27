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
            background: linear-gradient(90deg, #f6ad55, #ed8936, #dd6b20);
        }
        
        .header-title {
            color: white;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .header-subtitle {
            color: #a0aec0;
            font-size: 16px;
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
        
        .equipment-section {
            background: linear-gradient(135deg, #f0fff4 0%, #dcfce7 100%);
            border: 1px solid #16a34a;
            border-radius: 12px;
            padding: 24px;
            margin: 32px 0;
        }
        
        .equipment-title {
            color: #15803d;
            font-weight: 600;
            margin-bottom: 16px;
            font-size: 18px;
            display: flex;
            align-items: center;
        }
        
        .equipment-list {
            background: white;
            border-radius: 8px;
            padding: 16px;
            color: #374151;
            white-space: pre-wrap;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .action-section {
            background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
            border: 1px solid #f59e0b;
            border-radius: 12px;
            padding: 32px;
            margin: 32px 0;
            text-align: center;
        }
        
        .action-title {
            color: #92400e;
            font-weight: 600;
            margin-bottom: 16px;
            font-size: 20px;
        }
        
        .action-subtitle {
            color: #a16207;
            margin-bottom: 24px;
            font-size: 16px;
        }
        
        .button-container {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .btn {
            display: inline-block;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            min-width: 140px;
        }
        
        .btn-confirm {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            color: white !important;
            box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
        }
        
        .btn-confirm:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(22, 163, 74, 0.4);
        }
        
        .btn-reject {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white !important;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }
        
        .btn-reject:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
        }
        
        .footer-note {
            background: linear-gradient(135deg, #ebf8ff 0%, #dbeafe 100%);
            border-left: 4px solid #3b82f6;
            padding: 20px;
            border-radius: 0 8px 8px 0;
            margin: 32px 0;
        }
        
        .footer-note p {
            margin: 0;
            color: #1e40af;
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
        
        @media (max-width: 600px) {
            .button-container {
                flex-direction: column;
                align-items: center;
            }
            
            .btn {
                min-width: 200px;
            }
            
            .email-container {
                margin: 10px;
                border-radius: 8px;
            }
            
            .content, .header {
                padding: 24px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="header-title">📦 Demande de location de matériel</div>
            <div class="header-subtitle">Devis ${quote.reference}</div>
        </div>
        
        <!-- Content -->
        <div class="content">
            <h1 class="greeting">Nouvelle demande de location</h1>
            
            <p class="intro-text">
                Bonjour,<br><br>
                Vous avez reçu une nouvelle demande de location de matériel pour une séance photo au ${settings.studioName}.
                Merci de confirmer ou refuser la disponibilité du matériel demandé.
            </p>
            
            <!-- Info Section -->
            <div class="info-section">
                <div class="info-card">
                    <div class="info-row">
                        <div class="info-icon">👤</div>
                        <div class="info-content">
                            <h4>Client</h4>
                            <p>${clientName}</p>
                        </div>
                    </div>
                    
                    <div class="info-row">
                        <div class="info-icon">📋</div>
                        <div class="info-content">
                            <h4>Référence devis</h4>
                            <p>${quote.reference}</p>
                        </div>
                    </div>
                    
                    <div class="info-row">
                        <div class="info-icon">📅</div>
                        <div class="info-content">
                            <h4>Date de la séance</h4>
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
                </div>
            </div>
            
            <!-- Equipment Section -->
            <div class="equipment-section">
                <div class="equipment-title">
                    📦 Matériel demandé
                </div>
                <div class="equipment-list">${equipmentRequest.equipment}</div>
            </div>
            
            <!-- Action Section -->
            <div class="action-section">
                <h2 class="action-title">Confirmez-vous la disponibilité ?</h2>
                <p class="action-subtitle">
                    Cliquez sur l'un des boutons ci-dessous pour répondre à cette demande
                </p>
                
                <div class="button-container">
                    <a href="${confirmUrl}" class="btn btn-confirm">
                        ✅ Confirmer la disponibilité
                    </a>
                    <a href="${rejectUrl}" class="btn btn-reject">
                        ❌ Matériel non disponible
                    </a>
                </div>
            </div>
            
            <div class="footer-note">
                <p><strong>💡 Important</strong><br>
                Une fois votre réponse donnée, le studio sera automatiquement notifié et pourra informer le client de la disponibilité du matériel.</p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-content">
                <strong>Demande envoyée par ${settings.studioName}</strong><br>
                ${settings.studioAddress}<br>
                📞 ${settings.studioPhone} • ✉️ ${settings.studioEmail}
            </div>
        </div>
    </div>
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
    to: 'contact@studiomae.fr', // Email fixe du loueur
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

  if (!settings.resendApiKey || !settings.senderEmail) {
    throw new Error('Configuration email manquante')
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
    RESEND_API_KEY_LENGTH: process.env.RESEND_API_KEY?.length
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
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 28px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 24px;
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
        
        .payment-amount .amount {
            font-size: 32px;
            font-weight: 700;
            margin: 0;
        }
        
        .footer {
            background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
            color: white;
            padding: 30px;
            text-align: center;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <img src="https://www.studiomae.fr/images/logo_mail.png" alt="Studio MAE" width="120" height="60" />
        </div>
        
        <div class="content">
            <h1 class="greeting">Instructions de paiement</h1>
            
            <p>
                Bonjour <strong>${clientName}</strong>,<br><br>
                Merci d'avoir validé votre devis ! Pour finaliser votre réservation au studio, 
                voici les informations nécessaires pour effectuer votre paiement.
            </p>
            
            <div class="payment-amount">
                <div>Montant à régler</div>
                <div class="amount">${amountFormatted}</div>
            </div>
            
            ${paymentDueDate ? `
            <div style="background: #fed7d7; border: 1px solid #fc8181; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0; color: #c53030; font-weight: 500;">
                    <strong>⚠️ Date limite de paiement : ${paymentDueDate}</strong>
                </p>
                <p style="margin-top: 8px; font-weight: normal; color: #c53030;">
                    Merci de procéder au paiement avant cette date pour confirmer votre réservation.
                </p>
            </div>
            ` : ''}
            
            ${paymentLink ? `
            <div style="text-align: center; margin: 32px 0;">
                <a href="${paymentLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); 
                          color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; 
                          font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);">
                    💳 Payer la location
                </a>
                <p style="margin-top: 16px; font-size: 14px; color: #666;">
                    Paiement sécurisé par SumUp
                </p>
            </div>
            ` : ''}
            
            <div style="background: #f7fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h3 style="color: #2d3748; margin-bottom: 16px; font-size: 18px;">
                    ${paymentLink ? 'Ou paiement par virement bancaire :' : 'Modalités de paiement :'}
                </h3>
                
                <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: 600; color: #4a5568; width: 150px;">Bénéficiaire :</td>
                            <td style="padding: 8px 0; color: #2d3748;">${settings.studioName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: 600; color: #4a5568;">IBAN :</td>
                            <td style="padding: 8px 0; color: #2d3748; font-family: monospace;">FR76 3000 4008 4200 0103 5087 146</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: 600; color: #4a5568;">BIC :</td>
                            <td style="padding: 8px 0; color: #2d3748; font-family: monospace;">BNPAFRPP</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: 600; color: #4a5568;">Objet :</td>
                            <td style="padding: 8px 0; color: #2d3748; font-weight: 600;">${invoiceRef} - ${quote.reference}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: 600; color: #4a5568;">Montant :</td>
                            <td style="padding: 8px 0; color: #2d3748; font-weight: 600; font-size: 18px;">${amountFormatted}</td>
                        </tr>
                    </table>
                </div>
                
                <p style="margin: 0; font-size: 14px; color: #666; font-style: italic;">
                    ⚠️ Important : Merci de bien indiquer la référence <strong>${invoiceRef}</strong> 
                    comme objet de votre virement pour faciliter l'identification de votre paiement.
                </p>
            </div>
            
            <p>
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
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modification de votre réservation ${quote.reference} - ${settings.studioName}</title>
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
        
        .header-content {
            color: white;
        }
        
        .header-title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
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
        
        .confirmation-message {
            background: linear-gradient(135deg, #f0fff4 0%, #dcfce7 100%);
            border: 1px solid #10b981;
            border-radius: 8px;
            padding: 24px;
            margin: 32px 0;
            text-align: center;
        }
        
        .footer {
            background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
            color: #a0aec0;
            padding: 30px;
            text-align: center;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="header-content">
                <div class="header-title">📅 Modification de réservation</div>
                <div>Référence ${quote.reference}</div>
            </div>
        </div>
        
        <div class="content">
            <h1 class="greeting">Bonjour ${client.firstName},</h1>
            
            <p>
                Nous vous confirmons que nous avons bien pris en compte votre demande de modification des dates pour votre réservation <strong>${quote.reference}</strong>.
            </p>
            
            <div class="confirmation-message">
                <h3 style="color: #059669; font-size: 20px; font-weight: 600; margin-bottom: 8px;">✅ Modification confirmée</h3>
                <p style="color: #047857; font-size: 16px; margin: 0;">Vos nouvelles dates sont maintenant réservées et confirmées dans notre planning.</p>
            </div>
            
            <div style="background: #f7fafc; border-radius: 12px; padding: 32px; margin: 32px 0; border: 1px solid #e2e8f0;">
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
            
            <p style="margin-top: 32px; text-align: center; color: #4a5568;">
                Merci pour votre confiance,<br>
                <strong>L'équipe ${settings.studioName}</strong>
            </p>
        </div>
        
        <div class="footer">
            <div style="color: white; font-weight: 600; margin-bottom: 12px;">${settings.studioName}</div>
            <div style="margin-bottom: 8px;">${settings.studioAddress}</div>
            <div style="margin-bottom: 8px;">📞 ${settings.studioPhone}</div>
            <div>✉️ ${settings.studioEmail}</div>
        </div>
    </div>
</body>
</html>
  `
}
