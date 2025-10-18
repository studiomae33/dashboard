import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { quoteRequests: true }
        }
      }
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('Erreur clients:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, companyName, email, phone, billingAddress, notes } = body

    // Vérifier que l'email n'existe pas déjà
    const existingClient = await prisma.client.findUnique({
      where: { email }
    })

    if (existingClient) {
      return NextResponse.json({ error: 'Un client avec cet email existe déjà' }, { status: 400 })
    }

    const client = await prisma.client.create({
      data: {
        firstName,
        lastName,
        companyName: companyName || null,
        email,
        phone: phone || null,
        billingAddress: billingAddress || null,
        notes: notes || null,
      }
    })

    // Log de l'événement
    await prisma.eventLog.create({
      data: {
        entityType: 'CLIENT',
        entityId: client.id,
        action: 'CREATED',
        payload: JSON.stringify({ clientId: client.id, email: client.email }),
      }
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Erreur création client:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
