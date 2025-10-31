import crypto from 'crypto'

// Configuration OVH SMS
const OVH_CONFIG = {
  endpoint: 'https://eu.api.ovh.com/1.0',
  applicationKey: process.env.OVH_APPLICATION_KEY,
  applicationSecret: process.env.OVH_APPLICATION_SECRET,
  consumerKey: process.env.OVH_CONSUMER_KEY,
  serviceName: process.env.OVH_SMS_SERVICE_NAME, // Nom du service SMS OVH
}

// Mode développement - log les SMS au lieu de les envoyer
const isDevelopment = !process.env.OVH_APPLICATION_KEY || process.env.OVH_APPLICATION_KEY === 'your-ovh-application-key'

// Fonction pour générer la signature OVH
function generateSignature(method: string, query: string, body: string, timestamp: number): string {
  const { applicationSecret, consumerKey } = OVH_CONFIG
  const toSign = `${applicationSecret}+${consumerKey}+${method}+${query}+${body}+${timestamp}`
  return '$1$' + crypto.createHash('sha1').update(toSign).digest('hex')
}

// Fonction pour envoyer un SMS via OVH
async function sendOVHSMS(to: string, message: string) {
  console.log('🔍 Début sendOVHSMS - Destinataire:', to)
  console.log('🔍 Configuration OVH:', {
    hasApplicationKey: !!OVH_CONFIG.applicationKey,
    hasApplicationSecret: !!OVH_CONFIG.applicationSecret,
    hasConsumerKey: !!OVH_CONFIG.consumerKey,
    hasServiceName: !!OVH_CONFIG.serviceName,
    serviceName: OVH_CONFIG.serviceName,
    endpoint: OVH_CONFIG.endpoint
  })

  if (!OVH_CONFIG.applicationKey || !OVH_CONFIG.applicationSecret || !OVH_CONFIG.consumerKey || !OVH_CONFIG.serviceName) {
    const missingFields = []
    if (!OVH_CONFIG.applicationKey) missingFields.push('OVH_APPLICATION_KEY')
    if (!OVH_CONFIG.applicationSecret) missingFields.push('OVH_APPLICATION_SECRET')
    if (!OVH_CONFIG.consumerKey) missingFields.push('OVH_CONSUMER_KEY')
    if (!OVH_CONFIG.serviceName) missingFields.push('OVH_SMS_SERVICE_NAME')
    
    const error = `Configuration OVH manquante: ${missingFields.join(', ')}`
    console.error('❌', error)
    throw new Error(error)
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const method = 'POST'
  const query = `${OVH_CONFIG.endpoint}/sms/${OVH_CONFIG.serviceName}/jobs`
  const body = JSON.stringify({
    message,
    receivers: [to],
    sender: '36180',
    noStopClause: false,
    priority: 'high'
  })

  console.log('🔍 Préparation requête OVH:', {
    method,
    query,
    bodyLength: body.length,
    timestamp
  })

  let signature: string
  try {
    signature = generateSignature(method, query, body, timestamp)
    console.log('✅ Signature générée avec succès')
  } catch (signError) {
    console.error('❌ Erreur génération signature:', signError)
    throw new Error(`Erreur de signature: ${signError instanceof Error ? signError.message : String(signError)}`)
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Ovh-Application': OVH_CONFIG.applicationKey,
    'X-Ovh-Consumer': OVH_CONFIG.consumerKey,
    'X-Ovh-Signature': signature,
    'X-Ovh-Timestamp': timestamp.toString(),
  }

  console.log('🔍 Headers de la requête:', {
    'Content-Type': headers['Content-Type'],
    'X-Ovh-Application': headers['X-Ovh-Application']?.substring(0, 8) + '...',
    'X-Ovh-Consumer': headers['X-Ovh-Consumer']?.substring(0, 8) + '...',
    'X-Ovh-Signature': headers['X-Ovh-Signature']?.substring(0, 10) + '...',
    'X-Ovh-Timestamp': headers['X-Ovh-Timestamp']
  })

  let response: Response
  try {
    console.log('🚀 Envoi requête vers OVH...')
    response = await fetch(query, {
      method,
      headers,
      body,
    })
    console.log('📡 Réponse reçue:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    })
  } catch (fetchError) {
    console.error('❌ Erreur réseau vers OVH:', fetchError)
    throw new Error(`Erreur réseau: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`)
  }

  if (!response.ok) {
    let errorDetails: any = {}
    let errorText = ''
    
    try {
      errorText = await response.text()
      console.log('❌ Réponse d\'erreur OVH (texte brut):', errorText)
      
      // Essayer de parser en JSON si possible
      try {
        errorDetails = JSON.parse(errorText)
        console.log('❌ Réponse d\'erreur OVH (JSON):', errorDetails)
      } catch {
        // Pas du JSON, garder le texte brut
        errorDetails = { rawError: errorText }
      }
    } catch (readError) {
      console.error('❌ Impossible de lire la réponse d\'erreur:', readError)
      errorText = 'Impossible de lire la réponse d\'erreur'
    }
    
    // Si c'est une erreur de service non trouvé, on liste les services disponibles
    if (response.status === 404 && errorText.includes('does not exist')) {
      console.log('🔍 Service SMS non trouvé, tentative de listage des services...')
      try {
        const servicesQuery = `${OVH_CONFIG.endpoint}/sms`
        const servicesSignature = generateSignature('GET', servicesQuery, '', timestamp + 1)
        
        const servicesResponse = await fetch(servicesQuery, {
          headers: {
            'X-Ovh-Application': OVH_CONFIG.applicationKey,
            'X-Ovh-Consumer': OVH_CONFIG.consumerKey,
            'X-Ovh-Signature': servicesSignature,
            'X-Ovh-Timestamp': (timestamp + 1).toString(),
          },
        })
        
        if (servicesResponse.ok) {
          const services = await servicesResponse.json()
          console.log('📋 Services SMS OVH disponibles:', services)
          throw new Error(`Service SMS '${OVH_CONFIG.serviceName}' non trouvé. Services disponibles: ${services.join(', ')}. Erreur OVH: ${response.status} - ${errorText}`)
        } else {
          const servicesError = await servicesResponse.text()
          console.log('❌ Impossible de lister les services SMS:', servicesError)
        }
      } catch (listError) {
        console.log('❌ Erreur lors du listage des services:', listError)
      }
    }
    
    const finalError = `Erreur OVH SMS: ${response.status} - ${errorText}`
    console.error('❌ Erreur finale:', finalError)
    console.error('❌ Détails complets:', { 
      status: response.status, 
      statusText: response.statusText,
      errorDetails,
      config: {
        serviceName: OVH_CONFIG.serviceName,
        endpoint: OVH_CONFIG.endpoint
      }
    })
    
    throw new Error(finalError)
  }

  let result: any
  try {
    result = await response.json()
    console.log('✅ SMS envoyé avec succès - Réponse OVH:', result)
  } catch (parseError) {
    console.error('❌ Erreur parsing réponse JSON:', parseError)
    throw new Error('Réponse OVH invalide')
  }

  return result
}

interface QuoteSignedSMSData {
  quoteReference: string
  clientName: string
  signedAt: Date
  signedIp: string
}

interface LocationReminderSMSData {
  bookingId: string
  clientName: string
  quoteReference: string
  locationDate: Date
  locationTime: string
  background: string
}

export async function sendQuoteSignedSMS(data: QuoteSignedSMSData) {
  const { quoteReference, clientName, signedAt, signedIp } = data
  
  // Récupérer les numéros de téléphone des destinataires
  const recipients = process.env.SMS_ADMIN_NUMBERS?.split(',').map(num => num.trim()) || []
  
  if (recipients.length === 0) {
    console.log('⚠️ Aucun numéro de téléphone configuré pour les SMS')
    return
  }

  // Formater le message SMS (max 149 caractères pour 1 SMS)
  const message = `DEVIS SIGNE !
Ref: ${quoteReference}
Client: ${clientName}
Signe le: ${new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Europe/Paris'
  }).format(signedAt)}
`

  const results = []

  for (const phoneNumber of recipients) {
    try {
      if (isDevelopment) {
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
        console.log('📱 Envoi SMS via OVH à:', phoneNumber)
        
        const smsResult = await sendOVHSMS(phoneNumber, message)
        
        console.log('✅ SMS envoyé avec succès:', smsResult)
        
        results.push({ 
          to: phoneNumber, 
          success: true, 
          messageId: smsResult.ids?.[0] || 'ovh-' + Date.now(),
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

export async function sendLocationReminderSMS(data: LocationReminderSMSData) {
  const { bookingId, clientName, quoteReference, locationDate, locationTime, background } = data
  
  // Récupérer les numéros de téléphone des destinataires
  const recipients = process.env.SMS_ADMIN_NUMBERS?.split(',').map(num => num.trim()) || []
  
  if (recipients.length === 0) {
    console.log('⚠️ Aucun numéro de téléphone configuré pour les SMS de rappel')
    return []
  }

  // Formater le message SMS (max 149 caractères pour 1 SMS)
  const message = `RAPPEL LOCATION - Dans 48h !
Studio MAE - ${new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Paris'
  }).format(locationDate)} ${locationTime}
Client: ${clientName}
Fond: ${background}
`

  const results = []

  for (const phoneNumber of recipients) {
    try {
      if (isDevelopment) {
        // Mode développement - afficher le SMS dans la console
        console.log('\n=== SMS RAPPEL LOCATION (MODE DÉVELOPPEMENT) ===')
        console.log('À:', phoneNumber)
        console.log('Message:')
        console.log(message)
        console.log('================================================\n')
        
        results.push({ 
          to: phoneNumber, 
          success: true, 
          messageId: 'dev-reminder-' + Date.now(),
          isDevelopment: true 
        })
      } else {
        console.log('📱 Envoi SMS rappel location via OVH à:', phoneNumber)
        
        const smsResult = await sendOVHSMS(phoneNumber, message)
        
        console.log('✅ SMS rappel envoyé avec succès:', smsResult)
        
        results.push({ 
          to: phoneNumber, 
          success: true, 
          messageId: smsResult.ids?.[0] || 'ovh-reminder-' + Date.now(),
          isDevelopment: false 
        })
      }
    } catch (error) {
      console.error(`❌ Erreur envoi SMS rappel à ${phoneNumber}:`, error)
      results.push({ 
        to: phoneNumber, 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      })
    }
  }

  return results
}
