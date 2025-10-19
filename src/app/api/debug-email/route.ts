import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('\n=== DEBUG EMAIL PRODUCTION ===')
    
    // 1. Vérifier les variables d'environnement
    const apiKey = process.env.RESEND_API_KEY
    const senderEmail = process.env.SENDER_EMAIL
    const nextAuthUrl = process.env.NEXTAUTH_URL
    
    console.log('Variables d\'environnement:')
    console.log('- RESEND_API_KEY:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MANQUANTE')
    console.log('- SENDER_EMAIL:', senderEmail || 'MANQUANTE') 
    console.log('- NEXTAUTH_URL:', nextAuthUrl || 'MANQUANTE')
    
    // 2. Vérifier la connexion à la base de données
    let settings = null
    try {
      settings = await prisma.settings.findUnique({
        where: { id: 'singleton' }
      })
      console.log('Base de données: OK')
      console.log('Settings trouvés:', !!settings)
      if (settings) {
        console.log('- studioName:', settings.studioName)
        console.log('- senderEmail:', settings.senderEmail)
      }
    } catch (dbError) {
      console.log('Erreur base de données:', dbError)
    }
    
    // 3. Test Resend si clé API disponible
    if (apiKey && apiKey !== 'your-resend-api-key') {
      try {
        const resend = new Resend(apiKey)
        console.log('Instance Resend créée: OK')
        
        // Test simple d'envoi
        const result = await resend.emails.send({
          from: `Debug Test <${senderEmail}>`,
          to: 'contact@antoineaugis.com',
          subject: '🐛 Debug Test Production',
          html: '<h1>Test de debug en production</h1><p>Si vous recevez ceci, Resend fonctionne !</p>'
        })
        
        console.log('Test envoi Resend:', result)
        
        return NextResponse.json({
          success: true,
          message: 'Debug terminé - email envoyé',
          details: {
            hasApiKey: !!apiKey,
            hasSenderEmail: !!senderEmail,
            hasSettings: !!settings,
            emailResult: result
          }
        })
      } catch (emailError) {
        console.error('Erreur envoi test:', emailError)
        return NextResponse.json({
          error: 'Erreur lors du test d\'envoi',
          details: {
            hasApiKey: !!apiKey,
            hasSenderEmail: !!senderEmail,
            emailError: emailError instanceof Error ? emailError.message : String(emailError)
          }
        }, { status: 500 })
      }
    } else {
      return NextResponse.json({
        error: 'Clé API Resend manquante ou invalide',
        details: {
          hasApiKey: !!apiKey,
          hasSenderEmail: !!senderEmail
        }
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Erreur debug:', error)
    return NextResponse.json({
      error: 'Erreur lors du debug',
      details: {
        message: error instanceof Error ? error.message : String(error)
      }
    }, { status: 500 })
  }
}
