import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET() {
  try {
    console.log('=== TEST EMAIL SIMPLE ===')
    
    // Vérifier les variables d'environnement
    const apiKey = process.env.RESEND_API_KEY
    const senderEmail = process.env.SENDER_EMAIL
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Pas de clé API Resend' }, { status: 400 })
    }
    
    if (!senderEmail) {
      return NextResponse.json({ error: 'Pas d\'adresse sender configurée' }, { status: 400 })
    }
    
    // Test direct avec Resend
    const resend = new Resend(apiKey)
    
    const result = await resend.emails.send({
      from: `Studio MAE <${senderEmail}>`,
      to: 'contact@antoineaugis.com',
      subject: 'Test email - Studio MAE',
      html: `
        <h1>Test d'envoi d'email</h1>
        <p>Ceci est un test pour vérifier que l'envoi d'emails fonctionne.</p>
        <p>Clé API: ${apiKey.substring(0, 10)}...</p>
        <p>Sender: ${senderEmail}</p>
        <p>Date: ${new Date().toLocaleString()}</p>
      `
    })
    
    console.log('Email envoyé avec succès:', result)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email envoyé !',
      id: result.data?.id,
      from: senderEmail,
      to: 'contact@antoineaugis.com'
    })
    
  } catch (error) {
    console.error('Erreur envoi email:', error)
    return NextResponse.json({ 
      error: 'Échec envoi email', 
      details: error.message 
    }, { status: 500 })
  }
}
