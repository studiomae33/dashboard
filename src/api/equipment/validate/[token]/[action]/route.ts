import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Valider/Rejeter une demande de location via token
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string; action: string } }
) {
  try {
    const { token, action } = params

    if (!token || !['confirm', 'reject'].includes(action)) {
      return NextResponse.json(
        { message: 'Paramètres invalides' },
        { status: 400 }
      )
    }

    // Trouver la demande avec ce token
    const equipmentRequest = await prisma.equipmentRequest.findUnique({
      where: { validationToken: token },
      include: {
        quoteRequest: {
          include: {
            client: true,
          },
        },
      },
    })

    if (!equipmentRequest) {
      return NextResponse.json(
        { message: 'Demande non trouvée ou token invalide' },
        { status: 404 }
      )
    }

    // Vérifier que la demande n'a pas déjà été traitée
    if (equipmentRequest.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'Cette demande a déjà été traitée' },
        { status: 400 }
      )
    }

    if (action === 'confirm') {
      // Confirmer la demande
      await prisma.equipmentRequest.update({
        where: { id: equipmentRequest.id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          confirmedBy: 'contact@studiomae.fr', // Email par défaut du loueur
        },
      })

      // Log de l'événement
      await prisma.eventLog.create({
        data: {
          entityType: 'EQUIPMENT_REQUEST',
          entityId: equipmentRequest.id,
          action: 'EQUIPMENT_CONFIRMED',
          payload: JSON.stringify({
            quoteReference: equipmentRequest.quoteRequest.reference,
            confirmedAt: new Date(),
          }),
        },
      })

      return NextResponse.json({
        message: 'Matériel confirmé avec succès !',
        status: 'confirmed',
      })
    } else {
      // Pour le rejet, on va rediriger vers une page avec un formulaire
      const rejectionUrl = `/equipment/reject/${token}`
      return NextResponse.redirect(new URL(rejectionUrl, request.url))
    }
  } catch (error) {
    console.error('Erreur lors de la validation:', error)
    return NextResponse.json(
      { message: 'Erreur lors de la validation' },
      { status: 500 }
    )
  }
}

// POST - Rejeter une demande avec raison
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string; action: string } }
) {
  try {
    const { token, action } = params
    const { reason } = await request.json()

    if (action !== 'reject' || !reason) {
      return NextResponse.json(
        { message: 'Paramètres invalides' },
        { status: 400 }
      )
    }

    // Trouver la demande avec ce token
    const equipmentRequest = await prisma.equipmentRequest.findUnique({
      where: { validationToken: token },
      include: {
        quoteRequest: {
          include: {
            client: true,
          },
        },
      },
    })

    if (!equipmentRequest) {
      return NextResponse.json(
        { message: 'Demande non trouvée ou token invalide' },
        { status: 404 }
      )
    }

    // Vérifier que la demande n'a pas déjà été traitée
    if (equipmentRequest.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'Cette demande a déjà été traitée' },
        { status: 400 }
      )
    }

    // Rejeter la demande
    await prisma.equipmentRequest.update({
      where: { id: equipmentRequest.id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy: 'contact@studiomae.fr',
        rejectionReason: reason,
      },
    })

    // Log de l'événement
    await prisma.eventLog.create({
      data: {
        entityType: 'EQUIPMENT_REQUEST',
        entityId: equipmentRequest.id,
        action: 'EQUIPMENT_REJECTED',
        payload: JSON.stringify({
          quoteReference: equipmentRequest.quoteRequest.reference,
          rejectionReason: reason,
          rejectedAt: new Date(),
        }),
      },
    })

    return NextResponse.json({
      message: 'Demande rejetée avec succès',
      status: 'rejected',
    })
  } catch (error) {
    console.error('Erreur lors du rejet:', error)
    return NextResponse.json(
      { message: 'Erreur lors du rejet' },
      { status: 500 }
    )
  }
}
