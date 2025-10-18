// Test simple pour vérifier le champ amountTTC
import { prisma } from '../src/lib/prisma'

async function testAmountTTCField() {
  console.log('🧪 Test du champ amountTTC...')
  
  try {
    // Essayer de créer un devis avec le champ amountTTC
    const testClient = await prisma.client.findFirst()
    
    if (!testClient) {
      console.log('❌ Aucun client trouvé')
      return
    }

    console.log(`✅ Client trouvé: ${testClient.firstName} ${testClient.lastName}`)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(14, 0, 0, 0)

    const endTime = new Date(tomorrow)
    endTime.setHours(16, 0, 0, 0)

    // Essayer de créer avec le champ amountTTC
    const testQuote = await prisma.quoteRequest.create({
      data: {
        clientId: testClient.id,
        reference: `TEST-AMOUNT-${Date.now()}`,
        desiredStart: tomorrow,
        desiredEnd: endTime,
        background: 'Test background',
        amountTTC: 150.50,
        status: 'DRAFT'
      }
    })

    console.log(`✅ Devis créé avec amountTTC: ${testQuote.amountTTC}€`)

    // Nettoyer
    await prisma.quoteRequest.delete({
      where: { id: testQuote.id }
    })

    console.log('✅ Test réussi ! Le champ amountTTC fonctionne.')

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAmountTTCField()
