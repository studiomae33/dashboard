// Script pour créer uniquement l'admin et les paramètres de base
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createMinimalSetup() {
  console.log('🌱 Création configuration minimale...')

  try {
    // 1. Créer l'utilisateur admin
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@studiomae.fr',
        password: hashedPassword,
        name: 'Administrateur Studio MAE',
      }
    })

    console.log(`✅ Utilisateur admin créé: ${admin.email}`)

    // 2. Créer les paramètres de base
    const settings = await prisma.settings.create({
      data: {
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

    console.log(`✅ Paramètres créés: ${settings.studioName}`)

    console.log('\n🎊 Configuration minimale terminée!')
    console.log('\n📝 Informations de connexion:')
    console.log(`   📧 Email: admin@studiomae.fr`)
    console.log(`   🔑 Mot de passe: admin123`)
    console.log('\n✨ Vous pouvez maintenant créer vos propres clients et devis!')

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createMinimalSetup()
