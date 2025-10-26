import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json(
        { message: 'Token manquant' },
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

    return NextResponse.json(equipmentRequest)
  } catch (error) {
    console.error('Erreur lors de la récupération des détails:', error)
    return NextResponse.json(
      { message: 'Erreur lors de la récupération des détails' },
      { status: 500 }
    )
  }
}
