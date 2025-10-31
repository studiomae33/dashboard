import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth.config'
import { sendLocationReminderSMS } from '@/lib/sms'

// Endpoint pour envoyer un SMS de test depuis l'admin
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    console.log('📱 Envoi d\'un SMS de test...')
    
    // Vérifications préliminaires
    const preChecks = {
      environment: process.env.NODE_ENV || 'unknown',
      isDevelopmentMode: !process.env.OVH_APPLICATION_KEY || process.env.OVH_APPLICATION_KEY === 'your-ovh-application-key',
      hasOVHConfig: !!(process.env.OVH_APPLICATION_KEY && process.env.OVH_APPLICATION_SECRET && process.env.OVH_CONSUMER_KEY && process.env.OVH_SMS_SERVICE_NAME),
      adminNumbers: process.env.SMS_ADMIN_NUMBERS?.split(',').map(num => num.trim()) || [],
      timestamp: new Date().toISOString()
    }
    
    // Données de test pour le SMS
    const testData = {
      bookingId: 'test-' + Date.now(),
      clientName: 'Client Test SMS',
      quoteReference: 'TEST-' + new Date().getFullYear(),
      locationDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // Dans 48h
      locationTime: '14:30',
      background: 'Cyclorama blanc'
    }
    
    console.log('🔍 Pré-vérifications:', preChecks)
    
    let smsResults: any[] = []
    let error: any = null
    
    try {
      smsResults = await sendLocationReminderSMS(testData)
      console.log('📱 Résultats SMS:', smsResults)
    } catch (smsError) {
      error = smsError
      console.error('❌ Erreur lors de l\'envoi SMS:', smsError)
    }
    
    return NextResponse.json({
      success: !error,
      message: error ? 'Erreur lors de l\'envoi SMS' : 'Test SMS terminé',
      preChecks,
      testData,
      results: smsResults,
      error: error ? (error instanceof Error ? error.message : String(error)) : null,
      summary: {
        totalRecipients: preChecks.adminNumbers.length,
        successfulSends: smsResults.filter(r => r.success).length,
        failedSends: smsResults.filter(r => !r.success).length,
        isDevelopmentMode: preChecks.isDevelopmentMode
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur critique lors du test SMS:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
