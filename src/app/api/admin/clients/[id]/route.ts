import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { quoteRequests: true }
        },
        quoteRequests: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            reference: true,
            status: true,
            createdAt: true,
            desiredStart: true,
            desiredEnd: true,
            background: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Erreur lors de la récupération du client:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, companyName, email, phone, billingAddress, notes } = body

    // Vérifier que le client existe
    const existingClient = await prisma.client.findUnique({
      where: { id: params.id }
    })

    if (!existingClient) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    // Vérifier que l'email n'est pas utilisé par un autre client
    if (email !== existingClient.email) {
      const clientWithEmail = await prisma.client.findUnique({
        where: { email }
      })

      if (clientWithEmail) {
        return NextResponse.json({ error: 'Un autre client utilise déjà cet email' }, { status: 400 })
      }
    }

    const updatedClient = await prisma.client.update({
      where: { id: params.id },
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

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Erreur lors de la modification du client:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que le client existe
    const existingClient = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { quoteRequests: true }
        }
      }
    })

    if (!existingClient) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    // Empêcher la suppression si le client a des devis
    if (existingClient._count.quoteRequests > 0) {
      return NextResponse.json({ 
        error: 'Impossible de supprimer un client qui a des devis associés' 
      }, { status: 400 })
    }

    await prisma.client.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Client supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du client:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
