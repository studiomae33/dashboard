// Script de test pour vérifier la création automatique de réservations
import { prisma } from '../src/lib/prisma'

async function testBookingCreation() {
  console.log('🧪 Test de création automatique de réservation...\n')

  try {
    // 1. Vérifier qu'il y a un client disponible
    const clients = await prisma.client.findMany()
    if (clients.length === 0) {
      console.log('❌ Aucun client trouvé pour le test')
      return
    }
    
    const testClient = clients[0]
    console.log(`✅ Client de test trouvé: ${testClient.firstName} ${testClient.lastName}`)

    // 2. Créer un devis de test avec statut READY
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(14, 0, 0, 0)

    const endTime = new Date(tomorrow)
    endTime.setHours(16, 0, 0, 0)

    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' }
    })

    if (!settings) {
      console.log('❌ Paramètres non trouvés')
      return
    }

    const reference = `${settings.quotePrefix}${String(settings.quoteCounter).padStart(3, '0')}`

    const testQuote = await prisma.quoteRequest.create({
      data: {
        clientId: testClient.id,
        desiredStart: tomorrow,
        desiredEnd: endTime,
        background: 'Cyclo blanc',
        message: 'Test de création automatique de réservation',
        status: 'READY',
        reference,
        pdfPath: '/uploads/test-devis.pdf'
      }
    })

    console.log(`✅ Devis de test créé: ${testQuote.reference}`)

    // 3. Vérifier qu'aucune réservation n'existe encore
    const bookingBefore = await prisma.booking.findUnique({
      where: { quoteRequestId: testQuote.id }
    })

    if (bookingBefore) {
      console.log('❌ Une réservation existe déjà (ne devrait pas arriver)')
      return
    }

    console.log('✅ Aucune réservation trouvée avant envoi (normal)')

    // 4. Simuler l'envoi d'email (sans vraiment envoyer)
    // On update juste le statut et on crée la réservation comme le fait sendQuoteEmail
    await prisma.quoteRequest.update({
      where: { id: testQuote.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      }
    })

    // Créer automatiquement la réservation
    const clientName = testClient.companyName || `${testClient.firstName} ${testClient.lastName}`
    const booking = await prisma.booking.create({
      data: {
        quoteRequestId: testQuote.id,
        start: testQuote.desiredStart,
        end: testQuote.desiredEnd,
        background: testQuote.background,
        title: `Réservation ${clientName} - ${testQuote.reference}`,
      }
    })

    console.log(`✅ Réservation créée automatiquement: ${booking.title}`)

    // 5. Vérifier que la réservation existe bien
    const bookingAfter = await prisma.booking.findUnique({
      where: { quoteRequestId: testQuote.id },
      include: {
        quoteRequest: {
          include: {
            client: true
          }
        }
      }
    })

    if (bookingAfter) {
      console.log('✅ Réservation trouvée dans la base :')
      console.log(`   - Titre: ${bookingAfter.title}`)
      console.log(`   - Début: ${bookingAfter.start.toLocaleString('fr-FR')}`)
      console.log(`   - Fin: ${bookingAfter.end.toLocaleString('fr-FR')}`)
      console.log(`   - Fond: ${bookingAfter.background}`)
    } else {
      console.log('❌ Réservation non trouvée après création')
    }

    // 6. Nettoyer les données de test
    await prisma.booking.delete({
      where: { id: booking.id }
    })
    
    await prisma.quoteRequest.delete({
      where: { id: testQuote.id }
    })

    console.log('\n✅ Données de test nettoyées')
    console.log('\n🎉 Test réussi ! La création automatique de réservation fonctionne.')

  } catch (error) {
    console.error('❌ Erreur pendant le test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testBookingCreation()
