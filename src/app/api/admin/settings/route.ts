import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' }
    })

    if (!settings) {
      // Créer les paramètres par défaut s'ils n'existent pas
      const defaultSettings = await prisma.settings.create({
        data: {
          id: 'singleton',
          studioName: 'Studio MAE',
          studioAddress: '46 rue Promis, 33100 Bordeaux',
          studioPhone: '05.54.54.70.93',
          studioEmail: 'contact@studiomae.fr',
          senderEmail: 'devis@mail.studiomae.fr',
        }
      })
      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()

    const settings = await prisma.settings.upsert({
      where: { id: 'singleton' },
      update: data,
      create: {
        id: 'singleton',
        ...data
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
