import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendLocationReminderSMS } from '@/lib/sms'
import { sendLocationReminderEmail } from '@/lib/email'

// Cron job quotidien pour envoyer les rappels 48h avant les locations
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Début du job de rappels de location...')
    
    // Calculer la date cible (dans 48h exactement)
    const now = new Date()
    const targetDate = new Date(now.getTime() + 48 * 60 * 60 * 1000) // +48 heures
    
    // Début et fin de la journée cible (pour trouver toutes les locations du jour J+2)
    const startOfTargetDay = new Date(targetDate)
    startOfTargetDay.setHours(0, 0, 0, 0)
    
    const endOfTargetDay = new Date(targetDate)
    endOfTargetDay.setHours(23, 59, 59, 999)
    
    console.log('📅 Recherche des locations entre:', {
      start: startOfTargetDay.toISOString(),
      end: endOfTargetDay.toISOString(),
      targetDay: targetDate.toDateString()
    })
    
    // Chercher toutes les réservations confirmées qui commencent dans 48h
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        AND: [
          {
            start: {
              gte: startOfTargetDay,
              lte: endOfTargetDay
            }
          },
          {
            quoteRequest: {
              status: {
                in: ['SIGNED', 'PAYMENT_PENDING', 'ONSITE_PAYMENT', 'PAID', 'INVOICED']
              }
            }
          }
        ]
      },
      include: {
        quoteRequest: {
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
                companyName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        start: 'asc'
      }
    })
    
    console.log(`📋 ${upcomingBookings.length} location(s) trouvée(s) pour dans 48h`)
    
    let smssSent = 0
    let emailsSent = 0
    let errors = 0
    
    for (const booking of upcomingBookings) {
      try {
        const clientName = booking.quoteRequest.client.companyName || 
                          `${booking.quoteRequest.client.firstName} ${booking.quoteRequest.client.lastName}`
        
        const locationTime = new Intl.DateTimeFormat('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Paris'
        }).format(booking.start)
        
        console.log(`📱 Envoi SMS pour: ${clientName} - ${booking.quoteRequest.reference}`)
        
        const smsResults = await sendLocationReminderSMS({
          bookingId: booking.id,
          clientName,
          quoteReference: booking.quoteRequest.reference,
          locationDate: booking.start,
          locationTime,
          background: booking.background
        })
        
        // Log de l'événement
        await prisma.eventLog.create({
          data: {
            entityType: 'BOOKING',
            entityId: booking.id,
            action: 'REMINDER_SMS_SENT',
            payload: JSON.stringify({ 
              recipients: smsResults?.map(r => r.to) || [],
              success: smsResults?.filter(r => r.success).length || 0,
              total: smsResults?.length || 0,
              clientName,
              quoteReference: booking.quoteRequest.reference,
              locationDate: booking.start,
              reminderType: '48h_before'
            }),
          }
        })
        
        const successfulSms = smsResults?.filter(r => r.success).length || 0
        smssSent += successfulSms
        
        console.log(`✅ ${successfulSms} SMS envoyé(s) pour ${booking.quoteRequest.reference}`)
        
        // Envoyer l'email au client
        console.log(`📧 Envoi email de rappel au client: ${booking.quoteRequest.client.email}`)
        
        try {
          const emailResult = await sendLocationReminderEmail(booking.id)
          
          if (emailResult.success) {
            emailsSent++
            console.log(`✅ Email de rappel envoyé au client ${clientName} - ${booking.quoteRequest.reference}`)
          } else {
            console.warn(`⚠️ Échec envoi email au client ${clientName}`)
          }
        } catch (emailError) {
          console.error(`❌ Erreur envoi email au client ${clientName}:`, emailError)
          // Ne pas faire échouer tout le process pour une erreur d'email
        }
        
      } catch (error) {
        console.error(`❌ Erreur pour la location ${booking.id}:`, error)
        errors++
      }
    }
    
    const summary = {
      success: true,
      timestamp: now.toISOString(),
      targetDate: targetDate.toISOString(),
      bookingsFound: upcomingBookings.length,
      smssSent,
      emailsSent,
      errors,
      details: upcomingBookings.map(b => ({
        bookingId: b.id,
        client: b.quoteRequest.client.companyName || 
               `${b.quoteRequest.client.firstName} ${b.quoteRequest.client.lastName}`,
        reference: b.quoteRequest.reference,
        date: b.start.toISOString(),
        background: b.background
      }))
    }
    
    console.log('📊 Résumé du job de rappels:', summary)
    
    return NextResponse.json(summary)
    
  } catch (error) {
    console.error('❌ Erreur dans le job de rappels de location:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Version POST pour les tests manuels (avec authentification admin)
export async function POST(request: NextRequest) {
  try {
    // Pour les tests, on peut bypasser l'auth ou ajouter une clé secrète
    const body = await request.json()
    const testKey = body.testKey
    
    // Clé secrète pour les tests (optionnel)
    if (testKey !== process.env.CRON_TEST_KEY && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    
    // Réutiliser la logique GET
    return GET(request)
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
