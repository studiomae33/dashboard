import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth.config'

// Endpoint pour tester manuellement le système de rappels depuis l'admin
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    console.log('🧪 Test manuel du système de rappels...')
    
    // Appeler l'endpoint de cron job
    const cronUrl = process.env.NEXTAUTH_URL 
      ? `${process.env.NEXTAUTH_URL}/api/cron/location-reminders`
      : 'http://localhost:3000/api/cron/location-reminders'
    
    const response = await fetch(cronUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Test de rappels exécuté avec succès',
        result
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors du test',
        details: result
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Erreur test rappels:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
