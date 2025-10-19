import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET() {
  try {
    console.log('\n=== DIAGNOSTIC COMPLET EMAIL ===')
    
    // 1. Vérifier les variables d'environnement
    const apiKey = process.env.RESEND_API_KEY
    const senderEmail = process.env.SENDER_EMAIL
    
    console.log('API Key présente:', !!apiKey)
    console.log('API Key preview:', apiKey?.substring(0, 15) + '...')
    console.log('Sender email:', senderEmail)
    
    if (!apiKey || !senderEmail) {
      return NextResponse.json({ 
        error: 'Configuration manquante',
        hasApiKey: !!apiKey,
        hasSenderEmail: !!senderEmail
      }, { status: 400 })
    }
    
    // 2. Test de connexion Resend
    const resend = new Resend(apiKey)
    
    // 3. Test d'envoi avec plus de détails
    console.log('Tentative d\'envoi email...')
    
    const emailData = {
      from: `Test Studio <${senderEmail}>`,
      to: ['contact@antoineaugis.com'],
      subject: `🧪 Test Resend - ${new Date().toLocaleTimeString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">🧪 Test d'envoi d'email</h1>
          <p>Ce test a été envoyé le <strong>${new Date().toLocaleString('fr-FR')}</strong></p>
          
          <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Informations techniques :</h3>
            <ul>
              <li><strong>Service:</strong> Resend</li>
              <li><strong>Expéditeur:</strong> ${senderEmail}</li>
              <li><strong>API Key:</strong> ${apiKey.substring(0, 15)}...</li>
              <li><strong>Timestamp:</strong> ${Date.now()}</li>
            </ul>
          </div>
          
          <p style="color: #666;">Si vous recevez cet email, la configuration fonctionne ! ✅</p>
        </div>
      `
    }
    
    console.log('Données email:', {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject
    })
    
    const result = await resend.emails.send(emailData)
    
    console.log('✅ Résultat Resend:', result)
    
    // 4. Vérifier le statut de l'email
    if (result.data?.id) {
      console.log('📧 ID de l\'email:', result.data.id)
      
      // Optionnel: récupérer plus d'infos sur l'email
      try {
        const emailInfo = await resend.emails.get(result.data.id)
        console.log('📊 Statut email:', emailInfo)
      } catch (infoError) {
        console.log('⚠️ Impossible de récupérer le statut:', infoError instanceof Error ? infoError.message : String(infoError))
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Email envoyé avec diagnostic complet !',
      details: {
        id: result.data?.id,
        from: emailData.from,
        to: emailData.to[0],
        subject: emailData.subject,
        timestamp: new Date().toISOString(),
        resendResponse: result
      }
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : undefined
    const errorStatusCode = error && typeof error === 'object' && 'statusCode' in error ? error.statusCode : undefined
    
    console.error('❌ ERREUR COMPLETE:', {
      message: errorMessage,
      stack: errorStack,
      code: errorCode,
      statusCode: errorStatusCode
    })
    
    return NextResponse.json({ 
      error: 'Échec envoi email avec diagnostic', 
      details: {
        message: errorMessage,
        code: errorCode,
        statusCode: errorStatusCode
      }
    }, { status: 500 })
  }
}
