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
    
    // Données de test pour le SMS
    const testData = {
      bookingId: 'test-123',
      clientName: 'Client Test',
      quoteReference: 'TEST-2024',
      locationDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // Dans 48h
      locationTime: '14:30',
      background: 'Cyclorama blanc'
    }
    
    const smsResults = await sendLocationReminderSMS(testData)
    
    return NextResponse.json({
      success: true,
      message: 'SMS de test envoyé avec succès',
      results: smsResults,
      testData
    })
    
  } catch (error) {
    console.error('❌ Erreur envoi SMS de test:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
