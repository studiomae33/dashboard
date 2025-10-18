import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@studiomae.fr' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@studiomae.fr',
      password: hashedPassword,
      name: 'Administrateur',
    },
  })

  // Create settings
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      studioName: 'Studio MAE',
      studioAddress: '123 Rue de la Photographie, 75001 Paris',
      studioPhone: '01 23 45 67 89',
      studioEmail: 'contact@studiomae.fr',
      senderEmail: 'devis@studiomae.fr',
    },
  })

  // Create test clients (only if none exist)
  const existingClientsCount = await prisma.client.count()
  
  let client1, client2, client3
  
  if (existingClientsCount === 0) {
    client1 = await prisma.client.create({
      data: {
        companyName: 'Tech Corp',
        firstName: 'Marie',
        lastName: 'Dupont',
        email: 'marie.dupont@techcorp.fr',
        phone: '01 23 45 67 89',
        billingAddress: '456 Avenue des Entreprises, 75002 Paris',
        notes: 'Client régulier, préfère les fonds blancs',
      },
    })

    client2 = await prisma.client.create({
      data: {
        firstName: 'Pierre',
        lastName: 'Martin',
        email: 'pierre.martin@example.fr',
        phone: '06 12 34 56 78',
        billingAddress: '789 Rue du Commerce, 69001 Lyon',
      },
    })

    client3 = await prisma.client.create({
      data: {
        companyName: 'StartupXYZ',
        firstName: 'Sophie',
        lastName: 'Bernard',
        email: 'sophie@startupxyz.fr',
        phone: '04 56 78 90 12',
        billingAddress: '321 Boulevard Innovation, 13001 Marseille',
        notes: 'Nouveau client, demande des photos corporate',
      },
    })
    
    console.log('✅ Clients de test créés')
  } else {
    console.log('ℹ️ Clients existants trouvés, pas de création')
    // Récupérer les clients existants pour les devis
    const clients = await prisma.client.findMany({ take: 3 })
    client1 = clients[0]
    client2 = clients[1] 
    client3 = clients[2]
  }

  // Create quote requests (only if none exist and we have clients)
  const existingQuotesCount = await prisma.quoteRequest.count()
  
  if (existingQuotesCount === 0 && client1 && client2 && client3) {
    const quote1 = await prisma.quoteRequest.create({
    data: {
      clientId: client1.id,
      reference: 'DE20250001',
      desiredStart: new Date('2025-01-15T09:00:00Z'),
      desiredEnd: new Date('2025-01-15T17:00:00Z'),
      background: 'Fond blanc',
      message: 'Photos corporate pour équipe de 10 personnes',
      status: 'SENT',
      sentAt: new Date('2025-01-10T10:00:00Z'),
    },
  })

  const quote2 = await prisma.quoteRequest.create({
    data: {
      clientId: client2.id,
      reference: 'DE20250002',
      desiredStart: new Date('2025-01-20T14:00:00Z'),
      desiredEnd: new Date('2025-01-20T18:00:00Z'),
      background: 'Fond noir',
      message: 'Portraits professionnels individuels',
      status: 'SIGNED',
      sentAt: new Date('2025-01-12T14:30:00Z'),
      signedAt: new Date('2025-01-13T16:45:00Z'),
      signedIp: '192.168.1.100',
    },
  })

  const quote3 = await prisma.quoteRequest.create({
    data: {
      clientId: client3.id,
      reference: 'DE20250003',
      desiredStart: new Date('2025-02-01T10:00:00Z'),
      desiredEnd: new Date('2025-02-01T16:00:00Z'),
      background: 'Fond coloré',
      message: 'Shooting produits pour site e-commerce',
      status: 'READY',
    },
  })

  const quote4 = await prisma.quoteRequest.create({
    data: {
      clientId: client1.id,
      reference: 'DE20250004',
      desiredStart: new Date('2025-02-10T09:00:00Z'),
      desiredEnd: new Date('2025-02-10T12:00:00Z'),
      background: 'Fond blanc',
      message: 'Photos headshots pour nouveaux employés',
      status: 'INVOICED',
      sentAt: new Date('2025-01-05T09:00:00Z'),
      signedAt: new Date('2025-01-06T11:30:00Z'),
      signedIp: '192.168.1.101',
      invoiceRef: 'FA20250001',
      invoiceAmountTTC: 1200.00,
    },
  })

  const quote5 = await prisma.quoteRequest.create({
    data: {
      clientId: client2.id,
      reference: 'DE20250005',
      desiredStart: new Date('2025-03-01T13:00:00Z'),
      desiredEnd: new Date('2025-03-01T17:00:00Z'),
      background: 'Fond neutre',
      message: 'Session photo famille',
      status: 'DRAFT',
    },
  })

  // Create booking for signed quote
  await prisma.booking.create({
    data: {
      quoteRequestId: quote2.id,
      start: quote2.desiredStart,
      end: quote2.desiredEnd,
      background: quote2.background,
      title: `${client2.firstName} ${client2.lastName} - Portraits`,
    },
  })

  // Create booking for invoiced quote
  await prisma.booking.create({
    data: {
      quoteRequestId: quote4.id,
      start: quote4.desiredStart,
      end: quote4.desiredEnd,
      background: quote4.background,
      title: `${client1.companyName} - Headshots`,
    },
  })

  // Create event logs
  await prisma.eventLog.createMany({
    data: [
      {
        entityType: 'QUOTE',
        entityId: quote1.id,
        action: 'CREATED',
        payload: JSON.stringify({ status: 'DRAFT' }),
      },
      {
        entityType: 'QUOTE',
        entityId: quote1.id,
        action: 'STATUS_CHANGED',
        payload: JSON.stringify({ from: 'DRAFT', to: 'SENT' }),
      },
      {
        entityType: 'QUOTE',
        entityId: quote2.id,
        action: 'CREATED',
        payload: JSON.stringify({ status: 'DRAFT' }),
      },
      {
        entityType: 'QUOTE',
        entityId: quote2.id,
        action: 'STATUS_CHANGED',
        payload: JSON.stringify({ from: 'DRAFT', to: 'SIGNED' }),
      },
      {
        entityType: 'QUOTE',
        entityId: quote4.id,
        action: 'STATUS_CHANGED',
        payload: JSON.stringify({ from: 'SIGNED', to: 'INVOICED' }),
      },
    ],
  })

    // Update counters only if quotes were created
    await prisma.settings.update({
      where: { id: 'singleton' },
      data: {
        quoteCounter: 6,
        invoiceCounter: 2,
      },
    })
    
    console.log('✅ Devis de test créés')
  } else {
    console.log('ℹ️ Devis existants trouvés ou pas de clients, pas de création')
  }

  console.log('✅ Database seeded successfully!')
  console.log(`👤 Admin user: ${admin.email}`)
  console.log(`📊 Total clients: ${await prisma.client.count()}`)
  console.log(`📋 Total quote requests: ${await prisma.quoteRequest.count()}`)
  console.log(`📅 Total bookings: ${await prisma.booking.count()}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
