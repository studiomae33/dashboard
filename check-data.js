const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('🔍 Vérification des données...')
    
    // Compter les devis
    const quotesCount = await prisma.quoteRequest.count()
    console.log(`📊 Total devis: ${quotesCount}`)
    
    // Compter les bookings
    const bookingsCount = await prisma.booking.count()
    console.log(`📊 Total bookings: ${bookingsCount}`)
    
    // Trouver les bookings orphelins
    const orphanBookings = await prisma.booking.findMany({
      where: {
        quoteRequest: null
      }
    })
    console.log(`🗑️ Bookings orphelins: ${orphanBookings.length}`)
    
    // Trouver les devis sans booking
    const quotesWithoutBooking = await prisma.quoteRequest.findMany({
      where: {
        booking: null
      }
    })
    console.log(`📋 Devis sans booking: ${quotesWithoutBooking.length}`)
    
    // Lister les bookings orphelins
    if (orphanBookings.length > 0) {
      console.log('\n🗑️ Détail des bookings orphelins:')
      orphanBookings.forEach(booking => {
        console.log(`   - ${booking.title} (${booking.id})`)
      })
    }
    
    // Lister les devis sans booking
    if (quotesWithoutBooking.length > 0) {
      console.log('\n📋 Détail des devis sans booking:')
      quotesWithoutBooking.forEach(quote => {
        console.log(`   - ${quote.reference} (${quote.id}) - Status: ${quote.status}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()
