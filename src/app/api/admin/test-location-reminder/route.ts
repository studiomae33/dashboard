import { NextRequest, NextResponse } from 'next/server'
import { sendLocationReminderEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, testKey, testEmail } = body

    // Clé secrète pour les tests (optionnel en dev)
    if (process.env.NODE_ENV === 'production' && testKey !== process.env.CRON_TEST_KEY) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Mode test avec email personnalisé
    if (testEmail) {
      console.log('🧪 Test email de rappel vers:', testEmail)
      
      // Créer des données de test
      const testData = {
        booking: {
          id: 'test-booking-id',
          start: new Date(Date.now() + 48 * 60 * 60 * 1000), // Dans 48h
          end: new Date(Date.now() + 48 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2h
          background: 'Fond blanc avec éclairage studio'
        },
        quote: {
          id: 'test-quote-id',
          reference: 'DE202500TEST',
          amountTTC: 450
        },
        client: {
          firstName: 'Test',
          lastName: 'Client',
          companyName: 'Studio Test',
          email: testEmail
        },
        settings: {
          studioName: 'Studio MAE',
          studioAddress: '46 rue Promis, 33100 Bordeaux',
          studioPhone: '05.54.54.70.93',
          studioEmail: 'contact@studiomae.fr',
          senderEmail: 'devis@mail.studiomae.fr'
        }
      }

      const { renderLocationReminderEmailHTML } = await import('@/lib/email')
      const { generateBookingInfoToken } = await import('@/lib/token')
      
      // Générer le HTML et envoyer directement
      const htmlContent = await renderLocationReminderEmailHTML(testData)
      
      const { Resend } = await import('resend')
      const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

      if (!resend) {
        return NextResponse.json({
          success: false,
          error: 'Service email non configuré (RESEND_API_KEY manquante)',
          testData: {
            message: 'Email de test généré mais non envoyé (pas de clé API)',
            to: testEmail,
            subject: `Test : Votre location au Studio MAE dans 48h - DE202500TEST`,
            htmlPreview: htmlContent.substring(0, 500) + '...'
          }
        })
      }

      try {
        const emailResult = await resend.emails.send({
          from: `${testData.settings.studioName} <${testData.settings.senderEmail}>`,
          to: testEmail,
          reply_to: testData.settings.studioEmail,
          subject: `Test : Votre location au ${testData.settings.studioName} dans 48h - ${testData.quote.reference}`,
          html: htmlContent,
        })

        return NextResponse.json({
          success: true,
          message: 'Email de test envoyé avec succès',
          result: {
            messageId: emailResult.data?.id,
            to: testEmail,
            testMode: true
          }
        })
      } catch (emailError) {
        console.error('❌ Erreur envoi email test:', emailError)
        return NextResponse.json({
          success: false,
          error: emailError instanceof Error ? emailError.message : 'Erreur envoi email'
        }, { status: 500 })
      }
    }

    // Mode normal avec bookingId
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId ou testEmail requis' }, { status: 400 })
    }

    console.log('🧪 Test envoi email de rappel pour booking:', bookingId)

    const result = await sendLocationReminderEmail(bookingId)

    return NextResponse.json({
      success: true,
      message: 'Email de rappel envoyé avec succès',
      result
    })

  } catch (error) {
    console.error('❌ Erreur test email rappel:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Liste des bookings disponibles pour test
    const { prisma } = await import('@/lib/prisma')
    
    const bookings = await prisma.booking.findMany({
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
        start: 'desc'
      },
      take: 10
    })

    const testData = bookings.map(booking => ({
      bookingId: booking.id,
      client: booking.quoteRequest.client.companyName || 
              `${booking.quoteRequest.client.firstName} ${booking.quoteRequest.client.lastName}`,
      email: booking.quoteRequest.client.email,
      reference: booking.quoteRequest.reference,
      start: booking.start,
      background: booking.background,
      status: booking.quoteRequest.status
    }))

    return NextResponse.json({
      message: 'Bookings disponibles pour test',
      bookings: testData
    })

  } catch (error) {
    console.error('❌ Erreur récupération bookings test:', error)
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
