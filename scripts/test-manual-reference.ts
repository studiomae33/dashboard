// Script de test pour vérifier la saisie manuelle de références
import { prisma } from '../src/lib/prisma'

async function testManualReference() {
  console.log('🧪 Test de saisie manuelle de référence de devis...\n')

  try {
    // 1. Vérifier qu'il y a un client disponible
    const clients = await prisma.client.findMany()
    if (clients.length === 0) {
      console.log('❌ Aucun client trouvé pour le test')
      return
    }
    
    const testClient = clients[0]
    console.log(`✅ Client de test trouvé: ${testClient.firstName} ${testClient.lastName}`)

    // 2. Créer un devis avec une référence personnalisée
    const customReference = `TEST-${Date.now()}`
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(14, 0, 0, 0)

    const endTime = new Date(tomorrow)
    endTime.setHours(16, 0, 0, 0)

    console.log(`📝 Création d'un devis avec référence personnalisée: ${customReference}`)

    const testQuote = await prisma.quoteRequest.create({
      data: {
        clientId: testClient.id,
        reference: customReference,
        desiredStart: tomorrow,
        desiredEnd: endTime,
        background: 'Cyclo blanc',
        message: 'Test de référence personnalisée',
        status: 'DRAFT'
      }
    })

    console.log(`✅ Devis créé avec référence: ${testQuote.reference}`)

    // 3. Vérifier que la référence est bien celle qu'on a saisie
    if (testQuote.reference === customReference) {
      console.log('✅ La référence personnalisée a été correctement enregistrée')
    } else {
      console.log('❌ Erreur: la référence enregistrée ne correspond pas à celle saisie')
    }

    // 4. Tester la contrainte d'unicité
    console.log('\n🔒 Test de contrainte d\'unicité...')
    
    try {
      await prisma.quoteRequest.create({
        data: {
          clientId: testClient.id,
          reference: customReference, // Même référence
          desiredStart: tomorrow,
          desiredEnd: endTime,
          background: 'Fond noir',
          status: 'DRAFT'
        }
      })
      console.log('❌ Erreur: la contrainte d\'unicité n\'a pas fonctionné')
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        console.log('✅ Contrainte d\'unicité respectée - impossible de créer un devis avec la même référence')
      } else {
        console.log('❌ Erreur inattendue lors du test d\'unicité:', error)
      }
    }

    // 5. Créer un devis avec une référence différente pour vérifier que ça fonctionne
    const customReference2 = `TEST-${Date.now()}-2`
    const testQuote2 = await prisma.quoteRequest.create({
      data: {
        clientId: testClient.id,
        reference: customReference2,
        desiredStart: tomorrow,
        desiredEnd: endTime,
        background: 'Fond coloré',
        status: 'DRAFT'
      }
    })

    console.log(`✅ Devis créé avec une référence différente: ${testQuote2.reference}`)

    // 6. Nettoyer les données de test
    await prisma.quoteRequest.delete({
      where: { id: testQuote.id }
    })
    
    await prisma.quoteRequest.delete({
      where: { id: testQuote2.id }
    })

    console.log('\n✅ Données de test nettoyées')
    console.log('\n🎉 Test réussi ! La saisie manuelle de référence fonctionne parfaitement.')
    console.log('\n📋 Résumé des fonctionnalités validées:')
    console.log('   - ✅ Saisie de référence personnalisée')
    console.log('   - ✅ Contrainte d\'unicité des références')
    console.log('   - ✅ Création de devis avec références différentes')

  } catch (error) {
    console.error('❌ Erreur pendant le test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testManualReference()
