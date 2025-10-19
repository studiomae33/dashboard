import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const result = await resend.emails.send({
      from: 'Studio MAE <onboarding@resend.dev>',
      to: ['antoineaugis@gmail.com'], // Remplacez par votre vraie adresse email
      subject: '🧪 Test d\'envoi d\'email - Studio MAE',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #060c20;">Test d'envoi d'email réussi ! 🎉</h1>
          <p>Félicitations ! Votre configuration Resend fonctionne parfaitement.</p>
          <p>Vous pouvez maintenant envoyer des emails depuis votre application Studio MAE.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 14px;">
            Ceci est un email de test envoyé depuis votre application dashboard.
          </p>
        </div>
      `
    })
    
    return NextResponse.json({ 
      success: true, 
      messageId: result.data?.id,
      message: 'Email envoyé avec succès !' 
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
