// Script pour une base de données complètement vide (juste admin)
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createCleanSetup() {
  console.log('🧹 Configuration base vide (production-ready)...')

  try {
    // Supprimer toutes les données existantes
    console.log('🗑️ Nettoyage des données existantes...')
    await prisma.eventLog.deleteMany({})
    await prisma.booking.deleteMany({})
    await prisma.quoteRequest.deleteMany({})
    await prisma.client.deleteMany({})

    // Créer JUSTE l'utilisateur admin
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@studiomae.fr' },
      update: {},
      create: {
        email: 'admin@studiomae.fr',
        password: hashedPassword,
        name: 'Administrateur Studio MAE',
      }
    })

    console.log(`✅ Utilisateur admin: ${admin.email}`)

    // Créer/mettre à jour les paramètres
    const settings = await prisma.settings.upsert({
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

    console.log(`✅ Paramètres configurés`)

    // Statistiques finales
    const stats = {
      users: await prisma.user.count(),
      clients: await prisma.client.count(),
      quotes: await prisma.quoteRequest.count(),
      bookings: await prisma.booking.count(),
      logs: await prisma.eventLog.count(),
    }

    console.log('\n🎊 Base de données prête pour la production!')
    console.log('\n📊 Contenu de la base:')
    console.log(`   👤 Utilisateurs: ${stats.users}`)
    console.log(`   👥 Clients: ${stats.clients}`)
    console.log(`   📋 Devis: ${stats.quotes}`)
    console.log(`   📅 Réservations: ${stats.bookings}`)
    console.log(`   📝 Logs: ${stats.logs}`)

    console.log('\n🔑 Connexion admin:')
    console.log(`   📧 Email: admin@studiomae.fr`)
    console.log(`   🔑 Mot de passe: admin123`)

    console.log('\n✨ Vous pouvez maintenant créer vos vrais clients et devis!')

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createCleanSetup()
