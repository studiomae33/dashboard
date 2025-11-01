import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendLocationReminderEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testEmail } = body

    if (!testEmail) {
      return NextResponse.json({ error: 'testEmail requis' }, { status: 400 })
    }

    console.log('🧪 Création d\'une réservation de test pour envoyer un rappel avec vrai token...')
    
    // Créer un client de test
    const testClient = await prisma.client.upsert({
      where: { email: testEmail },
      update: {
        firstName: 'Test',
        lastName: 'Rappel',
        companyName: 'Studio Test'
      },
      create: {
        firstName: 'Test',
        lastName: 'Rappel',
        companyName: 'Studio Test',
        email: testEmail,
        phone: '0123456789'
      }
    })

    // Créer un devis de test
    const testQuote = await prisma.quoteRequest.create({
      data: {
        clientId: testClient.id,
        reference: `TEST${Date.now()}`,
        desiredStart: new Date(Date.now() + 48 * 60 * 60 * 1000), // Dans 48h
        desiredEnd: new Date(Date.now() + 48 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2h
        background: 'Fond blanc avec éclairage studio - TEST',
        message: 'Ceci est un test de rappel de location',
        amountTTC: 450,
        status: 'SIGNED'
      }
    })

    // Créer une réservation de test
    const testBooking = await prisma.booking.create({
      data: {
        quoteRequestId: testQuote.id,
        start: testQuote.desiredStart,
        end: testQuote.desiredEnd,
        background: testQuote.background,
        title: `Test Rappel - ${testClient.companyName || `${testClient.firstName} ${testClient.lastName}`}`,
      }
    })

    console.log('✅ Réservation de test créée:', {
      bookingId: testBooking.id,
      quoteRef: testQuote.reference,
      client: testClient.email
    })

    // Envoyer l'email de rappel avec le vrai booking
    try {
      const emailResult = await sendLocationReminderEmail(testBooking.id)
      
      console.log('✅ Email de rappel envoyé avec succès')

      return NextResponse.json({
        success: true,
        message: 'Email de rappel de test envoyé avec succès',
        result: {
          bookingId: testBooking.id,
          quoteReference: testQuote.reference,
          clientEmail: testClient.email,
          emailResult
        }
      })
    } catch (emailError) {
      console.error('❌ Erreur envoi email:', emailError)
      
      // Nettoyer les données de test en cas d'erreur d'email
      await prisma.booking.delete({ where: { id: testBooking.id } })
      await prisma.quoteRequest.delete({ where: { id: testQuote.id } })
      // Le client peut rester car il pourrait être réutilisé
      
      return NextResponse.json({
        success: false,
        error: emailError instanceof Error ? emailError.message : 'Erreur envoi email',
        details: 'Les données de test ont été nettoyées'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Erreur dans test-location-reminder-with-token:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
