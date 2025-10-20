import twilio from 'twilio'

// Initialiser Twilio seulement si les credentials sont disponibles
const client = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

// Mode développement - log les SMS au lieu de les envoyer
const isDevelopment = !process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID === 'your-twilio-account-sid'

interface QuoteSignedSMSData {
  quoteReference: string
  clientName: string
  signedAt: Date
  signedIp: string
}

export async function sendQuoteSignedSMS(data: QuoteSignedSMSData) {
  const { quoteReference, clientName, signedAt, signedIp } = data
  
  // Récupérer les numéros de téléphone des destinataires
  const recipients = process.env.SMS_ADMIN_NUMBERS?.split(',').map(num => num.trim()) || []
  
  if (recipients.length === 0) {
    console.log('⚠️ Aucun numéro de téléphone configuré pour les SMS')
    return
  }

  // Formater le message SMS
  const message = `🎉 DEVIS SIGNÉ !
Référence: ${quoteReference}
Client: ${clientName}
Signé le: ${new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Europe/Paris'
  }).format(signedAt)}
IP: ${signedIp}

Studio MAE`

  const results = []

  for (const phoneNumber of recipients) {
    try {
      if (isDevelopment || !client) {
        // Mode développement - afficher le SMS dans la console
        console.log('\n=== SMS DEVIS SIGNÉ (MODE DÉVELOPPEMENT) ===')
        console.log('À:', phoneNumber)
        console.log('Message:')
        console.log(message)
        console.log('==========================================\n')
        
        results.push({ 
          to: phoneNumber, 
          success: true, 
          messageId: 'dev-' + Date.now(),
          isDevelopment: true 
        })
      } else {
        console.log('📱 Envoi SMS via Twilio à:', phoneNumber)
        
        const smsResult = await client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phoneNumber
        })
        
        console.log('✅ SMS envoyé avec succès:', smsResult.sid)
        
        results.push({ 
          to: phoneNumber, 
          success: true, 
          messageId: smsResult.sid,
          isDevelopment: false 
        })
      }
    } catch (error) {
      console.error(`❌ Erreur envoi SMS à ${phoneNumber}:`, error)
      results.push({ 
        to: phoneNumber, 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      })
    }
  }

  return results
}
