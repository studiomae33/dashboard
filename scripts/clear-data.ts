import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function clearData() {
  console.log('🗑️ Suppression de toutes les données...')

  try {
    // Supprimer dans l'ordre des dépendances
    console.log('📋 Suppression des logs d\'événements...')
    await prisma.eventLog.deleteMany({})

    console.log('📅 Suppression des réservations...')
    await prisma.booking.deleteMany({})

    console.log('📋 Suppression des devis...')
    await prisma.quoteRequest.deleteMany({})

    console.log('👥 Suppression des clients...')
    await prisma.client.deleteMany({})

    // Remettre les compteurs à 1 (ou créer les paramètres s'ils n'existent pas)
    console.log('🔄 Remise à zéro des compteurs...')
    await prisma.settings.upsert({
      where: { id: 'singleton' },
      update: {
        quoteCounter: 1,
        invoiceCounter: 1,
      },
      create: {
        id: 'singleton',
        quoteCounter: 1,
        invoiceCounter: 1,
        quotePrefix: 'DE',
        invoicePrefix: 'FA',
        studioName: 'Studio MAE',
        studioAddress: '46 rue Promis, 33100 Bordeaux',
        studioPhone: '05.54.54.70.93',
        studioEmail: 'contact@studiomae.fr',
        senderEmail: 'contact@studiomae.fr',
      }
    })

    // S'assurer que l'utilisateur admin existe
    console.log('👤 Vérification utilisateur admin...')
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    await prisma.user.upsert({
      where: { email: 'admin@studiomae.fr' },
      update: {},
      create: {
        email: 'admin@studiomae.fr',
        password: hashedPassword,
        name: 'Administrateur Studio MAE',
      }
    })

    console.log('✅ Toutes les données ont été supprimées avec succès!')
    console.log('📊 Statistiques:')
    console.log(`   👤 Utilisateurs: ${await prisma.user.count()}`)
    console.log(`   👥 Clients: ${await prisma.client.count()}`)
    console.log(`   📋 Devis: ${await prisma.quoteRequest.count()}`)
    console.log(`   📅 Réservations: ${await prisma.booking.count()}`)
    console.log(`   📝 Logs: ${await prisma.eventLog.count()}`)
    
    console.log('\n🔑 Connexion admin:')
    console.log('   📧 Email: admin@studiomae.fr')
    console.log('   🔑 Mot de passe: admin123')
    console.log('\n✨ Base prête pour vos vrais clients et devis!')

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearData()
