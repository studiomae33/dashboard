import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateValidationToken } from '@/lib/token'
import { sendEquipmentRequestEmail } from '@/lib/email'

// GET - Récupérer toutes les demandes de location
export async function GET() {
  try {
    const equipmentRequests = await prisma.equipmentRequest.findMany({
      include: {
        quoteRequest: {
          include: {
            client: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(equipmentRequests)
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error)
    return NextResponse.json(
      { message: 'Erreur lors de la récupération des demandes' },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle demande de location
export async function POST(request: NextRequest) {
  try {
    const { quoteRequestId, equipment } = await request.json()

    if (!quoteRequestId || !equipment) {
      return NextResponse.json(
        { message: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Vérifier que le devis existe
    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id: quoteRequestId },
      include: { client: true },
    })

    if (!quoteRequest) {
      return NextResponse.json(
        { message: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    // Générer un token de validation
    const validationToken = await generateValidationToken(quoteRequestId)

    // Créer la demande de location
    const equipmentRequest = await prisma.equipmentRequest.create({
      data: {
        quoteRequestId,
        equipment,
        validationToken,
      },
      include: {
        quoteRequest: {
          include: {
            client: true,
          },
        },
      },
    })

    // Envoyer l'email de demande de location
    try {
      await sendEquipmentRequestEmail(equipmentRequest.id)
      console.log('✅ Email de demande de location envoyé')
    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', emailError)
      // Ne pas faire échouer la création de la demande si l'email échoue
    }

    // Log de l'événement
    await prisma.eventLog.create({
      data: {
        entityType: 'EQUIPMENT_REQUEST',
        entityId: equipmentRequest.id,
        action: 'EQUIPMENT_REQUEST_CREATED',
        payload: JSON.stringify({
          quoteReference: quoteRequest.reference,
          equipment,
          clientEmail: quoteRequest.client.email,
        }),
      },
    })

    return NextResponse.json(equipmentRequest)
  } catch (error) {
    console.error('Erreur lors de la création de la demande:', error)
    return NextResponse.json(
      { message: 'Erreur lors de la création de la demande' },
      { status: 500 }
    )
  }
}
