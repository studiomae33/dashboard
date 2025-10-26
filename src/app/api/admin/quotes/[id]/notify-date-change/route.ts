import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth.config'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { oldStartDate, oldEndDate, newStartDate, newEndDate } = body

    // Récupérer le devis et les informations client
    const quote = await prisma.quoteRequest.findUnique({
      where: { id },
      include: {
        client: true,
      }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Récupérer les paramètres email
    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' }
    })

    if (!settings?.resendApiKey || !settings?.senderEmail) {
      return NextResponse.json(
        { error: 'Configuration email manquante' },
        { status: 500 }
      )
    }

    // Formatter les dates
    const formatDateTime = (dateStr: string) => {
      const date = new Date(dateStr)
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // Créer le contenu de l'email
    const subject = `Modification des dates de votre réservation - ${quote.reference}`
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Modification de votre réservation</h2>
        
        <p>Bonjour ${quote.client.firstName},</p>
        
        <p>Nous vous informons que les dates de votre réservation <strong>${quote.reference}</strong> ont été modifiées :</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #dc3545; margin-top: 0;">Anciennes dates :</h3>
          <p style="margin: 5px 0;"><strong>Début :</strong> ${formatDateTime(oldStartDate)}</p>
          <p style="margin: 5px 0;"><strong>Fin :</strong> ${formatDateTime(oldEndDate)}</p>
          
          <h3 style="color: #28a745; margin-bottom: 0;">Nouvelles dates :</h3>
          <p style="margin: 5px 0;"><strong>Début :</strong> ${formatDateTime(newStartDate)}</p>
          <p style="margin: 5px 0;"><strong>Fin :</strong> ${formatDateTime(newEndDate)}</p>
        </div>
        
        <p><strong>Type de fond :</strong> ${quote.background}</p>
        
        <p>Si vous avez des questions concernant cette modification, n'hésitez pas à nous contacter.</p>
        
        <p>Cordialement,<br>
        L'équipe ${settings.studioName}</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          ${settings.studioName}<br>
          ${settings.studioAddress}<br>
          ${settings.studioPhone}<br>
          ${settings.studioEmail}
        </p>
      </div>
    `

    // Initialiser Resend
    const resend = new Resend(settings.resendApiKey)
    const isDevelopment = process.env.NODE_ENV === 'development'

    let result
    if (isDevelopment) {
      // Mode développement - afficher l'email dans la console
      console.log('\n=== EMAIL MODIFICATION DATES (MODE DÉVELOPPEMENT) ===')
      console.log('De:', settings.senderEmail)
      console.log('À:', quote.client.email)
      console.log('Sujet:', subject)
      console.log('HTML Content:')
      console.log(htmlContent.substring(0, 500) + '...')
      console.log('================================================\n')
      
      // Simuler une réponse réussie
      result = { data: { id: 'dev-' + Date.now() } }
    } else {
      // Envoyer l'email via Resend
      result = await resend.emails.send({
        from: settings.senderEmail,
        to: quote.client.email,
        subject,
        html: htmlContent,
      })
    }

    // Logger l'envoi de l'email
    await prisma.eventLog.create({
      data: {
        entityType: 'QUOTE',
        entityId: quote.id,
        action: 'DATE_CHANGE_EMAIL_SENT',
        payload: JSON.stringify({
          recipient: quote.client.email,
          oldDates: { start: oldStartDate, end: oldEndDate },
          newDates: { start: newStartDate, end: newEndDate }
        }),
      }
    })

    return NextResponse.json({ 
      message: 'Email de notification envoyé avec succès',
      recipient: quote.client.email 
    })

  } catch (error) {
    console.error('Erreur envoi email modification:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'envoi de l\'email' }, { status: 500 })
  }
}
