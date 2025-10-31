import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth.config'
import crypto from 'crypto'

// Configuration OVH copiée depuis sms.ts
const OVH_CONFIG = {
  endpoint: 'https://eu.api.ovh.com/1.0',
  applicationKey: process.env.OVH_APPLICATION_KEY,
  applicationSecret: process.env.OVH_APPLICATION_SECRET,
  consumerKey: process.env.OVH_CONSUMER_KEY,
  serviceName: process.env.OVH_SMS_SERVICE_NAME,
}

// Fonction pour générer la signature OVH
function generateSignature(method: string, query: string, body: string, timestamp: number): string {
  const { applicationSecret, consumerKey } = OVH_CONFIG
  if (!applicationSecret || !consumerKey) {
    throw new Error('Clés OVH manquantes pour générer la signature')
  }
  const toSign = `${applicationSecret}+${consumerKey}+${method}+${query}+${body}+${timestamp}`
  return '$1$' + crypto.createHash('sha1').update(toSign).digest('hex')
}

// Endpoint pour diagnostiquer la configuration SMS
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    console.log('🔍 Début du diagnostic SMS...')
    
    const diagnostic = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      checks: [] as any[],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    }

    // 1. Vérification des variables d'environnement
    const envCheck = {
      name: '🔧 Variables d\'environnement',
      status: 'success' as 'success' | 'error' | 'warning',
      details: {} as any,
      message: ''
    }

    const requiredVars = [
      'OVH_APPLICATION_KEY',
      'OVH_APPLICATION_SECRET', 
      'OVH_CONSUMER_KEY',
      'OVH_SMS_SERVICE_NAME',
      'SMS_ADMIN_NUMBERS'
    ]

    const envStatus = {} as any
    let missingVars = 0

    for (const varName of requiredVars) {
      const value = process.env[varName]
      if (!value) {
        envStatus[varName] = '❌ Non définie'
        missingVars++
      } else if (value === 'your-ovh-application-key' || value.includes('your-')) {
        envStatus[varName] = '⚠️ Valeur par défaut (à changer)'
        envCheck.status = 'warning'
      } else {
        envStatus[varName] = `✅ Définie (${value.length} caractères)`
      }
    }

    envCheck.details = envStatus
    if (missingVars > 0) {
      envCheck.status = 'error'
      envCheck.message = `${missingVars} variable(s) manquante(s)`
    } else if (envCheck.status !== 'warning') {
      envCheck.message = 'Toutes les variables sont définies'
    }

    diagnostic.checks.push(envCheck)

    // 2. Détection du mode développement
    const isDevelopment = !process.env.OVH_APPLICATION_KEY || process.env.OVH_APPLICATION_KEY === 'your-ovh-application-key'
    
    const modeCheck = {
      name: '🎯 Mode de fonctionnement',
      status: isDevelopment ? 'warning' as const : 'success' as const,
      details: {
        isDevelopment,
        reason: isDevelopment 
          ? 'Variables OVH non configurées ou valeurs par défaut'
          : 'Configuration OVH détectée',
        behavior: isDevelopment 
          ? 'SMS affichés dans les logs uniquement'
          : 'Tentative d\'envoi réel via OVH'
      },
      message: isDevelopment ? 'Mode développement actif' : 'Mode production actif'
    }

    diagnostic.checks.push(modeCheck)

    // 3. Test de connectivité OVH (seulement si pas en mode dev)
    if (!isDevelopment) {
      const connectivityCheck = {
        name: '🌐 Connectivité API OVH',
        status: 'success' as 'success' | 'error' | 'warning',
        details: {} as any,
        message: ''
      }

      try {
        const timestamp = Math.floor(Date.now() / 1000)
        const method = 'GET'
        const query = `${OVH_CONFIG.endpoint}/me`
        const body = ''

        const signature = generateSignature(method, query, body, timestamp)

        const response = await fetch(query, {
          method,
          headers: {
            'X-Ovh-Application': OVH_CONFIG.applicationKey!,
            'X-Ovh-Consumer': OVH_CONFIG.consumerKey!,
            'X-Ovh-Signature': signature,
            'X-Ovh-Timestamp': timestamp.toString(),
          },
        })

        connectivityCheck.details.responseStatus = response.status
        connectivityCheck.details.responseHeaders = Object.fromEntries(response.headers.entries())

        if (response.ok) {
          const userData = await response.json()
          connectivityCheck.details.userInfo = {
            nichandle: userData.nichandle,
            firstname: userData.firstname,
            name: userData.name,
            email: userData.email
          }
          connectivityCheck.message = `Connecté en tant que ${userData.nichandle}`
        } else {
          const errorText = await response.text()
          connectivityCheck.status = 'error'
          connectivityCheck.details.error = errorText
          connectivityCheck.message = `Erreur ${response.status}: ${errorText}`
        }

      } catch (error) {
        connectivityCheck.status = 'error'
        connectivityCheck.details.error = error instanceof Error ? error.message : String(error)
        connectivityCheck.message = 'Erreur de connexion à l\'API OVH'
      }

      diagnostic.checks.push(connectivityCheck)

      // 4. Vérification des services SMS disponibles
      const servicesCheck = {
        name: '📱 Services SMS disponibles',
        status: 'success' as 'success' | 'error' | 'warning',
        details: {} as any,
        message: ''
      }

      try {
        const timestamp = Math.floor(Date.now() / 1000)
        const method = 'GET'
        const query = `${OVH_CONFIG.endpoint}/sms`
        const body = ''

        const signature = generateSignature(method, query, body, timestamp)

        const response = await fetch(query, {
          method,
          headers: {
            'X-Ovh-Application': OVH_CONFIG.applicationKey!,
            'X-Ovh-Consumer': OVH_CONFIG.consumerKey!,
            'X-Ovh-Signature': signature,
            'X-Ovh-Timestamp': timestamp.toString(),
          },
        })

        if (response.ok) {
          const services = await response.json()
          servicesCheck.details.availableServices = services
          servicesCheck.details.configuredService = OVH_CONFIG.serviceName
          servicesCheck.details.serviceExists = services.includes(OVH_CONFIG.serviceName)

          if (services.length === 0) {
            servicesCheck.status = 'error'
            servicesCheck.message = 'Aucun service SMS trouvé sur ce compte'
          } else if (!services.includes(OVH_CONFIG.serviceName)) {
            servicesCheck.status = 'error'
            servicesCheck.message = `Service '${OVH_CONFIG.serviceName}' non trouvé. Services disponibles: ${services.join(', ')}`
          } else {
            servicesCheck.message = `Service '${OVH_CONFIG.serviceName}' trouvé parmi ${services.length} service(s)`
          }
        } else {
          const errorText = await response.text()
          servicesCheck.status = 'error'
          servicesCheck.details.error = errorText
          servicesCheck.message = `Erreur lors de la récupération des services: ${errorText}`
        }

      } catch (error) {
        servicesCheck.status = 'error'
        servicesCheck.details.error = error instanceof Error ? error.message : String(error)
        servicesCheck.message = 'Erreur lors de la vérification des services SMS'
      }

      diagnostic.checks.push(servicesCheck)

      // 5. Informations détaillées sur le service SMS configuré
      if (servicesCheck.status === 'success') {
        const serviceDetailsCheck = {
          name: '📋 Détails du service SMS',
          status: 'success' as 'success' | 'error' | 'warning',
          details: {} as any,
          message: ''
        }

        try {
          const timestamp = Math.floor(Date.now() / 1000)
          const method = 'GET'
          const query = `${OVH_CONFIG.endpoint}/sms/${OVH_CONFIG.serviceName}`
          const body = ''

          const signature = generateSignature(method, query, body, timestamp)

          const response = await fetch(query, {
            method,
            headers: {
              'X-Ovh-Application': OVH_CONFIG.applicationKey!,
              'X-Ovh-Consumer': OVH_CONFIG.consumerKey!,
              'X-Ovh-Signature': signature,
              'X-Ovh-Timestamp': timestamp.toString(),
            },
          })

          if (response.ok) {
            const serviceInfo = await response.json()
            serviceDetailsCheck.details = serviceInfo
            serviceDetailsCheck.message = `Service actif - Crédits: ${serviceInfo.creditsLeft || 'Non spécifié'}`
          } else {
            const errorText = await response.text()
            serviceDetailsCheck.status = 'warning'
            serviceDetailsCheck.details.error = errorText
            serviceDetailsCheck.message = `Impossible de récupérer les détails: ${errorText}`
          }

        } catch (error) {
          serviceDetailsCheck.status = 'warning'
          serviceDetailsCheck.details.error = error instanceof Error ? error.message : String(error)
          serviceDetailsCheck.message = 'Erreur lors de la récupération des détails du service'
        }

        diagnostic.checks.push(serviceDetailsCheck)
      }
    }

    // 6. Vérification de la configuration des numéros admin
    const numbersCheck = {
      name: '📞 Numéros administrateurs',
      status: 'success' as 'success' | 'error' | 'warning',
      details: {} as any,
      message: ''
    }

    const adminNumbers = process.env.SMS_ADMIN_NUMBERS?.split(',').map(num => num.trim()) || []
    numbersCheck.details.configuredNumbers = adminNumbers
    numbersCheck.details.count = adminNumbers.length

    if (adminNumbers.length === 0) {
      numbersCheck.status = 'error'
      numbersCheck.message = 'Aucun numéro d\'administrateur configuré'
    } else {
      // Validation basique du format des numéros
      const invalidNumbers = adminNumbers.filter(num => 
        !num.match(/^\+33[1-9][0-9]{8}$/) && !num.match(/^0[1-9][0-9]{8}$/)
      )
      
      if (invalidNumbers.length > 0) {
        numbersCheck.status = 'warning'
        numbersCheck.details.invalidNumbers = invalidNumbers
        numbersCheck.message = `${adminNumbers.length} numéro(s) configuré(s), ${invalidNumbers.length} format(s) suspect(s)`
      } else {
        numbersCheck.message = `${adminNumbers.length} numéro(s) configuré(s) avec format valide`
      }
    }

    diagnostic.checks.push(numbersCheck)

    // Calcul du résumé
    diagnostic.summary.total = diagnostic.checks.length
    diagnostic.summary.passed = diagnostic.checks.filter(c => c.status === 'success').length
    diagnostic.summary.failed = diagnostic.checks.filter(c => c.status === 'error').length
    diagnostic.summary.warnings = diagnostic.checks.filter(c => c.status === 'warning').length

    console.log('✅ Diagnostic SMS terminé:', diagnostic.summary)

    return NextResponse.json({
      success: true,
      diagnostic
    })
    
  } catch (error) {
    console.error('❌ Erreur diagnostic SMS:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      diagnostic: {
        timestamp: new Date().toISOString(),
        error: 'Diagnostic interrompu par une erreur'
      }
    }, { status: 500 })
  }
}
