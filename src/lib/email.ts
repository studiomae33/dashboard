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
